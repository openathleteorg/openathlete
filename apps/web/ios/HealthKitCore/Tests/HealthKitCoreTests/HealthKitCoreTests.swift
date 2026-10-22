import XCTest

@testable import HealthKitCore

final class HealthKitCoreTests: XCTestCase {
  let watch = HealthSampleSource(
    bundleIdentifier: "test.watch", name: "Watch", version: "1", productType: "Watch6,18",
    deviceModel: "Watch", operatingSystemVersion: "27.0")
  let other = HealthSampleSource(
    bundleIdentifier: "test.other", name: "Other", version: "1", productType: nil, deviceModel: nil,
    operatingSystemVersion: nil)

  func date(_ text: String) -> Date { ISO8601DateFormatter().date(from: text)! }
  func snapshot(types: [HealthReadingType] = [.hrv, .sleep, .restingHeartRate]) throws
    -> HealthSnapshot
  {
    HealthSnapshot(
      binding: try HealthBinding(apiBaseURL: "https://train.example.org/api", accountID: "1"),
      selection: try HealthSelection(types: types, historyDays: 30, timeZone: "Europe/Berlin"),
      historyStart: date("2026-01-01T00:00:00Z")
    )
  }
  func sample(
    _ id: String, _ start: String, _ end: String, type: HealthReadingType = .sleep,
    value: Double? = nil, stage: Int? = nil, source: HealthSampleSource? = nil
  ) -> HealthLocalSample {
    HealthLocalSample(
      uuid: id, type: type, start: date(start), end: date(end), value: value,
      unit: type == .hrv
        ? "ms"
        : type == .restingHeartRate ? "bpm" : type == .weight ? "kg" : type == .bodyFat ? "%" : nil,
      categoryValue: stage, source: source ?? watch, timeZone: "Europe/Berlin",
      wasUserEntered: false)
  }

  func testBindingsPreserveAPIPrefixAndRejectUnsafeURLs() throws {
    let normalized = try HealthBinding(
      apiBaseURL: "https://TRAIN.example.org:443/api/", accountID: "1")
    XCTAssertEqual(normalized.apiBaseURL, "https://train.example.org/api")
    for url in [
      "http://example.org", "https://user:password@example.org", "https://example.org?token=1",
      "https://example.org/#x",
    ] {
      XCTAssertThrowsError(try HealthBinding(apiBaseURL: url, accountID: "1"))
    }
    XCTAssertThrowsError(try HealthBinding(apiBaseURL: "https://example.org", accountID: ""))
  }

  func testInvalidScopesAreRejected() {
    XCTAssertThrowsError(try HealthSelection(types: [], historyDays: 30, timeZone: "UTC"))
    XCTAssertThrowsError(
      try HealthSelection(types: [.hrv, .hrv], historyDays: 30, timeZone: "UTC"))
    XCTAssertThrowsError(
      try HealthSelection(types: [.hrv], historyDays: 1_000_000, timeZone: "UTC"))
    XCTAssertThrowsError(
      try HealthSelection(types: [.hrv], historyDays: 30, timeZone: "not-a-zone"))
  }

  func testSampleReplayAndDeletionAreUUIDBased() throws {
    var state = try snapshot()
    let a = sample("a", "2026-01-15T02:00:00Z", "2026-01-15T02:01:00Z", type: .hrv, value: 42)
    let b = sample("b", "2026-01-15T02:00:00Z", "2026-01-15T02:01:00Z", type: .hrv, value: 42)
    try state.apply(
      type: .hrv, additions: [a, b, a], deletions: [], anchor: Data([1]), complete: true)
    XCTAssertEqual(state.samples.count, 2)
    try state.apply(
      type: .sleep, additions: [], deletions: ["a"], anchor: Data([2]), complete: true)
    XCTAssertNotNil(state.samples["a"])
    try state.apply(type: .hrv, additions: [a], deletions: ["a"], anchor: Data([3]), complete: true)
    XCTAssertNil(state.samples["a"])
    XCTAssertNotNil(state.samples["b"])
    XCTAssertEqual(state.anchors[HealthReadingType.hrv.rawValue], Data([3]))
  }

