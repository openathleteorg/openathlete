import Foundation

// Codable mirrors of the OpenAthlete calendar, workout-detail and training-zone
// responses. They keep the values as the API stores them: seconds, metres,
// zone identifiers and raw sport/metric strings. No unit is inferred here.

public struct TrainingEventInput: Codable, Equatable, Sendable {
    public let eventId: Int
    public let athleteId: Int?
    /// Raw API value ("RUNNING", "CYCLING", "SWIMMING", ...).
    public let sport: String
    public let name: String
    public let workout: EventWorkoutInput?

    public init(
        eventId: Int,
        athleteId: Int?,
        sport: String,
        name: String,
        workout: EventWorkoutInput?
    ) {
        self.eventId = eventId
        self.athleteId = athleteId
        self.sport = sport
        self.name = name
        self.workout = workout
    }
}

public struct EventWorkoutInput: Codable, Equatable, Sendable {
    public let steps: [WorkoutStepInput]

    public init(steps: [WorkoutStepInput]) {
        self.steps = steps
    }
}

public struct WorkoutStepInput: Codable, Equatable, Sendable {
    public let orderIndex: Int
    /// Raw WORKOUT_STEP_TYPE ("WARMUP", "INTERVAL_ACTIVE", "REPEAT", ...).
    public let stepType: String
    public let name: String?
    /// Raw WORKOUT_DURATION_TYPE ("TIME", "DISTANCE", "OPEN", ...).
    public let durationType: String?
    /// Seconds for TIME, metres for DISTANCE, exactly as stored.
    public let durationValue: Double?
    public let targets: [WorkoutTargetInput]
    public let repeatBlock: RepeatBlockInput?

    public init(
        orderIndex: Int,
        stepType: String,
        name: String? = nil,
        durationType: String? = nil,
        durationValue: Double? = nil,
        targets: [WorkoutTargetInput] = [],
        repeatBlock: RepeatBlockInput? = nil
    ) {
        self.orderIndex = orderIndex
        self.stepType = stepType
        self.name = name
        self.durationType = durationType
        self.durationValue = durationValue
        self.targets = targets
        self.repeatBlock = repeatBlock
    }

    private enum CodingKeys: String, CodingKey {
        case orderIndex
        case stepType
        case name
        case durationType
        case durationValue
        case targets
        case repeatBlock
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        orderIndex = try container.decode(Int.self, forKey: .orderIndex)
        stepType = try container.decode(String.self, forKey: .stepType)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        durationType = try container.decodeIfPresent(String.self, forKey: .durationType)
        durationValue = try container.decodeIfPresent(Double.self, forKey: .durationValue)
        targets = try container.decodeIfPresent([WorkoutTargetInput].self, forKey: .targets) ?? []
        repeatBlock = try container.decodeIfPresent(RepeatBlockInput.self, forKey: .repeatBlock)
    }
}

public struct RepeatBlockInput: Codable, Equatable, Sendable {
    public let repetitions: Int
    /// Raw WORKOUT_REPEAT_KIND, nil for a plain repeat.
    public let kind: String?
    public let intervalSeconds: Int?
    public let timeCapSeconds: Int?
    public let childSteps: [WorkoutStepInput]

    public init(
        repetitions: Int,
        kind: String? = nil,
        intervalSeconds: Int? = nil,
        timeCapSeconds: Int? = nil,
        childSteps: [WorkoutStepInput]
    ) {
        self.repetitions = repetitions
        self.kind = kind
        self.intervalSeconds = intervalSeconds
        self.timeCapSeconds = timeCapSeconds
        self.childSteps = childSteps
    }

    private enum CodingKeys: String, CodingKey {
        case repetitions
        case kind
        case intervalSeconds
        case timeCapSeconds
        case childSteps
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        repetitions = try container.decode(Int.self, forKey: .repetitions)
        kind = try container.decodeIfPresent(String.self, forKey: .kind)
        intervalSeconds = try container.decodeIfPresent(Int.self, forKey: .intervalSeconds)
        timeCapSeconds = try container.decodeIfPresent(Int.self, forKey: .timeCapSeconds)
        childSteps = try container.decodeIfPresent([WorkoutStepInput].self, forKey: .childSteps) ?? []
    }
}

