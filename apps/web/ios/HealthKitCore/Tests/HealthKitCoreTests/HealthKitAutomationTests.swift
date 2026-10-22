import XCTest

@testable import HealthKitCore

final class HealthKitAutomationTests: XCTestCase {
  func testAutomaticAttemptsCannotRunMoreThanOncePerHour() {
    let now = Date(timeIntervalSince1970: 1_700_000_000)
    XCTAssertNil(HealthAutomaticSyncPolicy.nextAttempt(lastAttempt: nil, retryAfter: nil))
    XCTAssertEqual(HealthAutomaticSyncPolicy.nextAttempt(lastAttempt: now, retryAfter: nil), now.addingTimeInterval(3600))
    // Token failures, history continuations and fresh Health notifications cannot shorten the gap.
    for seconds: Double in [2, 30, 120, 3599] {
      XCTAssertEqual(HealthAutomaticSyncPolicy.nextAttempt(lastAttempt: now, retryAfter: now.addingTimeInterval(seconds)), now.addingTimeInterval(3600))
    }
    // A longer server backoff still takes precedence.
    XCTAssertEqual(HealthAutomaticSyncPolicy.nextAttempt(lastAttempt: now, retryAfter: now.addingTimeInterval(7200)), now.addingTimeInterval(7200))
  }

  func testHourlyBudgetSurvivesAnAppRestart() throws {
    let binding = try HealthBinding(apiBaseURL: "https://train.example.org/api", accountID: "42")
    var configuration = HealthSyncConfiguration(binding: binding)
    configuration.lastAttempt = Date(timeIntervalSince1970: 1_700_000_000)
    let restored = try JSONDecoder().decode(HealthSyncConfiguration.self, from: JSONEncoder().encode(configuration))
    XCTAssertEqual(HealthAutomaticSyncPolicy.nextAttempt(lastAttempt: restored.lastAttempt, retryAfter: nil), configuration.lastAttempt!.addingTimeInterval(3600))
  }

  func testAutomaticConsentRequiresBothPermissionsAndRevocationStopsIt() {
    var value = HealthSyncConsent(read: true, upload: true, automatic: true)
    value.normalize()
    XCTAssertTrue(value.automatic)
    value.upload = false
    value.normalize()
    XCTAssertFalse(value.automatic)
    value.upload = true
    value.normalize()
    XCTAssertFalse(value.automatic)  // Regranting a permission does not opt in again.
    value.automatic = true
    value.read = false
    value.normalize()
    XCTAssertFalse(value.automatic)
  }

  func testConfigurationPersistsConsentScopeAndReceiptsWithoutTokens() throws {
    let binding = try HealthBinding(apiBaseURL: "https://train.example.org/api", accountID: "42")
    var value = HealthSyncConfiguration(binding: binding)
    value.measurements = try HealthSelection(types: [.hrv], historyDays: 30, timeZone: "UTC")
    value.measurementConsent = HealthSyncConsent(read: true, upload: true, automatic: true)
    value.workoutReceipts["test"] = 7
    let data = try JSONEncoder().encode(value)
    let restored = try JSONDecoder().decode(HealthSyncConfiguration.self, from: data)
    XCTAssertEqual(restored.binding, binding)
    XCTAssertTrue(restored.measurementConsent.automatic)
    XCTAssertEqual(restored.workoutReceipts["test"], 7)
    XCTAssertFalse(String(decoding: data, as: UTF8.self).contains("Token"))
  }

  func testNativeUploadRetainsFractionalInstantsAndMatchesMillisecondsElapsed() throws {
    let source = HealthSampleSource(
      bundleIdentifier: "test.watch", name: "Watch", version: "1", productType: "Watch6,18",
      deviceModel: nil, operatingSystemVersion: nil)
    let workout = HealthWorkoutRecord(
      revision: 42, uuid: "12345678-1234-4234-8234-123456789abc", activityType: 37,
      sport: "RUNNING", start: Date(timeIntervalSince1970: 1_700_000_000.123456),
      end: Date(timeIntervalSince1970: 1_700_001_800.654321),
      activeDuration: 1700.123, distanceMeters: 5000.25, energyKilojoules: 1000.567,
      elevationGainMeters: nil,
      source: source, timeZone: nil, externalUUID: nil, wasUserEntered: false, indoor: false,
      events: [], channels: [:], route: [])
    let body = try XCTUnwrap(
      JSONSerialization.jsonObject(with: HealthWorkoutUpload.body(workout)) as? [String: Any])
    let start = try XCTUnwrap(body["startDate"] as? String)
    let end = try XCTUnwrap(body["endDate"] as? String)
    XCTAssertTrue(start.contains(".123"))
    XCTAssertTrue(end.contains(".654"))
    let elapsed = try XCTUnwrap(body["elapsedDuration"] as? [String: Any])
    XCTAssertEqual(elapsed["value"] as? Double, 1800.531)
    XCTAssertEqual((body["activeDuration"] as? [String: Any])?["value"] as? Double, 1700.123)
    XCTAssertEqual((body["energy"] as? [String: Any])?["unit"] as? String, "kJ")
    XCTAssertEqual(try HealthWorkoutUpload.body(workout), try HealthWorkoutUpload.body(workout))
  }
}