  func testEmptyReadDoesNotDeleteExistingSamples() throws {
    var state = try snapshot()
    let a = sample("a", "2026-01-15T02:00:00Z", "2026-01-15T02:01:00Z", type: .hrv, value: 42)
    try state.apply(type: .hrv, additions: [a], deletions: [], anchor: Data([1]), complete: true)
    try state.apply(type: .hrv, additions: [], deletions: [], anchor: Data([2]), complete: true)
    XCTAssertEqual(state.samples.count, 1)
  }

  func testInvalidPageDoesNotAdvanceAnchor() throws {
    var state = try snapshot()
    let invalid = sample(
      "bad", "2026-01-16T02:00:00Z", "2026-01-15T02:00:00Z", type: .hrv, value: 42)
    XCTAssertThrowsError(
      try state.apply(
        type: .hrv, additions: [invalid], deletions: [], anchor: Data([9]), complete: true))
    XCTAssertTrue(state.samples.isEmpty)
    XCTAssertTrue(state.anchors.isEmpty)
  }

  func testRawSamplesAndAnchorsSurviveRestartAndAnotherAccountClearsThem() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: folder) }
    let store = HealthSnapshotStore(directory: folder)
    var state = try snapshot()
    let a = sample("a", "2026-01-15T02:00:00Z", "2026-01-15T02:01:00Z", type: .hrv, value: 42.125)
    try state.apply(
      type: .hrv, additions: [a], deletions: [], anchor: Data([1, 2, 3]), complete: false)
    try store.save(state)
    let restored = try XCTUnwrap(
      HealthSnapshotStore(directory: folder).load(binding: state.binding))
    XCTAssertEqual(restored.samples["a"], a)
    XCTAssertEqual(restored.anchors, state.anchors)
    XCTAssertEqual(restored.historyStart, state.historyStart)
    let otherBinding = try HealthBinding(apiBaseURL: state.binding.apiBaseURL, accountID: "2")
    XCTAssertNil(try store.load(binding: otherBinding))
    XCTAssertNil(try store.load(binding: state.binding))
  }

  func testDifferentServerClearsLocalData() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: folder) }
    let store = HealthSnapshotStore(directory: folder)
    let state = try snapshot()
    try store.save(state)
    XCTAssertNil(
      try store.load(
        binding: HealthBinding(apiBaseURL: "https://different.example.org/api", accountID: "1")))
    XCTAssertNil(try store.load(binding: state.binding))
  }

  func testSDNNMeanSourceSelectionAndLocalDate() throws {
    var state = try snapshot()
    let samples = [
      sample("a", "2026-01-15T23:00:00Z", "2026-01-15T23:01:00Z", type: .hrv, value: 40),
      sample("b", "2026-01-16T02:00:00Z", "2026-01-16T02:01:00Z", type: .hrv, value: 60),
      sample(
        "c", "2026-01-16T02:00:00Z", "2026-01-16T02:01:00Z", type: .hrv, value: 999, source: other),
    ]
    try state.apply(type: .hrv, additions: samples, deletions: [], anchor: Data(), complete: true)
    let metric = try XCTUnwrap(HealthPreviewBuilder.build(state).metrics.first)
    XCTAssertEqual(metric.type, "HRV_SDNN")
    XCTAssertEqual(metric.unit, "ms")
    XCTAssertEqual(metric.date, "2026-01-16")
    XCTAssertEqual(metric.value, 50)
    XCTAssertEqual(metric.sampleCount, 2)
    state.preferredSources[HealthReadingType.hrv.rawValue] = other.id
    XCTAssertEqual(HealthPreviewBuilder.build(state).metrics.first?.value, 999)
  }

  func testRestingHeartRateUsesLatestSampleRatherThanMinimumOrMean() throws {
    var state = try snapshot()
    try state.apply(
      type: .restingHeartRate,
      additions: [
        sample(
          "a", "2026-01-15T01:00:00Z", "2026-01-15T01:01:00Z", type: .restingHeartRate, value: 50),
        sample(
          "b", "2026-01-15T04:00:00Z", "2026-01-15T04:01:00Z", type: .restingHeartRate, value: 60),
      ], deletions: [], anchor: Data(), complete: true)
    XCTAssertEqual(HealthPreviewBuilder.build(state).metrics.first?.value, 60)
  }

  func testSleepUnionDoesNotCountGenericCoverageOrOtherSourcesTwice() throws {
    var state = try snapshot()
    try state.apply(
      type: .sleep,
      additions: [
        sample("generic", "2026-01-14T22:00:00Z", "2026-01-15T06:00:00Z", stage: 1),
        sample("core", "2026-01-14T22:00:00Z", "2026-01-15T02:00:00Z", stage: 3),
        sample("deep", "2026-01-15T02:00:00Z", "2026-01-15T04:00:00Z", stage: 4),
        sample("rem", "2026-01-15T04:00:00Z", "2026-01-15T06:00:00Z", stage: 5),
        sample("inbed", "2026-01-14T20:00:00Z", "2026-01-15T08:00:00Z", stage: 0),
        sample("other", "2026-01-14T20:00:00Z", "2026-01-15T08:00:00Z", stage: 1, source: other),
      ], deletions: [], anchor: Data(), complete: true)
    let preview = HealthPreviewBuilder.build(state)
    XCTAssertEqual(preview.metrics.first?.value, 8)
    XCTAssertEqual(preview.sleep.first?.core, 4)
    XCTAssertEqual(preview.sleep.first?.deep, 2)
    XCTAssertEqual(preview.sleep.first?.rem, 2)
    XCTAssertEqual(preview.sleep.first?.unspecified, 0)
  }

  func testSleepConflictingStagesRemainUnspecifiedAndFlagged() throws {
    var state = try snapshot()
    try state.apply(
      type: .sleep,
      additions: [
        sample("core", "2026-01-15T00:00:00Z", "2026-01-15T02:00:00Z", stage: 3),
        sample("deep", "2026-01-15T01:00:00Z", "2026-01-15T03:00:00Z", stage: 4),
      ], deletions: [], anchor: Data(), complete: true)
    let preview = HealthPreviewBuilder.build(state)
    XCTAssertEqual(preview.metrics.first?.value, 3)
    XCTAssertEqual(preview.sleep.first?.unspecified, 1)
    XCTAssertEqual(preview.sleep.first?.hasConflicts, true)
  }

  func testAwakeIntervalsAreRemovedFromGenericAsleepCoverage() throws {
    var state = try snapshot()
    try state.apply(
      type: .sleep,
      additions: [
        sample("generic", "2026-01-14T22:00:00Z", "2026-01-15T06:00:00Z", stage: 1),
        sample("awake", "2026-01-15T02:00:00Z", "2026-01-15T02:30:00Z", stage: 2),
      ], deletions: [], anchor: Data(), complete: true)
    let preview = HealthPreviewBuilder.build(state)
    XCTAssertEqual(preview.metrics.first?.value, 7.5)
    XCTAssertEqual(preview.sleep.first?.awake, 0.5)
    XCTAssertEqual(preview.sleep.first?.hasConflicts, false)
  }

  func testSleepDSTUsesElapsedTimeAndKeepsNapOutOfMainEpisode() throws {
    var state = try snapshot()
    try state.apply(
      type: .sleep,
      additions: [
        sample("night", "2026-10-24T21:00:00Z", "2026-10-25T06:00:00Z", stage: 1),
        sample("nap", "2026-10-25T12:00:00Z", "2026-10-25T13:00:00Z", stage: 1),
      ], deletions: [], anchor: Data(), complete: true)
    let metric = try XCTUnwrap(HealthPreviewBuilder.build(state).metrics.first)
    XCTAssertEqual(metric.date, "2026-10-25")
    XCTAssertEqual(metric.value, 9)
    XCTAssertEqual(state.samples.count, 2)
  }

  func testDeletingASleepSampleRecomputesPreview() throws {
    var state = try snapshot()
    try state.apply(
      type: .sleep,
      additions: [
        sample("a", "2026-01-15T00:00:00Z", "2026-01-15T02:00:00Z", stage: 3),
        sample("b", "2026-01-15T02:00:00Z", "2026-01-15T04:00:00Z", stage: 4),
      ], deletions: [], anchor: Data(), complete: true)
    try state.apply(
      type: .sleep, additions: [], deletions: ["b"], anchor: Data([1]), complete: true)
    XCTAssertEqual(HealthPreviewBuilder.build(state).metrics.first?.value, 2)
    XCTAssertEqual(HealthPreviewBuilder.build(state).sleep.first?.deep, 0)
  }

  func testSummaryExportKeepsFullHistoryAndNormalizedSleepWhileExcludingUnsupportedMetrics() {
    let metrics = (0..<365).map { day in
      HealthDailyPreview(
        type: "HRV_SDNN", date: "day-\(day)", value: 42.12345, unit: "ms",
        sampleCount: 12, sourceID: "watch")
    }
    let extras = [
      HealthDailyPreview(
        type: "SLEEP_DURATION", date: "conflict", value: 3, unit: "h",
        sampleCount: 2, sourceID: "watch"),
      HealthDailyPreview(
        type: "WRIST_TEMPERATURE", date: "day-0", value: 35, unit: "degC",
        sampleCount: 1, sourceID: "watch"),
    ]
    let exported = HealthPreviewBuilder.importableMetrics(metrics + extras)
    XCTAssertEqual(exported.count, 366)
    XCTAssertEqual(exported, metrics + [extras[0]])
    XCTAssertEqual(exported.first?.value, 42.12345)
  }

  func testWeightAndBodyFatUseLatestReadingPerLocalDayAndPreserveUnits() throws {
    var state = try snapshot(types: [.weight, .bodyFat])
    for (type, values) in [
      (HealthReadingType.weight, [72.345, 72.125]), (.bodyFat, [22.5, 22.25]),
    ] {
      try state.apply(
        type: type,
        additions: [
          sample(
            "\(type)-earlier", "2026-01-15T06:00:00Z", "2026-01-15T06:00:00Z", type: type,
            value: values[0]),
          sample(
            "\(type)-latest", "2026-01-15T07:00:00Z", "2026-01-15T07:00:00Z", type: type,
            value: values[1]),
          sample(
            "\(type)-other", "2026-01-15T08:00:00Z", "2026-01-15T08:00:00Z", type: type, value: 99,
            source: other),
        ], deletions: [], anchor: Data(), complete: true)
    }
    let exported = HealthPreviewBuilder.importableMetrics(HealthPreviewBuilder.build(state).metrics)
    let weight = try XCTUnwrap(exported.first { $0.type == "WEIGHT" })
    let fat = try XCTUnwrap(exported.first { $0.type == "BODY_FAT" })
    XCTAssertEqual(weight.value, 72.125)
    XCTAssertEqual(weight.unit, "kg")
    XCTAssertEqual(fat.value, 22.25)
    XCTAssertEqual(fat.unit, "%")
    XCTAssertEqual(weight.date, "2026-01-15")
    XCTAssertEqual(weight.sampleCount, 2)
    XCTAssertEqual(state.samples.count, 6)
  }

  func testWatchStageAndAwakeOverlapsNormalizeAndRemainExportable() throws {
    var state = try snapshot(types: [.sleep])
    try state.apply(
      type: .sleep,
      additions: [
        sample("core", "2026-01-14T22:00:00Z", "2026-01-15T06:00:00Z", stage: 3),
        sample("deep", "2026-01-15T01:00:00Z", "2026-01-15T02:00:00Z", stage: 4),
        sample("awake", "2026-01-15T03:00:00Z", "2026-01-15T03:03:00Z", stage: 2),
      ], deletions: [], anchor: Data(), complete: true)
    let preview = HealthPreviewBuilder.build(state)
    let sleep = try XCTUnwrap(preview.sleep.first)
    XCTAssertEqual(sleep.unspecified, 1)
    XCTAssertEqual(sleep.awake, 0.05, accuracy: 0.000001)
    let exported = try XCTUnwrap(HealthPreviewBuilder.importableMetrics(preview.metrics).first)
    XCTAssertEqual(exported.type, "SLEEP_DURATION")
    XCTAssertEqual(exported.value, 7.95, accuracy: 0.000001)
    XCTAssertEqual(
      sleep.core + sleep.deep + sleep.rem + sleep.unspecified, exported.value, accuracy: 0.000001)
  }
}