public struct WorkoutTargetInput: Codable, Equatable, Sendable {
    /// Raw WORKOUT_TARGET_TYPE ("OPEN", "PACE", "ZONE", ...).
    public let targetType: String
    public let targetMin: Double?
    public let targetMax: Double?
    /// For ZONE, the training zone identifier.
    public let targetValue: Double?
    public let metricType: String?

    public init(
        targetType: String,
        targetMin: Double? = nil,
        targetMax: Double? = nil,
        targetValue: Double? = nil,
        metricType: String? = nil
    ) {
        self.targetType = targetType
        self.targetMin = targetMin
        self.targetMax = targetMax
        self.targetValue = targetValue
        self.metricType = metricType
    }
}

public struct ZoneValueInput: Codable, Equatable, Sendable {
    public let min: Double
    public let max: Double
    /// Empty means the bounds apply to every sport.
    public let sports: [String]

    public init(min: Double, max: Double, sports: [String] = []) {
        self.min = min
        self.max = max
        self.sports = sports
    }

    private enum CodingKeys: String, CodingKey {
        case min
        case max
        case sports
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        min = try container.decode(Double.self, forKey: .min)
        max = try container.decode(Double.self, forKey: .max)
        sports = try container.decodeIfPresent([String].self, forKey: .sports) ?? []
    }
}

public struct ZoneInput: Codable, Equatable, Sendable {
    public let trainingZoneId: Int
    public let athleteId: Int
    /// Raw TRAINING_ZONE_TYPE ("HEARTRATE", "POWER", "PACE").
    public let type: String
    public let index: Int
    public let values: [ZoneValueInput]

    public init(
        trainingZoneId: Int,
        athleteId: Int,
        type: String,
        index: Int,
        values: [ZoneValueInput]
    ) {
        self.trainingZoneId = trainingZoneId
        self.athleteId = athleteId
        self.type = type
        self.index = index
        self.values = values
    }
}

// MARK: - Mapped plan

public enum PlanSport: String, Codable, Equatable, Sendable {
    case running = "RUNNING"
    case cycling = "CYCLING"
    case swimming = "SWIMMING"
}

public enum PlanLocation: String, Codable, Equatable, Sendable {
    /// The API has no venue for running and cycling; do not invent one.
    case unspecified
    /// Swimming is pool-only in this release.
    case pool
}

public enum PlannedStepPurpose: String, Codable, Equatable, Sendable {
    case work
    case recovery
}

public enum PlannedGoal: Equatable, Sendable {
    case open
    case time(seconds: Double)
    case distance(metres: Double)
}

extension PlannedGoal: Codable {
    private enum CodingKeys: String, CodingKey {
        case kind
        case value
    }

    private enum Kind: String, Codable {
        case open
        case time
        case distance
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decode(Kind.self, forKey: .kind) {
        case .open:
            self = .open
        case .time:
            self = .time(seconds: try container.decode(Double.self, forKey: .value))
        case .distance:
            self = .distance(metres: try container.decode(Double.self, forKey: .value))
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case .open:
            try container.encode(Kind.open, forKey: .kind)
        case .time(let seconds):
            try container.encode(Kind.time, forKey: .kind)
            try container.encode(seconds, forKey: .value)
        case .distance(let metres):
            try container.encode(Kind.distance, forKey: .kind)
            try container.encode(metres, forKey: .value)
        }
    }
}

public struct PlannedTarget: Codable, Equatable, Sendable {
    public enum Metric: String, Codable, Equatable, Sendable {
        /// Watts.
        case power
        /// Beats per minute.
        case heartRate
        /// Revolutions or steps per minute.
        case cadence
        /// Metres per second.
        case speed
    }

