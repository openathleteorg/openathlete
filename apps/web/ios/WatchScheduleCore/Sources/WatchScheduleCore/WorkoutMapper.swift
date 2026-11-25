import Foundation

/// Maps one OpenAthlete planned session to a prescription WorkoutKit can
/// represent, or to a typed reason the caller can show and skip.
///
/// The mapper never invents a unit, a venue, a threshold or a zone. Values
/// stay in the units the API stores: seconds, metres, watts, bpm and m/s.
/// Zone targets are resolved against the session owner's zones only.
public func mapPrescription(
    _ event: TrainingEventInput,
    zones: [ZoneInput]
) -> MappingResult {
    guard let sport = PlanSport(rawValue: event.sport) else {
        return .unsupported(.unsupportedSport)
    }
    do {
        return .plan(try buildPlan(event, sport: sport, zones: zones))
    } catch let failure as MappingFailure {
        return .unsupported(failure.reason)
    } catch {
        assertionFailure("Unexpected mapper error: \(error)")
        return .unsupported(.noExecutableSteps)
    }
}

// MARK: - Building

private struct MappingFailure: Error {
    let reason: UnsupportedReason
}

private let supportedStepTypes: Set<String> = [
    "WARMUP",
    "COOLDOWN",
    "INTERVAL_ACTIVE",
    "INTERVAL_REST",
    "STEADY",
    "FREE",
]

private func fail(_ reason: UnsupportedReason) -> MappingFailure {
    MappingFailure(reason: reason)
}

private func buildPlan(
    _ event: TrainingEventInput,
    sport: PlanSport,
    zones: [ZoneInput]
) throws -> PlanInput {
    var steps = ordered(event.workout?.steps ?? [])

    var warmup: PlannedStep?
    // WorkoutKit has one warmup slot and one cooldown slot, not a role per
    // step. Only the leading warmup and trailing cooldown are lifted; a
    // WARMUP or COOLDOWN anywhere else is rejected rather than shown as
    // ordinary work.
    if let first = steps.first,
       first.repeatBlock == nil,
       first.stepType == "WARMUP" {
        warmup = try plannedStep(
            first,
            event: event,
            zones: zones,
            allowTerminalStep: true
        )
        steps.removeFirst()
    }

    var cooldown: PlannedStep?
    if let last = steps.last,
       last.repeatBlock == nil,
       last.stepType == "COOLDOWN" {
        cooldown = try plannedStep(
            last,
            event: event,
            zones: zones,
            allowTerminalStep: true
        )
        steps.removeLast()
    }

    var blocks: [PlannedBlock] = []
    var plainSteps: [PlannedStep] = []

    func flushPlainSteps() {
        guard !plainSteps.isEmpty else { return }
        blocks.append(PlannedBlock(repetitions: 1, steps: plainSteps))
        plainSteps.removeAll()
    }

    for step in steps {
        if let repeatBlock = step.repeatBlock {
            // A repeat payload only belongs on a REPEAT container, and the
            // container itself has no goal: otherwise the enclosing goal
            // would be silently dropped.
            guard step.stepType == "REPEAT" else {
                throw fail(.stepStructureMismatch)
            }
            guard step.durationType == nil || step.durationType == "OPEN",
                  step.durationValue == nil
            else {
                throw fail(.stepStructureMismatch)
            }
            // The container's own alert would be dropped by the block. Only
            // steps inside the block carry targets.
            guard step.targets.allSatisfy({ $0.targetType == "OPEN" }) else {
                throw fail(.stepStructureMismatch)
            }
            flushPlainSteps()
            blocks.append(try plannedBlock(repeatBlock, event: event, zones: zones))
            continue
        }
        if step.stepType == "REPEAT" {
            throw fail(.repeatWithoutBlock)
        }
        plainSteps.append(try plannedStep(step, event: event, zones: zones))
    }
    flushPlainSteps()

    guard !blocks.isEmpty else {
        throw fail(.noExecutableSteps)
    }

    return PlanInput(
        title: event.name,
        sport: sport,
        // Swimming is pool-only in this release; running and cycling have no
        // venue in the API, so they stay unspecified instead of inventing one.
        location: sport == .swimming ? .pool : .unspecified,
        warmup: warmup,
        blocks: blocks,
        cooldown: cooldown
    )
}

