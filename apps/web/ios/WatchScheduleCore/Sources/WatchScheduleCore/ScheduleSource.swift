import Foundation

/// Portable validation for a native scope argument. The plugin receives
/// `NSNumber`/`String` from JavaScript, so it must reject booleans, fractions
/// and unsafe integers before constructing an `AccountScope`.
public enum WatchScheduleScopeValidation {
    /// ECMAScript's `Number.MAX_SAFE_INTEGER`.
    public static let maximumSafeInteger: Double = 9_007_199_254_740_991

    public static func athleteId(from value: Double) -> Int? {
        guard value.isFinite,
              value > 0,
              value <= maximumSafeInteger,
              let athleteId = Int(exactly: value),
              athleteId > 0
        else {
            return nil
        }
        return athleteId
    }

    /// A plain HTTP(S) instance base: no userinfo, query or fragment, and a
    /// host that can own the bearer.
    public static func instanceURL(from value: String) -> URL? {
        guard let url = URL(string: value),
              let scheme = url.scheme?.lowercased(),
              scheme == "https" || scheme == "http",
              let host = url.host,
              !host.isEmpty,
              url.user == nil,
              url.password == nil,
              url.query == nil,
              url.fragment == nil
        else {
            return nil
        }
        return url
    }
}

/// The instance and athlete a schedule belongs to. The instance is part of the
/// identity so two self-hosted instances, or an instance and the hosted one,
/// can never share scheduled entries or credentials.
public struct AccountScope: Hashable, Codable, Sendable {
    public let instanceURL: URL
    public let athleteId: Int

    public init(instanceURL: URL, athleteId: Int) {
        self.instanceURL = Self.canonicalInstanceURL(instanceURL)
        self.athleteId = athleteId
    }

    /// URL equality alone would treat `https://train.example.org/api/` and
    /// `https://train.example.org/api` as different accounts.
    private static func canonicalInstanceURL(_ url: URL) -> URL {
        guard var components = URLComponents(
            url: url,
            resolvingAgainstBaseURL: false
        ) else {
            return url
        }
        components.scheme = components.scheme?.lowercased()
        components.host = components.host?.lowercased()
        if components.scheme == "https" && components.port == 443 {
            components.port = nil
        }
        if components.scheme == "http" && components.port == 80 {
            components.port = nil
        }
        // Neither belongs to a server base URL, and keeping them would make
        // the same account hash differently between reads.
        components.query = nil
        components.fragment = nil
        if components.path == "/" {
            components.path = ""
        } else if components.path.count > 1
            && components.path.hasSuffix("/") {
            components.path = String(components.path.dropLast())
        }
        return components.url ?? url
    }
}

/// Wire errors a transport can report. The source decides which ones are
/// fatal (credentials) and which are per-event and retryable (reads).
public enum ScheduleTransportError: Error, Equatable, Sendable {
    case credentialExpired
    case unauthorized
    case invalidURL
    case insecureOrigin
    /// The credential provider returned a token for another instance.
    case scopeMismatch
    case transportFailure(status: Int?)
    case invalidResponse
    case eventNotFound
}

public enum ScheduleSourceError: Error, Equatable, Sendable {
    /// No usable credential: nothing may be read or rescheduled.
    case credentialExpired
    case unauthorized
    /// The credential belongs to a different account or instance.
    case scopeMismatch
    /// The list itself failed. It is never an empty, complete calendar.
    case calendarUnavailable
    /// The list was not a complete, canonical representation (partial
    /// content, a malformed owner or another invalid response).
    case invalidCalendarResponse
    /// The supplied calendar could not produce the eight local dates.
    case invalidCalendar
}

/// One row of `GET /event`, flattened by the API exactly like the calendar
/// used by `EventAPI.getMyEvents` (`apps/web/src/api/event/event.api.ts`).
/// Dates are ISO 8601 strings in the response and are decoded by
/// `ScheduleWireCoding.decoder()`.
public struct CalendarEventInput: Codable, Equatable, Sendable {
    public struct RelatedActivityInput: Codable, Equatable, Sendable {
        public let eventId: Int

