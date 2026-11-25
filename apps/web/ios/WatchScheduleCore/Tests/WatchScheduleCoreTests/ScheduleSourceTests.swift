import XCTest

@testable import WatchScheduleCore

final class ScheduleSourceTests: XCTestCase {
    private let scope = AccountScope(
        instanceURL: URL(string: "https://train.example.org/api")!,
        athleteId: 7
    )

    // MARK: - Fixtures

    private func newYorkCalendar() -> Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "America/New_York")!
        calendar.locale = Locale(identifier: "en_US_POSIX")
        return calendar
    }

    private func date(_ iso: String) throws -> Date {
        try Date(
            iso,
            strategy: Date.ISO8601FormatStyle(includingFractionalSeconds: true)
        )
    }

    private func step(
        _ type: String = "STEADY",
        durationType: String = "TIME",
        durationValue: Double = 600,
        targets: [[String: Any]] = []
    ) -> [String: Any] {
        [
            "workoutStepId": 1,
            "orderIndex": 0,
            "stepType": type,
            "durationType": durationType,
            "durationValue": durationValue,
            "targets": targets,
            "repeatBlock": NSNull(),
        ]
    }

    private func zoneTarget(_ zoneId: Int) -> [String: Any] {
        [
            "targetType": "ZONE",
            "targetValue": zoneId,
            "targetMin": NSNull(),
            "targetMax": NSNull(),
            "metricType": NSNull(),
        ]
    }

    /// Builds the row through JSON so the tests exercise the real wire date
    /// format (`2026-03-04T12:00:00.000Z`) and flat calendar response.
    private func row(
        eventId: Int,
        athleteId: Int? = 7,
        type: String = "TRAINING",
        sport: String? = "RUNNING",
        name: String = "Session",
        start: String,
        end: String? = nil,
        createdById: Int? = nil,
        relatedActivityId: Int? = nil,
        hasWorkout: Bool = true,
        steps: [[String: Any]]? = nil
    ) throws -> CalendarEventInput {
        var object: [String: Any] = [
            "eventId": eventId,
            "type": type,
            "name": name,
            "startDate": start,
            "endDate": end ?? start,
            "athleteId": athleteId as Any,
            "createdById": createdById as Any,
            "relatedActivityId": relatedActivityId as Any,
        ]
        if let sport {
            object["sport"] = sport
        }
        if hasWorkout {
            object["workout"] = ["steps": steps ?? [step()]]
        }
        let data = try JSONSerialization.data(withJSONObject: object)
        return try ScheduleWireCoding.decoder().decode(
            CalendarEventInput.self,
            from: data
        )
    }

    private func zone(
        _ id: Int = 42,
        athlete: Int = 7,
        type: String = "POWER",
        min: Double = 200,
        max: Double = 250,
        sports: [String] = ["CYCLING"]
    ) -> ZoneInput {
        ZoneInput(
            trainingZoneId: id,
            athleteId: athlete,
            type: type,
            index: 2,
            values: [ZoneValueInput(min: min, max: max, sports: sports)]
        )
    }

    // MARK: - Account scope

    func testAccountScopeIgnoresTrailingSlashCaseAndDefaultPort() {
        let first = AccountScope(
            instanceURL: URL(string: "https://Train.Example.org:443/api/")!,
            athleteId: 7
        )
        let second = AccountScope(
            instanceURL: URL(string: "https://train.example.org/api")!,
            athleteId: 7
        )
        XCTAssertEqual(first, second)
        XCTAssertEqual(Set([first, second]).count, 1)

        let rootWithSlash = AccountScope(
            instanceURL: URL(string: "https://train.example.org/")!,
            athleteId: 7
        )
        let rootWithoutSlash = AccountScope(
            instanceURL: URL(string: "https://train.example.org")!,
            athleteId: 7
        )
        XCTAssertEqual(rootWithSlash, rootWithoutSlash)
    }

    // MARK: - Date window

    func testSnapshotKeepsTodayAndTheSeventhLocalDayAcrossDST() async throws {
        // New York springs forward on 2026-03-08. A fixed 8 × 86 400 s window
        // would end at 05:00Z on day +8 and wrongly include the first hour of
        // March 12; local calendar arithmetic ends at 04:00Z.
        let events = [
            try row(
                eventId: 303,
                start: "2026-03-12T04:00:00.000Z"
            ),
            try row(
                eventId: 202,
                start: "2026-03-12T03:59:00.000Z"
            ),
            try row(
                eventId: 101,
                start: "2026-03-04T12:00:00.000Z"
            ),
            try row(
                eventId: 404,
                start: "2026-03-12T16:00:00.000Z"
            ),
            try row(
                eventId: 100,
                start: "2026-03-03T23:00:00.000Z",
                end: "2026-03-04T12:00:00.000Z"
            ),
        ]
        let transport = FixtureTransport(events: events)
        let source = ScheduleSource(transport: transport)

        let snapshot = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T17:00:00.000Z"),
            calendar: newYorkCalendar()
        )

        XCTAssertEqual(
            snapshot.window.start,
            try date("2026-03-04T05:00:00.000Z")
        )
        XCTAssertEqual(
            snapshot.window.end,
            try date("2026-03-12T04:00:00.000Z")
        )
        XCTAssertEqual(snapshot.ownedEventIds, [101, 202])
        XCTAssertEqual(snapshot.candidates.map(\.eventId), [101, 202])
        XCTAssertEqual(snapshot.completedEventIds, [])
        XCTAssertEqual(snapshot.skipped, [])
        XCTAssertEqual(transport.listRequests.count, 1)
        XCTAssertEqual(transport.listRequests[0].scope, scope)
        XCTAssertEqual(transport.listRequests[0].from, snapshot.window.start)
        XCTAssertEqual(transport.listRequests[0].to, snapshot.window.end)
        XCTAssertEqual(transport.detailRequests, [])
        XCTAssertEqual(transport.zoneRequests, [])
    }

    // MARK: - Ownership

    func testCoachAuthoredSessionIsIncluded() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 201,
                    start: "2026-03-04T12:00:00.000Z",
                    createdById: 999
                ),
            ]
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [201])
        XCTAssertEqual(snapshot.candidates.map(\.eventId), [201])
    }

    func testForeignNonTrainingAndOutOfWindowEventsAreNotOwned() async throws {
        let transport = FixtureTransport(
            events: [
                // Foreign athlete, even with a zone prescription: never read.
                try row(
                    eventId: 301,
                    athleteId: 999,
                    start: "2026-03-04T12:00:00.000Z",
                    steps: [step(targets: [zoneTarget(42)])]
                ),
                // Recorded activities and notes are not planned sessions.
                try row(
                    eventId: 302,
                    type: "ACTIVITY",
                    start: "2026-03-04T13:00:00.000Z"
                ),
                try row(
                    eventId: 303,
                    type: "NOTE",
                    sport: nil,
                    start: "2026-03-04T14:00:00.000Z",
                    hasWorkout: false
                ),
            ]
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [])
        XCTAssertEqual(snapshot.candidates, [])
        XCTAssertEqual(snapshot.completedEventIds, [])
        XCTAssertEqual(snapshot.skipped, [])
        XCTAssertEqual(transport.detailRequests, [])
        XCTAssertEqual(transport.zoneRequests, [])
    }

    // MARK: - Complete calendar semantics

    func testEmptyCompleteResponseIsAuthoritative() async throws {
        let transport = FixtureTransport(events: [])

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [])
        XCTAssertEqual(snapshot.candidates, [])
        XCTAssertEqual(snapshot.completedEventIds, [])
        XCTAssertEqual(snapshot.skipped, [])
        XCTAssertEqual(transport.listRequests.count, 1)
    }

    func testCancelledEventVanishesFromTheNextAuthoritativeSnapshot() async throws {
        let transport = FixtureTransport(
            events: [
                try row(eventId: 401, start: "2026-03-04T12:00:00.000Z"),
            ]
        )
        let source = ScheduleSource(transport: transport)

        let first = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T17:00:00.000Z"),
            calendar: newYorkCalendar()
        )
        XCTAssertEqual(first.ownedEventIds, [401])

        transport.events = []

        let second = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T18:00:00.000Z"),
            calendar: newYorkCalendar()
        )
        XCTAssertEqual(second.ownedEventIds, [])
        XCTAssertEqual(second.candidates, [])
    }

    // MARK: - Authentication

    func testExpiredCredentialOnTheCalendarFailsTheWholeLoad() async throws {
        let transport = FixtureTransport(events: [])
        transport.listError = ScheduleTransportError.credentialExpired

        do {
            _ = try await ScheduleSource(transport: transport).loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )
            XCTFail("An expired credential must fail instead of returning an empty calendar")
        } catch let error as ScheduleSourceError {
            XCTAssertEqual(error, .credentialExpired)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    func testUnauthorizedDetailReadFailsTheWholeLoad() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 501,
                    start: "2026-03-04T12:00:00.000Z",
                    hasWorkout: false
                ),
            ]
        )
        transport.detailErrors[501] = ScheduleTransportError.unauthorized

        do {
            _ = try await ScheduleSource(transport: transport).loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )
            XCTFail("An invalid credential must fail the whole load")
        } catch let error as ScheduleSourceError {
            XCTAssertEqual(error, .unauthorized)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - List failures

    func testCalendarFailureDoesNotLookLikeACancelledSchedule() async throws {
        let transport = FixtureTransport(
            events: [
                try row(eventId: 601, start: "2026-03-04T12:00:00.000Z"),
            ]
        )
        let source = ScheduleSource(transport: transport)

        let first = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T17:00:00.000Z"),
            calendar: newYorkCalendar()
        )
        XCTAssertEqual(first.candidates.map(\.eventId), [601])

        transport.listError = ScheduleTransportError.transportFailure(status: 503)

        do {
            _ = try await source.loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T18:00:00.000Z"),
                calendar: newYorkCalendar()
            )
            XCTFail("A failed list must throw, never return an empty authoritative snapshot")
        } catch let error as ScheduleSourceError {
            XCTAssertEqual(error, .calendarUnavailable)
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }

    // MARK: - Detail reads

    func testDetailIsFetchedOnlyWhenTheCalendarRowHasNoWorkout() async throws {
        let missingWorkout = try row(
            eventId: 701,
            start: "2026-03-04T12:00:00.000Z",
            hasWorkout: false
        )
        let transport = FixtureTransport(
            events: [
                missingWorkout,
                try row(eventId: 702, start: "2026-03-04T13:00:00.000Z"),
            ]
        )
        transport.details[701] = try row(
            eventId: 701,
            start: "2026-03-04T12:00:00.000Z"
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [701, 702])
        XCTAssertEqual(snapshot.candidates.map(\.eventId), [701, 702])
        XCTAssertEqual(transport.detailRequests, [701])
    }

    func testTransientDetailFailureKeepsTheOwnedIDForThePreviousEntry() async throws {
        let transport = FixtureTransport(
            events: [
                try row(eventId: 801, start: "2026-03-04T12:00:00.000Z"),
            ]
        )
        let source = ScheduleSource(transport: transport)

        let first = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T17:00:00.000Z"),
            calendar: newYorkCalendar()
        )
        XCTAssertEqual(first.candidates.map(\.eventId), [801])

        transport.events = [
            try row(
                eventId: 801,
                start: "2026-03-04T12:00:00.000Z",
                hasWorkout: false
            ),
        ]
        transport.detailErrors[801] = ScheduleTransportError.transportFailure(status: 500)

        let second = try await source.loadSnapshot(
            scope: scope,
            now: try date("2026-03-04T18:00:00.000Z"),
            calendar: newYorkCalendar()
        )
        XCTAssertEqual(second.ownedEventIds, [801])
        XCTAssertEqual(second.candidates, [])
        XCTAssertEqual(second.skipped.count, 1)
        XCTAssertEqual(second.skipped.first?.eventId, 801)
        XCTAssertEqual(second.skipped.first?.reason, .detailUnavailable)
        XCTAssertEqual(second.skipped.first?.reason.isRetryable, true)
    }

    func testForeignDetailResponseIsNotMapped() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 901,
                    start: "2026-03-04T12:00:00.000Z",
                    hasWorkout: false
                ),
            ]
        )
        transport.details[901] = try row(
            eventId: 901,
            athleteId: 999,
            start: "2026-03-04T12:00:00.000Z"
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [901])
        XCTAssertEqual(snapshot.candidates, [])
        XCTAssertEqual(snapshot.skipped.first?.eventId, 901)
        XCTAssertEqual(snapshot.skipped.first?.reason, .foreignEvent)
        XCTAssertEqual(snapshot.skipped.first?.reason.isRetryable, false)
        XCTAssertEqual(transport.zoneRequests, [])
    }

    // MARK: - Zone reads

    func testZonePrescriptionResolvesOnceAgainstTheSignedInAthlete() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 1001,
                    sport: "CYCLING",
                    start: "2026-03-04T12:00:00.000Z",
                    steps: [step(targets: [zoneTarget(42)])]
                ),
                try row(
                    eventId: 1002,
                    sport: "CYCLING",
                    start: "2026-03-05T12:00:00.000Z",
                    steps: [step(targets: [zoneTarget(42)])]
                ),
            ],
            zones: [zone()]
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.candidates.map(\.eventId), [1001, 1002])
        XCTAssertEqual(transport.zoneRequests, [scope])
        let target = try XCTUnwrap(
            snapshot.candidates.first?.plan.blocks.first?.steps.first?.target
        )
        XCTAssertEqual(target.zoneId, 42)
        XCTAssertEqual(target.lowerBound, 200)
        XCTAssertEqual(target.upperBound, 250)
    }

    func testTransientZoneFailureSkipsOnlyZonePrescriptions() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 1101,
                    sport: "CYCLING",
                    start: "2026-03-04T12:00:00.000Z",
                    steps: [step(targets: [zoneTarget(42)])]
                ),
                try row(
                    eventId: 1102,
                    sport: "CYCLING",
                    start: "2026-03-05T12:00:00.000Z"
                ),
                try row(
                    eventId: 1103,
                    sport: "CYCLING",
                    start: "2026-03-06T12:00:00.000Z",
                    steps: [step(targets: [zoneTarget(42)])]
                ),
            ]
        )
        transport.zonesError = ScheduleTransportError.transportFailure(status: 500)

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [1101, 1102, 1103])
        XCTAssertEqual(snapshot.candidates.map(\.eventId), [1102])
        XCTAssertEqual(
            snapshot.skipped.map(\.eventId),
            [1101, 1103]
        )
        XCTAssertEqual(
            snapshot.skipped.map(\.reason),
            [.zonesUnavailable, .zonesUnavailable]
        )
        XCTAssertEqual(
            snapshot.skipped.map(\.reason.isRetryable),
            [true, true]
        )
        XCTAssertEqual(transport.zoneRequests, [scope])
    }

    // MARK: - Terminal states

    func testCompletedSessionStaysOwnedButIsNotMapped() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 1201,
                    sport: "CYCLING",
                    start: "2026-03-04T12:00:00.000Z",
                    relatedActivityId: 9000,
                    steps: [step(targets: [zoneTarget(42)])]
                ),
            ]
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [1201])
        XCTAssertEqual(snapshot.completedEventIds, [1201])
        XCTAssertEqual(snapshot.candidates, [])
        XCTAssertEqual(snapshot.skipped, [])
        XCTAssertEqual(transport.zoneRequests, [])
    }

    func testUnsupportedPrescriptionIsReportedWithTheMapperReason() async throws {
        let transport = FixtureTransport(
            events: [
                try row(
                    eventId: 1301,
                    sport: "STRENGTH",
                    start: "2026-03-04T12:00:00.000Z"
                ),
            ]
        )

        let snapshot = try await ScheduleSource(transport: transport)
            .loadSnapshot(
                scope: scope,
                now: try date("2026-03-04T17:00:00.000Z"),
                calendar: newYorkCalendar()
            )

        XCTAssertEqual(snapshot.ownedEventIds, [1301])
        XCTAssertEqual(snapshot.candidates, [])
        XCTAssertEqual(
            snapshot.skipped.first?.reason,
            .unsupported(.unsupportedSport)
        )
        XCTAssertEqual(snapshot.skipped.first?.reason.isRetryable, false)
    }
}