private func plannedBlock(
    _ repeatBlock: RepeatBlockInput,
    event: TrainingEventInput,
    zones: [ZoneInput]
) throws -> PlannedBlock {
    guard repeatBlock.repetitions >= 1 else {
        throw fail(.invalidRepetitions)
    }
    let kind = repeatBlock.kind ?? "REPEAT"
    guard kind == "REPEAT",
          repeatBlock.intervalSeconds == nil,
          repeatBlock.timeCapSeconds == nil
    else {
        throw fail(.unsupportedRepeatKind)
    }

    let children = ordered(repeatBlock.childSteps)
    guard !children.isEmpty else {
        throw fail(.emptyRepeat)
    }

    let plannedChildren = try children.map { child -> PlannedStep in
        // WorkoutKit blocks contain steps, never another block: nesting has
        // no faithful representation and is skipped explicitly.
        if child.repeatBlock != nil {
            throw fail(.nestedRepeats)
        }
        if child.stepType == "REPEAT" {
            throw fail(.repeatWithoutBlock)
        }
        return try plannedStep(child, event: event, zones: zones)
    }

    return PlannedBlock(
        repetitions: repeatBlock.repetitions,
        steps: plannedChildren
    )
}

private func plannedStep(
    _ step: WorkoutStepInput,
    event: TrainingEventInput,
    zones: [ZoneInput],
    allowTerminalStep: Bool = false
) throws -> PlannedStep {
    guard supportedStepTypes.contains(step.stepType) else {
        throw fail(.unsupportedStepType)
    }
    // WorkoutKit has exactly one warmup and one cooldown. Any other WARMUP or
    // COOLDOWN, including one inside a repeat block, has no faithful slot.
    if (step.stepType == "WARMUP" || step.stepType == "COOLDOWN")
        && !allowTerminalStep {
        throw fail(.misplacedWarmupCooldown)
    }
    return PlannedStep(
        stepType: step.stepType,
        name: step.name,
        goal: try plannedGoal(step),
        target: try plannedTarget(step, event: event, zones: zones)
    )
}

private func ordered(_ steps: [WorkoutStepInput]) -> [WorkoutStepInput] {
    steps.enumerated()
        .sorted { lhs, rhs in
            if lhs.element.orderIndex != rhs.element.orderIndex {
                return lhs.element.orderIndex < rhs.element.orderIndex
            }
            return lhs.offset < rhs.offset
        }
        .map(\.element)
}

// MARK: - Goals

private func plannedGoal(_ step: WorkoutStepInput) throws -> PlannedGoal {
    guard let durationType = step.durationType else {
        throw fail(.unsupportedDurationType)
    }
    switch durationType {
    case "OPEN":
        return .open
    case "TIME":
        guard let seconds = step.durationValue,
              seconds.isFinite,
              seconds > 0
        else {
            throw fail(.invalidDurationValue)
        }
        return .time(seconds: seconds)
    case "DISTANCE":
        guard let metres = step.durationValue,
              metres.isFinite,
              metres > 0
        else {
            throw fail(.invalidDurationValue)
        }
        return .distance(metres: metres)
    default:
        throw fail(.unsupportedDurationType)
    }
}

// MARK: - Targets

private func plannedTarget(
    _ step: WorkoutStepInput,
    event: TrainingEventInput,
    zones: [ZoneInput]
) throws -> PlannedTarget? {
    let active = step.targets.filter { $0.targetType != "OPEN" }
    guard active.count <= 1 else {
        throw fail(.multipleTargets)
    }
    guard let target = active.first else {
        return nil
    }

    // A metricType means the stored value is a ratio of the athlete's
    // threshold, which WorkoutKit cannot resolve faithfully here.
    guard target.metricType == nil else {
        throw fail(.relativeTarget)
    }

    switch target.targetType {
    case "ZONE":
        // Zone-bound values come from the owner's zone, not from raw target
        // fields, so the legacy-ratio marker does not apply to them.
        return try zoneTarget(target, event: event, zones: zones)
    case "POWER":
        return try absoluteTarget(target, metric: .power)
    case "HEARTRATE":
        return try absoluteTarget(target, metric: .heartRate)
    case "CADENCE":
        return try absoluteTarget(target, metric: .cadence)
    case "PACE":
        return try absoluteTarget(target, metric: .speed)
    default:
        throw fail(.unsupportedTarget)
    }
}

private func absoluteTarget(
    _ target: WorkoutTargetInput,
    metric: PlannedTarget.Metric
) throws -> PlannedTarget {
    try rejectAmbiguousUntaggedRatio(target)

    guard let lower = target.targetMin ?? target.targetValue,
          let upper = target.targetMax ?? target.targetValue
    else {
        throw fail(.missingTargetValue)
    }
    guard lower.isFinite, upper.isFinite, upper > 0 else {
        throw fail(.invalidTargetValue)
    }
    switch metric {
    case .power, .heartRate:
        // A recovery range may start at 0 W/bpm.
        guard lower >= 0 else { throw fail(.invalidTargetValue) }
    case .speed, .cadence:
        guard lower > 0 else { throw fail(.invalidTargetValue) }
    }

    let bounds = min(lower, upper)...max(lower, upper)
    return PlannedTarget(
        metric: metric,
        lowerBound: bounds.lowerBound,
        upperBound: bounds.upperBound
    )
}

