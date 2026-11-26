import Foundation
import WatchScheduleCore

#if canImport(HealthKit) && canImport(WorkoutKit)
import HealthKit
import WorkoutKit

/// A capability check failed or the app's OS cannot express the prescription.
/// The mapper has already rejected everything that is unsupported by design,
/// so these errors mean this device or this OS build cannot take the plan.
enum WorkoutPlanBuildError: Error, LocalizedError, Equatable {
    case unsupportedActivity(PlanSport)
    case unsupportedGoal(path: String)
    case unsupportedAlert(path: String, metric: PlannedTarget.Metric)
    case emptyBlocks
    case poolSwimmingUnverified
    case poolSwimmingRequiresIOS18

    var errorDescription: String? {
        switch self {
        case .unsupportedActivity(let sport):
            return "WorkoutKit does not support \(sport.rawValue) custom workouts"
        case .unsupportedGoal(let path):
            return "WorkoutKit does not support the goal at \(path)"
        case .unsupportedAlert(let path, let metric):
            return "WorkoutKit does not support the \(metric.rawValue) alert at \(path)"
        case .emptyBlocks:
            return "A custom workout needs at least one interval block"
        case .poolSwimmingUnverified:
            return "Pool sessions are disabled until both pool units and a mismatched pool length are verified on a paired watch"
        case .poolSwimmingRequiresIOS18:
            return "Pool swimming workouts require iOS 18 and watchOS 11"
        }
    }

    /// Stable code for the settings UI, shared with the core mapper.
    var unsupportedReason: UnsupportedReason {
        switch self {
        case .poolSwimmingUnverified:
            return .poolSwimmingUnverified
        case .poolSwimmingRequiresIOS18:
            return .poolSwimmingRequiresIOS18
        case .unsupportedActivity:
            return .nativeActivityUnsupported
        case .unsupportedGoal:
            return .nativeGoalUnsupported
        case .unsupportedAlert:
            return .nativeAlertUnsupported
        case .emptyBlocks:
            return .noExecutableSteps
        }
    }
}

/// WorkoutKit implementation of the core store contract.
///
/// Apple's scheduler is the authority: the reconciler reads
/// `scheduledWorkouts` before and after every write. `schedule` and `remove`
/// are `async` but not throwing (see `WorkoutScheduler.schedule(_:at:)` and
/// `remove(_:at:)`), so a completed phone call is never presented as watch
/// delivery. A missing entry after the call stays pending in the journal.
///
/// A completed workout is Apple history: `remove(planID:)` skips it even when
/// the journal asks for cleanup.
@available(iOS 17.0, *)
final class AppleWorkoutStore: ScheduleWorkoutStore {
    func maximumScheduledWorkoutCount() async -> Int {
        guard WorkoutScheduler.isSupported else {
            return 0
        }
        return WorkoutScheduler.maxAllowedScheduledWorkoutCount
    }

