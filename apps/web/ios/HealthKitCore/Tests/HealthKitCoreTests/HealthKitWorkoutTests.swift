import XCTest

@testable import HealthKitCore

final class HealthKitWorkoutTests: XCTestCase {
  let binding = try! HealthBinding(apiBaseURL: "https://train.example.org/api", accountID: "1")
  let uuid = "12345678-1234-4234-8234-123456789abc"
  func record(distance: Double = 5_000) -> HealthWorkoutRecord {
    HealthWorkoutRecord(
      uuid: uuid, activityType: 37, sport: "RUNNING",
      start: Date(timeIntervalSince1970: 1_700_000_000.123456),
      end: Date(timeIntervalSince1970: 1_700_001_800.654321),
      activeDuration: 1_700, distanceMeters: distance, energyKilojoules: nil,
      elevationGainMeters: nil,
      source: HealthSampleSource(
        bundleIdentifier: "test.watch", name: "Watch", version: "1", productType: "Watch6,18",
        deviceModel: "Watch", operatingSystemVersion: nil),
      timeZone: nil, externalUUID: nil, wasUserEntered: false, indoor: false, events: [],
      channels: [:], route: [])
  }
  func snapshot() throws -> HealthWorkoutSnapshot {
    HealthWorkoutSnapshot(
      binding: binding,
      selection: try HealthWorkoutSelection(
        historyDays: 30, includeSensors: true, includeRoute: false),
      historyStart: Date(timeIntervalSince1970: 1_699_000_000))
  }
  func testReplayKeepsRevisionAndChangedContentIncrementsIt() throws {
    var value = try snapshot()
    try value.apply(additions: [record()], deletions: [], anchor: Data([1]), complete: true)
    let first = value.workouts[uuid]!.revision
    XCTAssertGreaterThan(first, 0)
    try value.apply(additions: [record()], deletions: [], anchor: Data([2]), complete: true)
    XCTAssertEqual(value.workouts[uuid]!.revision, first)
    try value.apply(
      additions: [record(distance: 5_010)], deletions: [], anchor: Data([3]), complete: true)
    XCTAssertGreaterThan(value.workouts[uuid]!.revision, first)
  }
  func testInvalidPageDoesNotAdvanceAnchorOrPartiallyApply() throws {
    var value = try snapshot()
    try value.apply(additions: [record()], deletions: [], anchor: Data([1]), complete: false)
    XCTAssertThrowsError(
      try value.apply(
        additions: [record(distance: -1)], deletions: [uuid], anchor: Data([2]), complete: true))
    XCTAssertEqual(value.anchor, Data([1]))
    XCTAssertEqual(value.workouts.count, 1)
    XCTAssertTrue(value.hasMore)
    try value.apply(additions: [], deletions: [uuid], anchor: Data([3]), complete: true)
    XCTAssertTrue(value.workouts.isEmpty)
    XCTAssertFalse(value.hasMore)
  }
  func testProtectedStoreRoundTripAndAccountIsolation() throws {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: directory) }
    let store = HealthWorkoutStore(directory: directory)
    var value = try snapshot()
    try value.apply(additions: [record()], deletions: [], anchor: Data([4]), complete: true)
    try store.save(value)
    var loaded = try XCTUnwrap(store.load(binding: binding))
    let revision = loaded.workouts[uuid]!.revision
    try loaded.apply(additions: [record()], deletions: [], anchor: Data([5]), complete: true)
    XCTAssertEqual(loaded.workouts[uuid]!.revision, revision)
    let other = try HealthBinding(apiBaseURL: binding.apiBaseURL, accountID: "2")
    XCTAssertNil(try store.load(binding: other))
    XCTAssertNil(try store.load(binding: binding))
  }
}