/// The shared target-intensity detector (`looksLikePercentage` in
/// `libs/shared/src/utils/target-intensity.ts`) treats any positive raw
/// field up to 2 as a legacy ratio marker, even when another bound looks
/// absolute. Once found, the wire alone cannot tell the two apart: an
/// untagged PACE 1.0 could be 1 m/s or a ratio of 1, and 9:00 min/km
/// (1.85 m/s) overlaps the same window. Fail closed instead of guessing a
/// default FTP/VMA/HR threshold; there is no sport exception.
///
/// Zone targets never reach this check: their absolute bounds come from the
/// owner's zone and keep explicit provenance.
private func rejectAmbiguousUntaggedRatio(
    _ target: WorkoutTargetInput
) throws {
    let fields = [target.targetValue, target.targetMin, target.targetMax]
    let hasLegacyRatioMarker = fields.contains { value in
        guard let value else { return false }
        return value > 0 && value <= 2
    }
    guard !hasLegacyRatioMarker else {
        throw fail(.ambiguousRelativeTarget)
    }
}

private func zoneTarget(
    _ target: WorkoutTargetInput,
    event: TrainingEventInput,
    zones: [ZoneInput]
) throws -> PlannedTarget {
    guard let rawZoneId = target.targetValue,
          rawZoneId.isFinite,
          // Int(Double) traps above Int.max. `Int(exactly:)` is the only
          // safe conversion for ids coming from JSON.
          let zoneId = Int(exactly: rawZoneId),
          zoneId > 0
    else {
        throw fail(.zoneIdMissing)
    }

    guard let athleteId = event.athleteId else {
        throw fail(.missingAthlete)
    }
    guard let zone = zones.first(where: {
        $0.trainingZoneId == zoneId && $0.athleteId == athleteId
    }) else {
        // An identifier owned by somebody else is never a fallback.
        if zones.contains(where: { $0.trainingZoneId == zoneId }) {
            throw fail(.zoneOwnerMismatch)
        }
        throw fail(.zoneNotFound)
    }

    let metric: PlannedTarget.Metric
    switch zone.type {
    case "POWER":
        metric = .power
    case "HEARTRATE":
        metric = .heartRate
    case "PACE":
        metric = .speed
    default:
        throw fail(.zoneTypeMismatch)
    }

    guard !zone.values.isEmpty else {
        throw fail(.missingZoneBounds)
    }
    let applicable = zone.values.filter { value in
        value.sports.isEmpty || value.sports.contains(event.sport)
    }
    guard !applicable.isEmpty else {
        throw fail(.zoneSportMismatch)
    }
    // The sport-specific bounds win over the all-sports default.
    let value = applicable.first(where: { $0.sports.contains(event.sport) })
        ?? applicable[0]

    // Power and heart-rate zones may legitimately start at 0. Pace must be
    // positive (0 min/km has no speed). WorkoutKit's own support checks run
    // later in the native adapter; these are only physical constraints.
    guard value.min.isFinite, value.max.isFinite, value.min <= value.max else {
        throw fail(.invalidZoneBounds)
    }
    switch metric {
    case .power, .heartRate:
        guard value.min >= 0, value.max > 0 else {
            throw fail(.invalidZoneBounds)
        }
    case .speed:
        guard value.min > 0, value.max > 0 else {
            throw fail(.invalidZoneBounds)
        }
    case .cadence:
        throw fail(.zoneTypeMismatch)
    }

    if metric == .speed {
        // Pace zones are stored in min/km. The slower pace is the lower speed.
        let fastSpeed = speed(fromPaceMinPerKm: value.min)
        let slowSpeed = speed(fromPaceMinPerKm: value.max)
        return PlannedTarget(
            metric: .speed,
            lowerBound: min(fastSpeed, slowSpeed),
            upperBound: max(fastSpeed, slowSpeed),
            zoneId: zoneId
        )
    }

    return PlannedTarget(
        metric: metric,
        lowerBound: value.min,
        upperBound: value.max,
        zoneId: zoneId
    )
}

private func speed(fromPaceMinPerKm pace: Double) -> Double {
    1000 / (pace * 60)
}
