import XCTest

@testable import WatchScheduleCore

final class WatchScheduleOptInDocumentTests: XCTestCase {
    private let scope = AccountScope(
        instanceURL: URL(string: "https://train.example.org/api")!,
        athleteId: 7
    )

    func testAbsentIsTheOnlyMissingValue() throws {
        XCTAssertNil(try WatchScheduleOptInDocument.decode(object: nil))
    }

    func testWrongTypeIsCorruptNotAbsent() {
        for object in ["7", 7, ["athleteId": 7], ["x"]] as [Any] {
            XCTAssertThrowsError(
                try WatchScheduleOptInDocument.decode(object: object)
            ) { error in
                XCTAssertEqual(
                    error as? WatchScheduleOptInDocumentError,
                    .corrupt
                )
            }
        }
    }

    func testValidDocumentRoundTrips() throws {
        let data = try XCTUnwrap(WatchScheduleOptInDocument.encode(scope))

        XCTAssertEqual(try WatchScheduleOptInDocument.decode(data: data), scope)
        XCTAssertEqual(
            try WatchScheduleOptInDocument.decode(object: data),
            scope
        )
    }

    func testEmptyOrMalformedDataIsCorrupt() {
        for data in [Data(), Data("{}".utf8), Data("not-json".utf8)] {
            XCTAssertThrowsError(
                try WatchScheduleOptInDocument.decode(data: data)
            ) { error in
                XCTAssertEqual(
                    error as? WatchScheduleOptInDocumentError,
                    .corrupt
                )
            }
        }
    }
}
