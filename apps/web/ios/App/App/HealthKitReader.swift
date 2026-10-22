import Capacitor
import Foundation
import HealthKit
import Security

/// Bridges HealthKit previews and consent to the web UI; the native worker also
/// uploads approved scopes when iOS grants background execution time.
@objc(OpenAthleteHealthKitPlugin)
public final class OpenAthleteHealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
  public let identifier = "OpenAthleteHealthKitPlugin"
  public let jsName = "OpenAthleteHealthKit"
  public let pluginMethods: [CAPPluginMethod] = [
    CAPPluginMethod(name: "workoutStatus", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "readWorkouts", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "workoutPayload", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "clearWorkouts", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "syncSettings", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "syncOverview", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "beginManualSync", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "endManualSync", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "updateCredentials", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "bindSession", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "selectSource", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "summaries", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
    CAPPluginMethod(name: "resetSession", returnType: CAPPluginReturnPromise),
  ]

  private let service = HealthKitLocalService.shared

  @objc public func beginManualSync(_ call: CAPPluginCall) {
    perform(call) { try await self.service.beginManualSync(binding: self.binding(call)) }
  }
  @objc public func endManualSync(_ call: CAPPluginCall) {
    perform(call) {
      await self.service.endManualSync(
        binding: try self.binding(call), lease: call.getString("lease"))
      return [:]
    }
  }
  @objc public func syncOverview(_ call: CAPPluginCall) {
    perform(call) { try await self.service.syncOverview(binding: self.binding(call)) }
  }

  @objc public func syncSettings(_ call: CAPPluginCall) {
    perform(call) {
      try await self.service.syncSettings(
        binding: self.binding(call), kind: call.getString("kind") ?? "",
        selection: call.getObject("selection") ?? [:],
        read: call.getBool("read"), upload: call.getBool("upload"),
        automatic: call.getBool("automatic"))
    }
  }
  @objc public func updateCredentials(_ call: CAPPluginCall) {
    perform(call) {
      try await self.service.updateCredentials(
        binding: self.binding(call),
        accessToken: call.getString("accessToken"), refreshToken: call.getString("refreshToken"))
      return ["updated": true]
    }
  }

  @objc public func workoutStatus(_ call: CAPPluginCall) {
    perform(call) { try await self.service.workoutStatus(binding: self.binding(call)) }
  }
  @objc public func clearWorkouts(_ call: CAPPluginCall) {
    perform(call) { try await self.service.clearWorkouts(binding: self.binding(call)) }
  }
  @objc public func workoutPayload(_ call: CAPPluginCall) {
    perform(call) {
      guard let uuid = call.getString("uuid") else { throw HealthLocalError.invalidSelection }
      return try await self.service.workoutPayload(binding: self.binding(call), uuid: uuid)
    }
  }
  @objc public func readWorkouts(_ call: CAPPluginCall) {
    perform(call) {
      guard call.getBool("localConsent") == true, let days = call.getInt("historyDays"),
        let sensors = call.getBool("includeSensors"), let route = call.getBool("includeRoute")
      else { throw HealthLocalError.invalidSelection }
      return try await self.service.readWorkouts(
        binding: self.binding(call),
        selection:
          HealthWorkoutSelection(historyDays: days, includeSensors: sensors, includeRoute: route))
    }
  }

  @objc public func status(_ call: CAPPluginCall) {
    perform(call) { try await self.service.status(binding: self.binding(call)) }
  }

  @objc public func bindSession(_ call: CAPPluginCall) {
    perform(call) {
      try await self.service.bindSession(binding: self.binding(call))
      return ["bound": true]
    }
  }

  @objc public func read(_ call: CAPPluginCall) {
    perform(call) {
      guard call.getBool("localConsent") == true,
        let names = call.getArray("types", String.self),
        let days = call.getInt("historyDays"), let zone = call.getString("timeZone")
      else { throw HealthLocalError.invalidSelection }
      let types = names.compactMap(HealthReadingType.init(rawValue:))
      guard types.count == names.count else { throw HealthLocalError.invalidSelection }
      let selection = try HealthSelection(types: types, historyDays: days, timeZone: zone)
      return try await self.service.read(binding: self.binding(call), selection: selection)
    }
  }

  @objc public func selectSource(_ call: CAPPluginCall) {
    perform(call) {
      guard let name = call.getString("type"), let type = HealthReadingType(rawValue: name),
        let sourceID = call.getString("sourceID")
      else { throw HealthLocalError.invalidSelection }
      return try await self.service.selectSource(
        binding: self.binding(call), type: type, sourceID: sourceID)
    }
  }

  @objc public func clear(_ call: CAPPluginCall) {
    perform(call) { try await self.service.clear(binding: self.binding(call)) }
  }

  @objc public func summaries(_ call: CAPPluginCall) {
    perform(call) { try await self.service.summaries(binding: self.binding(call)) }
  }

  @objc public func resetSession(_ call: CAPPluginCall) {
    perform(call) {
      try await self.service.resetSession()
      return ["cleared": true]
    }
  }

  private func binding(_ call: CAPPluginCall) throws -> HealthBinding {
    guard let url = call.getString("apiBaseURL"), let account = call.getString("accountID")
    else { throw HealthLocalError.invalidContext }
    return try HealthBinding(apiBaseURL: url, accountID: account)
  }

  private func perform(_ call: CAPPluginCall, action: @escaping () async throws -> JSObject) {
    Task {
      do { call.resolve(try await action()) } catch {
        let code: String
        let nsError = error as NSError
        if nsError.domain == HKErrorDomain
          && nsError.code == HKError.errorDatabaseInaccessible.rawValue
        {
          code = "HEALTHKIT_LOCKED"
        } else if nsError.domain == NSCocoaErrorDomain
          && [NSFileReadNoPermissionError, NSFileWriteNoPermissionError].contains(nsError.code)
        {
          code = "HEALTHKIT_LOCKED"
        } else if case HealthLocalError.busy = error {
          code = "HEALTH_SYNC_BUSY"
        } else if case HealthLocalError.storageLimit = error {
          code = "HEALTHKIT_STORAGE_LIMIT"
        } else if case HealthLocalError.wrongContext = error {
          code = "HEALTHKIT_SESSION_CHANGED"
        } else {
          code = "HEALTHKIT_READ_FAILED"
        }
        // Do not send OS error descriptions, samples or account credentials to JS logs.
        call.reject(code, code)
      }
    }
  }
}