    public let metric: Metric
    public let lowerBound: Double
    public let upperBound: Double
    /// The OpenAthlete zone the bounds were resolved from, when there is one.
    public let zoneId: Int?

    public init(
        metric: Metric,
        lowerBound: Double,
        upperBound: Double,
        zoneId: Int? = nil
    ) {
        self.metric = metric
        self.lowerBound = lowerBound
        self.upperBound = upperBound
        self.zoneId = zoneId
    }

    public var range: ClosedRange<Double> {
        lowerBound...upperBound
    }
}

public struct PlannedStep: Codable, Equatable, Sendable {
    /// Raw WORKOUT_STEP_TYPE, kept for the prescription fingerprint.
    public let stepType: String
    public let name: String?
    public let goal: PlannedGoal
    /// WorkoutKit has one alert per step. More than one target is rejected
    /// before a plan reaches this point.
    public let target: PlannedTarget?

    public init(
        stepType: String,
        name: String? = nil,
        goal: PlannedGoal,
        target: PlannedTarget? = nil
    ) {
        self.stepType = stepType
        self.name = name
        self.goal = goal
        self.target = target
    }

    public var purpose: PlannedStepPurpose {
        stepType == "INTERVAL_REST" ? .recovery : .work
    }
}

public struct PlannedBlock: Codable, Equatable, Sendable {
    public let repetitions: Int
    public let steps: [PlannedStep]

    public init(repetitions: Int, steps: [PlannedStep]) {
        self.repetitions = repetitions
        self.steps = steps
    }
}

public struct PlanInput: Codable, Equatable, Sendable {
    public let title: String
    public let sport: PlanSport
    public let location: PlanLocation
    public let warmup: PlannedStep?
    public let blocks: [PlannedBlock]
    public let cooldown: PlannedStep?

    public init(
        title: String,
        sport: PlanSport,
        location: PlanLocation,
        warmup: PlannedStep?,
        blocks: [PlannedBlock],
        cooldown: PlannedStep?
    ) {
        self.title = title
        self.sport = sport
        self.location = location
        self.warmup = warmup
        self.blocks = blocks
        self.cooldown = cooldown
    }
}

// MARK: - Result

public enum MappingResult: Equatable, Sendable {
    case plan(PlanInput)
    case unsupported(UnsupportedReason)
}

/// Stable codes shown and localized by the app. A reason never carries a
/// partial plan: the session is skipped as a whole.
public enum UnsupportedReason: String, Codable, Equatable, Sendable {
    case unsupportedSport
    case missingAthlete
    case unsupportedStepType
    case repeatWithoutBlock
    case stepStructureMismatch
    case misplacedWarmupCooldown
    case nestedRepeats
    case unsupportedRepeatKind
    case invalidRepetitions
    case emptyRepeat
    case unsupportedDurationType
    case invalidDurationValue
    case multipleTargets
    case unsupportedTarget
    case relativeTarget
    case ambiguousRelativeTarget
    case missingTargetValue
    case invalidTargetValue
    case zoneIdMissing
    case zoneNotFound
    case zoneOwnerMismatch
    case zoneSportMismatch
    case zoneTypeMismatch
    case missingZoneBounds
    case invalidZoneBounds
    case poolSwimmingUnverified
    case noExecutableSteps
}

/// Release policy for native Apple Watch scheduling of pool sessions.
///
/// WWDC24 10084 shows Apple converting/scaling combined pool goals for the
/// watch's pool length. Whether a standalone distance goal plus an explicit
/// rest step survives the same conversion at a mismatched pool length is not
/// established. Keep this gate off in releases until a paired iPhone/Apple
/// Watch check covers both pool units and a mismatched pool length. Mapping
/// itself stays available so the prescription can be inspected and tested.
public enum PoolSwimNativeScheduling {
    /// Never enable this in a release build without the paired checks above.
    public static let isEnabled = false

    /// Stable reason code the settings UI can localize and explain.
    public static let unverifiedReason: UnsupportedReason = .poolSwimmingUnverified
}
