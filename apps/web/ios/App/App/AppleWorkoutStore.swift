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
        case .poolSwimmingRequiresIOS18:
            return "Pool swimming workouts require iOS 18 and watchOS 11"
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
    // Pool swimming custom workouts and the pool goal are iOS 18 / watchOS 11
    // additions. Do not rely on supportsActivity alone for this gate.
    if input.sport == .swimming {
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