actor HealthKitLocalService {
  static let shared = HealthKitLocalService()
  var automating = false
  var syncTaskGeneration = 0
  var configuringDelivery = false
  var deliveryGeneration = -1
  var networkTask: URLSessionTask?
  var syncConfiguration: HealthSyncConfiguration?
  var automationURL: URL { store.directory.appendingPathComponent("automation.json") }

  let health = HKHealthStore()
  let store: HealthSnapshotStore
  let workoutStore: HealthWorkoutStore
  var manualSyncLease: String?
  var reading = false
  var generation = 0
  var activeBinding: HealthBinding?
  private var queries: [HKQuery] = []
  private let cleanupKey = "openathlete.healthkit.pendingLocalCleanup"

  private init() {
    let directory = FileManager.default.urls(
      for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("OpenAthleteHealthKit", isDirectory: true)
    store = HealthSnapshotStore(directory: directory)
    workoutStore = HealthWorkoutStore(
      directory: directory.appendingPathComponent("Workouts", isDirectory: true))
  }

  func status(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == nil || activeBinding == binding else {
      throw HealthLocalError.wrongContext
    }
    activeBinding = binding
    return try describe(load(binding: binding))
  }

  func bindSession(binding: HealthBinding) throws {
    if activeBinding != binding {
      invalidate()
      networkTask?.cancel()
      syncTaskGeneration += 1
      if let saved = try? loadSyncConfiguration(), saved.binding != binding { try resetSession() }
    }
    activeBinding = binding
    _ = try load(binding: binding)
    _ = try workoutStore.load(binding: binding)
  }

  func resetSession() throws {
    UserDefaults.standard.set(true, forKey: cleanupKey)
    invalidate()
    networkTask?.cancel()
    syncTaskGeneration += 1
    syncConfiguration = nil
    UserDefaults.standard.removeObject(forKey: "openathlete.healthkit.pendingSync")
    try HealthSyncKeychain.clear()
    if FileManager.default.fileExists(atPath: automationURL.path) {
      try FileManager.default.removeItem(at: automationURL)
    }
    HealthKitWakeObserver.disableDelivery()
    activeBinding = nil
    UserDefaults.standard.set(true, forKey: cleanupKey)
    try store.clear()
    try workoutStore.clear()
    UserDefaults.standard.set(false, forKey: cleanupKey)
  }

  func clear(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == nil || activeBinding == binding else {
      throw HealthLocalError.wrongContext
    }
    invalidate()
    syncTaskGeneration += 1
    networkTask?.cancel()
    try store.clear()
    activeBinding = binding
    return try describe(nil)
  }

  private func invalidate() {
    manualSyncLease = nil
    generation += 1
    // One-shot query cancellation does not guarantee a completion callback.
    // Let it finish, then discard its result using the generation check.
  }

  func load(binding: HealthBinding) throws -> HealthSnapshot? {
    if UserDefaults.standard.bool(forKey: cleanupKey) {
      try store.clear()
      try workoutStore.clear()
      try HealthSyncKeychain.clear()
      if FileManager.default.fileExists(atPath: automationURL.path) {
        try FileManager.default.removeItem(at: automationURL)
      }
      syncConfiguration = nil
      UserDefaults.standard.set(false, forKey: cleanupKey)
    }
    return try store.load(binding: binding)
  }

  func beginManualSync(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard !reading, !automating, manualSyncLease == nil else { throw HealthLocalError.busy }
    let lease = UUID().uuidString
    manualSyncLease = lease
    return ["lease": lease]
  }

  func endManualSync(binding: HealthBinding, lease: String?) {
    guard activeBinding == binding, let lease, manualSyncLease == lease else { return }
    manualSyncLease = nil
    DispatchQueue.main.async {
      HealthKitWakeObserver.shared.retry(at: Date().addingTimeInterval(2))
    }
  }

  /// Read configuration without changing the selected scope or requesting Health access.
  func syncOverview(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == nil || activeBinding == binding else {
      throw HealthLocalError.wrongContext
    }
    activeBinding = binding
    _ = try load(binding: binding)
    var result: JSObject = ["busy": reading || automating || manualSyncLease != nil]
    guard let config = try loadSyncConfiguration() else { return result }
    guard config.binding == binding else { throw HealthLocalError.wrongContext }
    let suspended = UserDefaults.standard.bool(forKey: "openathlete.healthkit.syncSuspended")
    func section<T: Encodable>(_ selection: T?, _ consent: HealthSyncConsent) throws -> JSObject? {
      guard let selection else { return nil }
      let item: JSObject = [
        "selection": try HealthKitBridgeJSON.object(JSONEncoder().encode(selection)),
        "read": consent.read && !suspended, "upload": consent.upload && !suspended,
        "automatic": consent.automatic && !suspended,
      ]
      return item
    }
    if let item = try section(config.measurements, config.measurementConsent) {
      result["measurements"] = item
    }
    if let item = try section(config.workouts, config.workoutConsent) { result["workouts"] = item }
    return result
  }

  func workoutStatus(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == nil || activeBinding == binding else {
      throw HealthLocalError.wrongContext
    }
    activeBinding = binding
    _ = try load(binding: binding)  // also retries pending logout cleanup
    return try describeWorkouts(workoutStore.load(binding: binding))
  }

  func clearWorkouts(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == binding, !reading else { throw HealthLocalError.wrongContext }
    invalidate()
    syncTaskGeneration += 1
    networkTask?.cancel()
    try workoutStore.clear()
    return try describeWorkouts(nil)
  }

  func readWorkouts(
    binding: HealthBinding, selection: HealthWorkoutSelection, automatic: Bool = false
  ) async throws
    -> JSObject
  {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard HKHealthStore.isHealthDataAvailable(), !reading, !automating || automatic else {
      throw HealthLocalError.invalidSelection
    }
    let expected = generation
    reading = true
    defer { reading = false }
    if !automatic { try await HealthKitWorkoutReader.authorize(health, selection: selection) }
    try assertSession(binding, expected)
    _ = try load(binding: binding)
    var snapshot = try workoutStore.load(binding: binding)
    if snapshot?.selection != selection {
      snapshot = HealthWorkoutSnapshot(
        binding: binding, selection: selection,
        historyStart: Date().addingTimeInterval(-Double(selection.historyDays) * 86400))
      try workoutStore.save(snapshot!)
    }
    guard var current = snapshot else { throw HealthLocalError.invalidSelection }
    let page = try await HealthKitWorkoutReader.page(
      health, anchor: current.anchor, since: current.historyStart)
    try assertSession(binding, expected)
    var candidates = page.workouts
    // Watch sensors/routes can finish syncing after the workout itself. Refresh
    // recent cached recordings on subsequent reads without advancing past errors.
    if page.complete {
      let ids = Set(
        current.workouts.values.filter { $0.end > Date().addingTimeInterval(-7 * 86400) }
          .sorted { $0.end > $1.end }.prefix(20).compactMap { UUID(uuidString: $0.uuid) })
      if !ids.isEmpty {
        let recent = try await HealthKitWorkoutReader.samples(
          health, type: HKObjectType.workoutType(),
          predicate: HKQuery.predicateForObjects(with: ids), limit: 20)
        try assertSession(binding, expected)
        let present = Set(candidates.map { $0.uuid })
        candidates += recent.compactMap { $0 as? HKWorkout }.filter { !present.contains($0.uuid) }
      }
    }
    var additions: [HealthWorkoutRecord] = []
    for workout in candidates {
      if let record = try await HealthKitWorkoutReader.read(
        health, workout: workout, selection: selection)
      {
        additions.append(record)
      }
      try assertSession(binding, expected)
    }
    try current.apply(
      additions: additions, deletions: page.deleted, anchor: page.anchor, complete: page.complete)
    try workoutStore.save(current)
    return try describeWorkouts(current)
  }

  func workoutPayload(binding: HealthBinding, uuid: String) throws -> JSObject {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard !reading, let snapshot = try workoutStore.load(binding: binding), !snapshot.hasMore,
      let workout = snapshot.workouts[uuid]
    else { throw HealthLocalError.invalidSelection }
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .custom { date, encoder in
      var container = encoder.singleValueContainer()
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      try container.encode(formatter.string(from: date))
    }
    let object = try HealthKitBridgeJSON.object(encoder.encode(workout))
    let body = try HealthKitBridgeJSON.object(HealthWorkoutUpload.body(workout))
    return [
      "apiBaseURL": binding.apiBaseURL, "accountID": binding.accountID, "workout": object,
      "body": body,
    ]
  }

  private func describeWorkouts(_ snapshot: HealthWorkoutSnapshot?) throws -> JSObject {
    var result: JSObject = [
      "available": HKHealthStore.isHealthDataAvailable(), "hasMore": snapshot?.hasMore ?? false,
      "reading": reading,
      "workouts": snapshot?.workouts.values.sorted { $0.start > $1.start }.map {
        [
          "uuid": $0.uuid, "revision": $0.revision, "sport": $0.sport,
          "start": ISO8601DateFormatter().string(from: $0.start), "duration": $0.activeDuration,
        ] as JSObject
      } ?? [],
    ]
    if let snapshot {
      result["selection"] = [
        "historyDays": snapshot.selection.historyDays,
        "includeSensors": snapshot.selection.includeSensors,
        "includeRoute": snapshot.selection.includeRoute,
      ]
      result["lastRead"] = snapshot.lastRead.map { ISO8601DateFormatter().string(from: $0) }
    }
    return result
  }

  func selectSource(binding: HealthBinding, type: HealthReadingType, sourceID: String) throws
    -> JSObject
  {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard !reading, var snapshot = try load(binding: binding),
      snapshot.samples.values.contains(where: { $0.type == type && $0.source.id == sourceID })
    else { throw HealthLocalError.invalidSelection }
    snapshot.preferredSources[type.rawValue] = sourceID
    try store.save(snapshot)
    return try describe(snapshot)
  }

  func read(binding: HealthBinding, selection: HealthSelection, automatic: Bool = false)
    async throws -> JSObject
  {
    guard HKHealthStore.isHealthDataAvailable(), !reading, !automating || automatic else {
      throw HealthLocalError.invalidSelection
    }
    let sampleTypes = selection.types.compactMap(sampleType)
    guard sampleTypes.count == selection.types.count else {
      throw HealthLocalError.invalidSelection
    }
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    let currentGeneration = generation
    reading = true
    defer {
      reading = false
      queries.removeAll()
    }
    if !automatic {
      // Only called by the explicit user action. Completion is NOT a read-grant signal.
      try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<Void, Error>) in
        health.requestAuthorization(toShare: [], read: Set(sampleTypes)) { completed, error in
          if let error = error {
            continuation.resume(throwing: error)
          } else if !completed {
            continuation.resume(throwing: HealthLocalError.invalidSelection)
          } else {
            continuation.resume()
          }
        }
      }
    }
    try assertSession(binding, currentGeneration)
    var snapshot = try load(binding: binding)
    if snapshot?.selection != selection {
      let start = Calendar(identifier: .gregorian).date(
        byAdding: .day, value: -selection.historyDays, to: Date())!
      snapshot = HealthSnapshot(binding: binding, selection: selection, historyStart: start)
      try store.save(snapshot!)
    }
    guard var current = snapshot else { throw HealthLocalError.invalidSelection }
    // At most 10 pages/type per action. Repeat the action to resume a large history.
    for type in selection.types {
      for _ in 0..<(automatic ? 1 : 10) {
        try assertSession(binding, currentGeneration)
        let page = try await fetch(
          type, anchor: current.anchors[type.rawValue], since: current.historyStart)
        try assertSession(binding, currentGeneration)
        var next = current
        try next.apply(
          type: type, additions: page.samples, deletions: page.deleted, anchor: page.anchor,
          complete: page.complete)
        try store.save(next)
        current = next
        if page.complete { break }
      }
    }
    reading = false
    return try describe(current)
  }

  func assertSession(_ binding: HealthBinding, _ expected: Int) throws {
    try Task.checkCancellation()
    guard activeBinding == binding && generation == expected else {
      throw HealthLocalError.wrongContext
    }
  }

  func summaries(binding: HealthBinding) throws -> JSObject {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard !reading, let snapshot = try load(binding: binding), snapshot.lastRead != nil,
      snapshot.completeTypes.count == snapshot.selection.types.count
    else { throw HealthLocalError.invalidSelection }
    let preview = HealthPreviewBuilder.build(snapshot)
    let metrics = HealthPreviewBuilder.importableMetrics(preview.metrics)
      .map { metric -> JSObject in
        [
          "type": metric.type, "date": metric.date, "value": metric.value,
          "unit": metric.unit, "sampleCount": metric.sampleCount,
        ]
      }
    return [
      "apiBaseURL": binding.apiBaseURL, "accountID": binding.accountID,
      "timeZone": snapshot.selection.timeZone, "metrics": metrics,
    ]
  }

  func sampleType(_ type: HealthReadingType) -> HKSampleType? {
    switch type {
    case .sleep: return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
    case .hrv: return HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
    case .restingHeartRate: return HKObjectType.quantityType(forIdentifier: .restingHeartRate)
    case .respiratoryRate: return HKObjectType.quantityType(forIdentifier: .respiratoryRate)
    case .oxygenSaturation: return HKObjectType.quantityType(forIdentifier: .oxygenSaturation)
    case .weight: return HKObjectType.quantityType(forIdentifier: .bodyMass)
    case .bodyFat: return HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)
    case .wristTemperature:
      if #available(iOS 16, *) {
        return HKObjectType.quantityType(forIdentifier: .appleSleepingWristTemperature)
      }
      return nil
    }
  }

  private struct Page {
    let samples: [HealthLocalSample]
    let deleted: [String]
    let anchor: Data
    let complete: Bool
  }

  private func fetch(_ type: HealthReadingType, anchor: Data?, since: Date) async throws -> Page {
    let decoded = try anchor.map {
      try NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: $0)
    }
    let predicate = HKQuery.predicateForSamples(withStart: since, end: nil, options: [])
    return try await withCheckedThrowingContinuation { continuation in
      let query = HKAnchoredObjectQuery(
        type: sampleType(type)!, predicate: predicate, anchor: decoded ?? nil, limit: 500
      ) {
        _, samples, deleted, newAnchor, error in
        if let error = error {
          continuation.resume(throwing: error)
          return
        }
        guard let newAnchor = newAnchor else {
          continuation.resume(throwing: HealthLocalError.invalidSelection)
          return
        }
        do {
          let data = try NSKeyedArchiver.archivedData(
            withRootObject: newAnchor, requiringSecureCoding: true)
          let mapped = (samples ?? []).compactMap { Self.convert($0, type: type) }
          continuation.resume(
            returning: Page(
              samples: mapped, deleted: (deleted ?? []).map { $0.uuid.uuidString }, anchor: data,
              complete: (samples ?? []).count + (deleted ?? []).count < 500
            ))
        } catch { continuation.resume(throwing: error) }
      }
      queries.append(query)
      health.execute(query)
    }
  }

  private static func convert(_ sample: HKSample, type: HealthReadingType) -> HealthLocalSample? {
    let revision = sample.sourceRevision
    let os = revision.operatingSystemVersion
    let source = HealthSampleSource(
      bundleIdentifier: revision.source.bundleIdentifier, name: revision.source.name,
      version: revision.version, productType: revision.productType,
      deviceModel: sample.device?.model,
      operatingSystemVersion: "\(os.majorVersion).\(os.minorVersion).\(os.patchVersion)"
    )
    var value: Double?
    var unit: String?
    if let quantity = sample as? HKQuantitySample {
      let measurement: HKUnit
      switch type {
      case .weight:
        measurement = .gramUnit(with: .kilo)
        unit = "kg"
      case .bodyFat:
        measurement = .percent()
        unit = "%"
      case .hrv:
        measurement = .secondUnit(with: .milli)
        unit = "ms"
      case .restingHeartRate:
        measurement = HKUnit.count().unitDivided(by: .minute())
        unit = "bpm"
      case .respiratoryRate:
        measurement = HKUnit.count().unitDivided(by: .minute())
        unit = "breaths/min"
      case .oxygenSaturation:
        measurement = .percent()
        unit = "%"
      case .wristTemperature:
        measurement = .degreeCelsius()
        unit = "degC"
      case .sleep: return nil
      }
      guard quantity.quantity.is(compatibleWith: measurement) else { return nil }
      value = quantity.quantity.doubleValue(for: measurement)
      if type == .oxygenSaturation || type == .bodyFat { value = value.map { $0 * 100 } }
      guard value?.isFinite == true else { return nil }
    }
    return HealthLocalSample(
      uuid: sample.uuid.uuidString, type: type, start: sample.startDate, end: sample.endDate,
      value: value, unit: unit, categoryValue: (sample as? HKCategorySample)?.value, source: source,
      timeZone: sample.metadata?[HKMetadataKeyTimeZone] as? String,
      wasUserEntered: sample.metadata?[HKMetadataKeyWasUserEntered] as? Bool
    )
  }

  private func describe(_ snapshot: HealthSnapshot?) throws -> JSObject {
    let supported = HealthReadingType.allCases.filter { sampleType($0) != nil }.map(\.rawValue)
    var result: JSObject = [
      "available": HKHealthStore.isHealthDataAvailable(), "supportedTypes": supported,
      "sampleCount": snapshot?.samples.count ?? 0, "reading": reading,
      "hasMore": snapshot.map { $0.completeTypes.count < $0.selection.types.count } ?? false,
      "metrics": [], "sleep": [], "sources": [], "summaryExportAvailable": true,
      "summaryCount": 0,
    ]
    guard let snapshot = snapshot else { return result }
    let preview = HealthPreviewBuilder.build(snapshot)
    result["summaryCount"] = HealthPreviewBuilder.importableMetrics(preview.metrics).count
    result["metrics"] = preview.metrics.prefix(90).map { metric -> JSObject in
      [
        "type": metric.type, "date": metric.date, "value": metric.value, "unit": metric.unit,
        "sampleCount": metric.sampleCount, "sourceID": metric.sourceID,
      ]
    }
    result["sleep"] = preview.sleep.prefix(30).map { night -> JSObject in
      [
        "date": night.date, "core": night.core, "deep": night.deep, "rem": night.rem,
        "unspecified": night.unspecified, "awake": night.awake,
      ]
    }
    let grouped = Dictionary(grouping: Array(snapshot.samples.values)) {
      "\($0.type.rawValue):\($0.source.id)"
    }
    result["sources"] = grouped.values.map { samples -> JSObject in
      let sample = samples[0]
      return [
        "type": sample.type.rawValue, "id": sample.source.id, "name": sample.source.name,
        "count": samples.count,
        "selected": snapshot.selectedSource(for: sample.type) == sample.source.id,
      ]
    }.sorted { String(describing: $0["name"]) < String(describing: $1["name"]) }
    result["selection"] =
      [
        "types": snapshot.selection.types.map(\.rawValue),
        "historyDays": snapshot.selection.historyDays,
        "timeZone": snapshot.selection.timeZone,
      ] as JSObject
    result["lastRead"] = snapshot.lastRead.map { ISO8601DateFormatter().string(from: $0) }
    return result
  }
}

class OpenAthleteBridgeViewController: CAPBridgeViewController {
  override func capacitorDidLoad() {
    bridge?.registerPluginInstance(OpenAthleteHealthKitPlugin())
    bridge?.registerPluginInstance(OpenAthleteZwiftPlugin())
  }
}

/// Foundation JSON containers do not conform recursively to Capacitor's JSValue.
/// Use Capacitor's converter rather than a conditional dictionary cast.
enum HealthKitBridgeJSON {
  static func object(_ data: Data) throws -> JSObject {
    guard let dictionary = try JSONSerialization.jsonObject(with: data) as? NSDictionary,
      let object = JSTypes.coerceDictionaryToJSObject(dictionary)
    else { throw HealthLocalError.invalidSelection }
    return object
  }
}