// MARK: - Fixture transport

private struct ListRequest {
    let scope: AccountScope
    let from: Date
    let to: Date
}

private final class FixtureTransport: ScheduleTransport {
    var events: [CalendarEventInput]
    var listError: Error?
    var details: [Int: CalendarEventInput] = [:]
    var detailErrors: [Int: Error] = [:]
    var zones: [ZoneInput]
    var zonesError: Error?

    private(set) var listRequests: [ListRequest] = []
    private(set) var detailRequests: [Int] = []
    private(set) var zoneRequests: [AccountScope] = []

    init(events: [CalendarEventInput], zones: [ZoneInput] = []) {
        self.events = events
        self.zones = zones
    }

    func listEvents(
        scope: AccountScope,
        from: Date,
        to: Date
    ) async throws -> [CalendarEventInput] {
        listRequests.append(ListRequest(scope: scope, from: from, to: to))
        if let listError {
            throw listError
        }
        return events
    }

    func eventDetail(
        scope: AccountScope,
        eventId: Int
    ) async throws -> CalendarEventInput {
        detailRequests.append(eventId)
        if let error = detailErrors[eventId] {
            throw error
        }
        guard let detail = details[eventId] else {
            throw ScheduleTransportError.eventNotFound
        }
        return detail
    }

    func trainingZones(scope: AccountScope) async throws -> [ZoneInput] {
        zoneRequests.append(scope)
        if let zonesError {
            throw zonesError
        }
        return zones
    }
}