    /// Sorts out the pool gate and any goal/alert this OS build cannot take
    /// before the reconciler spends capacity or replaces a prior entry.
    func preflight(_ plan: PlanInput) async -> SchedulePreflight {
        if plan.sport == .swimming {
            guard PoolSwimNativeScheduling.isEnabled else {
                return .unsupported(PoolSwimNativeScheduling.unverifiedReason)
            }
            guard #available(iOS 18.0, *) else {
                return .unsupported(.poolSwimmingRequiresIOS18)
            }
        }
        do {
            _ = try makeWorkoutPlan(plan, id: UUID())
            return .supported
        } catch let error as WorkoutPlanBuildError {
            return .unsupported(error.unsupportedReason)
        } catch {
            return .unsupported(.noExecutableSteps)
        }
    }

    func scheduledWorkouts(
        calendar: Calendar
    ) async throws -> [ScheduledWorkoutState] {
        try await requireSchedulingAccess()
        let scheduled = await WorkoutScheduler.shared.scheduledWorkouts
        return try scheduled.map { item in
            guard let start = calendar.date(from: item.date) else {
                throw ScheduleStoreError.unreadableScheduledWorkout
            }
            return ScheduledWorkoutState(
                planID: item.plan.id,
                startDate: start,
                isComplete: item.complete
            )
        }
    }

    func schedule(
        _ request: ScheduleWorkoutRequest,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        try await requireSchedulingAccess()
        try await fence.check()
        let plan: WorkoutPlan
        do {
            plan = try makeWorkoutPlan(request.plan, id: request.planID)
        } catch {
            // The plan was rejected before any native call. The reconciler may
            // retry this receipt without treating it as an unresolved write.
            throw ScheduleStoreError.planNotSubmitted
        }
        let start = ScheduleDate.normalized(request.startDate)
        let components: DateComponents
        do {
            // Local whole-second components with an explicit time zone, and
            // only when the instant is unambiguous. WorkoutKit cannot say
            // which side of a repeated DST hour is meant.
            components = try ScheduleDate.components(
                for: start,
                calendar: calendar
            )
        } catch {
            throw ScheduleStoreError.ambiguousScheduledDate
        }
        // Last await on the preflight path is authorization above. The fence
        // both rechecks the account generation and durably marks the write as
        // submitted before the native call.
        try await fence.prepareSubmission()
        // Cancellation can arrive during the journal await. Prove no native
        // call happened and return the receipt to its retryable state.
        if Task.isCancelled {
            await fence.abortPreparedSubmission()
            throw CancellationError()
        }
        await WorkoutScheduler.shared.schedule(plan, at: components)
    }

    func remove(
        planID: UUID,
        targetDate: Date?,
        calendar: Calendar,
        fence: ScheduleSubmissionFence
    ) async throws {
        try await requireSchedulingAccess()
        // Fresh list on every call: Apple's scheduler is the authority.
        let scheduled = await WorkoutScheduler.shared.scheduledWorkouts
        let target = targetDate.map(ScheduleDate.normalized)
        for item in scheduled
            where item.plan.id == planID && !item.complete {
            if let target {
                // A capacity eviction is scoped to the exact Apple date it was
                // selected for. A same-UUID sibling at another date is not an
                // eviction target and stays for its own event/ownership path.
                guard let start = calendar.date(from: item.date) else {
                    throw ScheduleStoreError.unreadableScheduledWorkout
                }
                guard ScheduleDate.areEqual(start, target) else {
                    continue
                }
            }
            // Recheck after every preflight/list await and each iteration.
            // The fence includes task cancellation, so a background expiry
            // cannot still remove an entry after the scheduler was fenced.
            try await fence.check()
            try Task.checkCancellation()
            await WorkoutScheduler.shared.remove(item.plan, at: item.date)
        }
    }

    /// Permission can be revoked while the app is backgrounded. Check it before
    /// every store operation; a denied state is a read failure for the
    /// reconciler, never an empty Apple schedule.
    private func requireSchedulingAccess() async throws {
        guard WorkoutScheduler.isSupported else {
            throw ScheduleStoreError.unsupportedDevice
        }
        guard await WorkoutScheduler.shared.authorizationState == .authorized
        else {
            throw ScheduleStoreError.unauthorized
        }
    }
}