        public init(eventId: Int) {
            self.eventId = eventId
        }
    }

    public let eventId: Int
    public let athleteId: Int?
    /// Raw EVENT_TYPE ("TRAINING", "ACTIVITY", ...).
    public let type: String
    /// Raw SPORT_TYPE, present for planned sessions and activities.
    public let sport: String?
    public let name: String
    public let startDate: Date
    public let endDate: Date
    /// Who planned the session; a coach-authored session is still the
    /// athlete's own.
    public let createdById: Int?
    /// Set once the planned session is linked to a recorded activity.
    public let relatedActivityId: Int?
    public let relatedActivity: RelatedActivityInput?
    public let workout: EventWorkoutInput?

    public init(
        eventId: Int,
        athleteId: Int?,
        type: String,
        sport: String?,
        name: String,
        startDate: Date,
        endDate: Date,
        createdById: Int? = nil,
        relatedActivityId: Int? = nil,
        relatedActivity: RelatedActivityInput? = nil,
        workout: EventWorkoutInput? = nil
    ) {
        self.eventId = eventId
        self.athleteId = athleteId
        self.type = type
        self.sport = sport
        self.name = name
        self.startDate = startDate
        self.endDate = endDate
        self.createdById = createdById
        self.relatedActivityId = relatedActivityId
        self.relatedActivity = relatedActivity
        self.workout = workout
    }

    /// The API returns both the foreign key and the linked activity; either
    /// one means the session has already been done.
    public var completedActivityId: Int? {
        relatedActivityId ?? relatedActivity?.eventId
    }

    /// The mapper's input. A row without a workout must be completed from
    /// `GET /event/:eventId` before this is used.
    public var trainingEvent: TrainingEventInput? {
        guard type == "TRAINING", let sport else {
            return nil
        }
        return TrainingEventInput(
            eventId: eventId,
            athleteId: athleteId,
            sport: sport,
            name: name,
            workout: workout
        )
    }
}

/// The date format NestJS serialises (`Date.toISOString()`), with and without
/// fractional seconds.
public enum ScheduleWireCoding {
    public static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)
            if let date = try? Date(
                string,
                strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)
            ) {
                return date
            }
            if let date = try? Date(
                string,
                strategy: Date.ISO8601FormatStyle()
            ) {
                return date
            }
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Expected an ISO 8601 date, got \(string)"
            )
        }
        return decoder
    }
}

// MARK: - Transport

/// The narrow network surface the snapshot needs. It is intentionally not a
/// general API client: the iOS transport owns credentials, redirects and
/// instance scoping.
/// The own-athlete response of `GET /athlete/me` (see
/// `apps/web/src/api/athlete/athlete.api.ts`). Only the identity the API
/// proves for the pinned bearer matters here; the rest of the profile is
/// deliberately ignored.
public struct OwnAthleteInput: Codable, Equatable, Sendable {
    public let athleteId: Int

    public init(athleteId: Int) {
        self.athleteId = athleteId
    }
}

public protocol ScheduleTransport {
    /// `GET /athlete/me` with the same pinned bearer as the calendar reads.
    /// A token for another athlete is a mismatch, never an empty calendar.
    func ownAthleteId(scope: AccountScope) async throws -> Int

    /// `GET /event` for the authenticated athlete's own calendar. `to` is
    /// exclusive; the response must be complete for the range.
    func listEvents(
        scope: AccountScope,
        from: Date,
        to: Date
    ) async throws -> [CalendarEventInput]

    /// `GET /event/:eventId`, only when the calendar row has no workout.
    func eventDetail(
        scope: AccountScope,
        eventId: Int
    ) async throws -> CalendarEventInput

    /// `GET /training-zone/athlete/:athleteId` for the same signed-in
    /// athlete. Zones belong to the workout owner, never the coach view.
    func trainingZones(scope: AccountScope) async throws -> [ZoneInput]
}