/// Builds the WorkoutKit plan for one mapped session. A stable `id` lets the
/// reconciler replace a changed session instead of scheduling a second one.
///
/// Every capability is checked before the initializer runs: WorkoutKit traps
/// on unsupported activity/goal/alert combinations instead of throwing.
/// Sources: WorkoutPlan.init(_:id:), CustomWorkout.supportsActivity(_:),
/// CustomWorkout.supportsGoal(_:activity:location:),
/// CustomWorkout.supportsAlert(_:activity:location:) and the WorkoutGoal /
/// WorkoutAlert factory methods.
@available(iOS 17.0, *)
func makeWorkoutPlan(_ input: PlanInput, id: UUID) throws -> WorkoutPlan {
    // Pool scheduling is gated off in releases: WWDC24 10084 shows Apple
    // converting/scaling pool goals, and a standalone distance goal plus rest
    // at a mismatched pool length is not verified. Mapping stays available;
    // scheduling does not, until the paired checks in the task report pass.
    if input.sport == .swimming {
        guard PoolSwimNativeScheduling.isEnabled else {
            throw WorkoutPlanBuildError.poolSwimmingUnverified
        }
        guard #available(iOS 18.0, *) else {
            throw WorkoutPlanBuildError.poolSwimmingRequiresIOS18
        }
    }

    let activity = workoutActivity(for: input.sport)
    guard CustomWorkout.supportsActivity(activity) else {
        throw WorkoutPlanBuildError.unsupportedActivity(input.sport)
    }
    let location = workoutLocation(for: input.location)

    let warmup = try input.warmup.map {
        try workoutStep($0, activity: activity, location: location, path: "warmup")
    }

    var blocks: [IntervalBlock] = []
    blocks.reserveCapacity(input.blocks.count)
    for (blockIndex, block) in input.blocks.enumerated() {
        var steps: [IntervalStep] = []
        steps.reserveCapacity(block.steps.count)
        for (stepIndex, step) in block.steps.enumerated() {
            let path = "blocks[\(blockIndex)].steps[\(stepIndex)]"
            let resolvedStep = try workoutStep(
                step,
                activity: activity,
                location: location,
                path: path
            )
            steps.append(
                IntervalStep(
                    step.purpose == .recovery ? .recovery : .work,
                    step: resolvedStep
                )
            )
        }
        blocks.append(
            IntervalBlock(steps: steps, iterations: block.repetitions)
        )
    }

    guard !blocks.isEmpty else {
        throw WorkoutPlanBuildError.emptyBlocks
    }

    let cooldown = try input.cooldown.map {
        try workoutStep($0, activity: activity, location: location, path: "cooldown")
    }

    let customWorkout = CustomWorkout(
        activity: activity,
        location: location,
        displayName: input.title,
        warmup: warmup,
        blocks: blocks,
        cooldown: cooldown
    )

    return WorkoutPlan(.custom(customWorkout), id: id)
}

@available(iOS 17.0, *)
private func workoutActivity(for sport: PlanSport) -> HKWorkoutActivityType {
    switch sport {
    case .running:
        return .running
    case .cycling:
        return .cycling
    case .swimming:
        return .swimming
    }
}

@available(iOS 17.0, *)
private func workoutLocation(
    for location: PlanLocation
) -> HKWorkoutSessionLocationType {
    switch location {
    // The API has no venue for running and cycling: do not claim outdoor or
    // indoor, let WorkoutKit keep the workout unspecified.
    case .unspecified:
        return .unknown
    case .pool:
        return .indoor
    }
}

@available(iOS 17.0, *)
private func workoutStep(
    _ step: PlannedStep,
    activity: HKWorkoutActivityType,
    location: HKWorkoutSessionLocationType,
    path: String
) throws -> WorkoutStep {
    let goal = workoutGoal(step.goal)
    guard CustomWorkout.supportsGoal(goal, activity: activity, location: location)
    else {
        throw WorkoutPlanBuildError.unsupportedGoal(path: path)
    }

    var workoutStep = WorkoutStep(goal: goal)
    if let target = step.target {
        let alert = workoutAlert(target)
        guard CustomWorkout.supportsAlert(
            alert,
            activity: activity,
            location: location
        ) else {
            throw WorkoutPlanBuildError.unsupportedAlert(
                path: path,
                metric: target.metric
            )
        }
        workoutStep.alert = alert
    }

    // Step display names are an iOS 18 feature; older versions simply omit
    // the name.
    if #available(iOS 18.0, *) {
        workoutStep.displayName = step.name
    }

    return workoutStep
}

@available(iOS 17.0, *)
private func workoutGoal(_ goal: PlannedGoal) -> WorkoutGoal {
    switch goal {
    case .open:
        return .open
    case .time(let seconds):
        return .time(seconds, .seconds)
    case .distance(let metres):
        // Canonical metres, exactly as stored: 100 yd stays 91.44 m.
        return .distance(metres, .meters)
    }
}

@available(iOS 17.0, *)
private func workoutAlert(_ target: PlannedTarget) -> any WorkoutAlert {
    switch target.metric {
    case .power:
        return .power(target.range, unit: .watts)
    case .heartRate:
        return .heartRate(target.range)
    case .cadence:
        return .cadence(target.range)
    case .speed:
        return .speed(target.range, unit: .metersPerSecond)
    }
}
#endif