public extension ScheduleTransport {
    /// Test transports that do not model identity default to the requested
    /// scope. The iOS transport overrides this with the real API call.
    func ownAthleteId(scope: AccountScope) async throws -> Int {
        scope.athleteId
    }
}

// MARK: - Snapshot

public struct ScheduleCandidate: Equatable, Sendable {
    public let eventId: Int
    public let startDate: Date
    public let plan: PlanInput

    public init(eventId: Int, startDate: Date, plan: PlanInput) {
        self.eventId = eventId
        self.startDate = startDate
        self.plan = plan
    }
}

/// Why one owned session has no candidate. Retryable reasons must keep the
/// previous Apple entry: they are a read failure, not a cancellation.
public enum ScheduleSkipReason: Equatable, Sendable {
    case detailUnavailable
    case zonesUnavailable
    /// The instant has no unambiguous local representation (DST gap or
    /// repeated hour), so native date components would be wrong.
    case ambiguousLocalTime
    /// The detail response belonged to another athlete; never map or schedule
    /// it for this account.
    case foreignEvent
    case unsupported(UnsupportedReason)

    public var isRetryable: Bool {
        switch self {
        case .detailUnavailable, .zonesUnavailable:
            return true
        case .ambiguousLocalTime, .foreignEvent, .unsupported:
            return false
        }
    }

    /// Stable code for the settings UI, localized in the app.
    public var code: String {
        switch self {
        case .detailUnavailable:
            return "detailUnavailable"
        case .zonesUnavailable:
            return "zonesUnavailable"
        case .ambiguousLocalTime:
            return "ambiguousLocalTime"
        case .foreignEvent:
            return "foreignEvent"
        case .unsupported(let reason):
            return reason.rawValue
        }
    }
}

public struct SkippedScheduleEvent: Equatable, Sendable {
    public let eventId: Int
    public let startDate: Date
    public let reason: ScheduleSkipReason

    public init(eventId: Int, startDate: Date, reason: ScheduleSkipReason) {
        self.eventId = eventId
        self.startDate = startDate
        self.reason = reason
    }
}

/// A complete read of the eight local dates (today through day +7).
///
/// `ownedEventIds` is authoritative: every planned session of this athlete
/// whose start date is inside the window, before sport, completion and
/// prescription filters. A missing ID therefore means the session was moved
/// out of the window or deleted. A failed list never produces a snapshot, so
/// it can never look like an empty calendar.
public struct ScheduleSnapshot: Equatable, Sendable {
    public let scope: AccountScope
    public let window: DateInterval
    public let readAt: Date
    public let ownedEventIds: [Int]
    public let completedEventIds: [Int]
    public let candidates: [ScheduleCandidate]
    public let skipped: [SkippedScheduleEvent]

    public init(
        scope: AccountScope,
        window: DateInterval,
        readAt: Date,
        ownedEventIds: [Int],
        completedEventIds: [Int],
        candidates: [ScheduleCandidate],
        skipped: [SkippedScheduleEvent]
    ) {
        self.scope = scope
        self.window = window
        self.readAt = readAt
        self.ownedEventIds = ownedEventIds
        self.completedEventIds = completedEventIds
        self.candidates = candidates
        self.skipped = skipped
    }

    public var candidateEventIds: [Int] {
        candidates.map(\.eventId)
    }

    /// Sessions whose reads failed transiently. The reconciler must keep
    /// their previous Apple entry and retry them, not remove them.
    public var retryableEventIds: [Int] {
        skipped.filter(\.reason.isRetryable).map(\.eventId)
    }
}

// MARK: - Loading

public struct ScheduleSource: Sendable {
    private let transport: any ScheduleTransport

    public init(transport: any ScheduleTransport) {
        self.transport = transport
    }

    /// Reads the signed-in athlete's own calendar, retrieves missing workout
    /// detail and resolves zone prescriptions. Local calendar arithmetic
    /// keeps the window on the athlete's iPhone dates across DST.
    public func loadSnapshot(
        scope: AccountScope,
        now: Date,
        calendar: Calendar
    ) async throws -> ScheduleSnapshot {
        let window = try Self.window(now: now, calendar: calendar)

        // The bearer is pinned by the credential provider. Before any list can
        // be authoritative (especially an empty one), prove that it belongs to
        // the athlete this scope names. A token for another account must never
        // produce a removable/keep set for this one.
        let ownAthleteId: Int
        do {
            ownAthleteId = try await transport.ownAthleteId(scope: scope)
        } catch let error as ScheduleTransportError {
            throw Self.fatalError(for: error, listFailed: true)
                ?? .calendarUnavailable
        } catch {
            throw error
        }
        guard ownAthleteId == scope.athleteId else {
            throw ScheduleSourceError.scopeMismatch
        }

        let rows: [CalendarEventInput]
        do {
            rows = try await transport.listEvents(
                scope: scope,
                from: window.start,
                to: window.end
            )
        } catch let error as ScheduleTransportError {
            throw Self.fatalError(for: error, listFailed: true)
                ?? .calendarUnavailable
        } catch {
            // Includes CancellationError: a cancelled read is not a result.
            throw error
        }

        // GET /event always excludes events without an athlete (`athleteId:
        // { not: null }`), for every event type. A row without an owner
        // therefore means a truncated or rewritten response, not a calendar
        // row to ignore; it must never become the authoritative keep/remove
        // set.
        guard !rows.contains(where: { $0.athleteId == nil }) else {
            throw ScheduleSourceError.invalidCalendarResponse
        }

        let owned = rows
            .filter { row in
                row.type == "TRAINING"
                    && row.athleteId == scope.athleteId
                    && row.startDate >= window.start
                    && row.startDate < window.end
            }
            .sorted { first, second in
                if first.startDate != second.startDate {
                    return first.startDate < second.startDate
                }
                return first.eventId < second.eventId
            }

        var completedEventIds: [Int] = []
        var inputs: [(event: TrainingEventInput, startDate: Date)] = []
        var skipped: [SkippedScheduleEvent] = []

        for row in owned {
            if row.completedActivityId != nil {
                completedEventIds.append(row.eventId)
                continue
            }

            var resolved = row
            if row.workout == nil {
                do {
                    resolved = try await transport.eventDetail(
                        scope: scope,
                        eventId: row.eventId
                    )
                } catch is CancellationError {
                    throw CancellationError()
                } catch let error as ScheduleTransportError {
                    if let fatal = Self.fatalError(for: error, listFailed: false) {
                        throw fatal
                    }
                    skipped.append(
                        SkippedScheduleEvent(
                            eventId: row.eventId,
                            startDate: row.startDate,
                            reason: .detailUnavailable
                        )
                    )
                    continue
                } catch {
                    skipped.append(
                        SkippedScheduleEvent(
                            eventId: row.eventId,
                            startDate: row.startDate,
                            reason: .detailUnavailable
                        )
                    )
                    continue
                }
            }

            guard resolved.eventId == row.eventId else {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .detailUnavailable
                    )
                )
                continue
            }
            guard resolved.type == "TRAINING" else {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .detailUnavailable
                    )
                )
                continue
            }
            guard let detailOwner = resolved.athleteId else {
                // Same malformed-owner rule as the list: retry, never map.
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .detailUnavailable
                    )
                )
                continue
            }
            guard detailOwner == scope.athleteId else {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .foreignEvent
                    )
                )
                continue
            }
            // The two reads describe the same event. Conflicting dates mean
            // one response is stale or partial: keep the owned ID and retry
            // instead of producing a candidate from a mix of both.
            guard resolved.startDate == row.startDate,
                  resolved.endDate == row.endDate
            else {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .detailUnavailable
                    )
                )
                continue
            }
            // A detail fetched for a row without a workout may still carry a
            // linked activity. Once the reads agree, that is completion, not
            // a session to schedule.
            if resolved.completedActivityId != nil {
                completedEventIds.append(row.eventId)
                continue
            }
            guard let input = resolved.trainingEvent else {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: row.eventId,
                        startDate: row.startDate,
                        reason: .detailUnavailable
                    )
                )
                continue
            }
            inputs.append((input, row.startDate))
        }

        // Zones are read once, and only when a prescription actually needs
        // them. A failed zone read is retryable for those sessions only.
        var zones: [ZoneInput] = []
        var zoneReadFailed = false
        if inputs.contains(where: { Self.requiresZones($0.event) }) {
            do {
                zones = try await transport.trainingZones(scope: scope)
            } catch is CancellationError {
                throw CancellationError()
            } catch let error as ScheduleTransportError {
                if let fatal = Self.fatalError(for: error, listFailed: false) {
                    throw fatal
                }
                zoneReadFailed = true
            } catch {
                zoneReadFailed = true
            }
        }

        var candidates: [ScheduleCandidate] = []
        for input in inputs {
            if zoneReadFailed && Self.requiresZones(input.event) {
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: input.event.eventId,
                        startDate: input.startDate,
                        reason: .zonesUnavailable
                    )
                )
                continue
            }
            switch mapPrescription(input.event, zones: zones) {
            case .plan(let plan):
                candidates.append(
                    ScheduleCandidate(
                        eventId: input.event.eventId,
                        startDate: input.startDate,
                        plan: plan
                    )
                )
            case .unsupported(let reason):
                skipped.append(
                    SkippedScheduleEvent(
                        eventId: input.event.eventId,
                        startDate: input.startDate,
                        reason: .unsupported(reason)
                    )
                )
            }
        }

        return ScheduleSnapshot(
            scope: scope,
            window: window,
            readAt: now,
            ownedEventIds: owned.map(\.eventId),
            completedEventIds: completedEventIds,
            candidates: candidates,
            skipped: skipped
        )
    }

    /// Today and the next seven local dates, as a half-open interval so a
    /// session at the first moment of day +8 is outside it.
    ///
    /// Compute day +8 and then call `startOfDay` on it. Adding one day to the
    /// day +7 start is wrong when midnight itself does not exist: São Paulo
    /// skipped 00:00–01:00 on 2018-11-04, so the boundary is 01:00 local.
    static func window(now: Date, calendar: Calendar) throws -> DateInterval {
        let start = calendar.startOfDay(for: now)
        guard let eighthDay = calendar.date(
            byAdding: .day,
            value: 8,
            to: start
        ) else {
            throw ScheduleSourceError.invalidCalendar
        }
        let end = calendar.startOfDay(for: eighthDay)
        guard end > start else {
            throw ScheduleSourceError.invalidCalendar
        }
        return DateInterval(start: start, end: end)
    }

    private static func fatalError(
        for error: ScheduleTransportError,
        listFailed: Bool
    ) -> ScheduleSourceError? {
        switch error {
        case .credentialExpired:
            return .credentialExpired
        case .unauthorized:
            return .unauthorized
        case .scopeMismatch:
            // A token for another instance is exactly as unusable as an
            // expired one, at any read stage.
            return .scopeMismatch
        case .invalidResponse:
            // A partial or malformed list is not an authoritative calendar.
            // A malformed detail or zone body stays retryable per event.
            return listFailed ? .invalidCalendarResponse : nil
        default:
            return listFailed ? .calendarUnavailable : nil
        }
    }

    private static func requiresZones(_ event: TrainingEventInput) -> Bool {
        func stepNeedsZones(_ step: WorkoutStepInput) -> Bool {
            if step.targets.contains(where: { $0.targetType == "ZONE" }) {
                return true
            }
            return step.repeatBlock?.childSteps.contains(
                where: stepNeedsZones
            ) ?? false
        }
        return event.workout?.steps.contains(where: stepNeedsZones) ?? false
    }
}
