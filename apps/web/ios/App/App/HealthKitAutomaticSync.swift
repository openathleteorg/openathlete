import Capacitor
import CryptoKit
import Foundation
import HealthKit
import Network
import Security
import UIKit

private struct HealthSyncCredentials: Codable {
  let binding: HealthBinding
  let accessToken: String
  let refreshToken: String?
}

enum HealthSyncKeychain {
  private static var query: [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: "org.openathlete.healthkit.sync",
      kSecAttrAccount as String: "session",
    ]
  }
  static func clear() throws {
    let code = SecItemDelete(query as CFDictionary)
    guard code == errSecSuccess || code == errSecItemNotFound else {
      throw HealthLocalError.invalidContext
    }
  }
  fileprivate static func save(_ credentials: HealthSyncCredentials) throws {
    let data = try JSONEncoder().encode(credentials)
    let code = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
    if code == errSecItemNotFound {
      var item = query
      item[kSecValueData as String] = data
      item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
      guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else {
        throw HealthLocalError.invalidContext
      }
    } else if code != errSecSuccess {
      throw HealthLocalError.invalidContext
    }
  }
  fileprivate static func load() throws -> HealthSyncCredentials? {
    var item = query
    item[kSecReturnData as String] = true
    item[kSecMatchLimit as String] = kSecMatchLimitOne
    var value: CFTypeRef?
    let code = SecItemCopyMatching(item as CFDictionary, &value)
    if code == errSecItemNotFound { return nil }
    guard code == errSecSuccess, let data = value as? Data else {
      throw HealthLocalError.invalidContext
    }
    return try JSONDecoder().decode(HealthSyncCredentials.self, from: data)
  }
}

private final class HealthSyncNoRedirect: NSObject, URLSessionTaskDelegate {
  func urlSession(
    _ session: URLSession, task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void
  ) { completionHandler(nil) }
}

/// Queries are installed synchronously at every launch, before pending HealthKit
/// notifications arrive. Only explicitly enabled types receive background delivery.
final class HealthKitWakeObserver {
  static let shared = HealthKitWakeObserver()
  private let health = HKHealthStore()
  private var queries: [HKQuery] = []
  private var observers: [NSObjectProtocol] = []
  private var task: Task<Void, Never>?
  private var retryTimer: Timer?
  private var needsAnotherAttempt = false
  private var waitingCompletions: [() -> Void] = []
  private let network = NWPathMonitor()
  func start() {
    guard queries.isEmpty, HKHealthStore.isHealthDataAvailable() else { return }
    var types: [HKSampleType] = [.workoutType(), HKSeriesType.workoutRoute()]
    for identifier: HKQuantityTypeIdentifier in [
      .heartRateVariabilitySDNN, .restingHeartRate,
      .respiratoryRate, .oxygenSaturation, .bodyMass, .bodyFatPercentage,
    ] {
      if let type = HKQuantityType.quantityType(forIdentifier: identifier) { types.append(type) }
    }
    types.append(HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!)
    if #available(iOS 16, *) {
      types.append(HKQuantityType.quantityType(forIdentifier: .appleSleepingWristTemperature)!)
    }
    types += HealthKitWorkoutReader.sensors().map { $0.0 }
    for type in Set(types) {
      let query = HKObserverQuery(sampleType: type, predicate: nil) { _, completion, _ in
        DispatchQueue.main.async {
          let defaults = UserDefaults.standard
          defaults.set(
            defaults.integer(forKey: "openathlete.healthkit.changeCounter") + 1,
            forKey: "openathlete.healthkit.changeCounter")
          defaults.set(true, forKey: "openathlete.healthkit.pendingSync")
          self.schedule(completion: completion)
        }
      }
      queries.append(query)
      health.execute(query)
    }
    for name in [
      UIApplication.protectedDataDidBecomeAvailableNotification,
      UIApplication.didBecomeActiveNotification, UIScene.didActivateNotification,
    ] {
      observers.append(
        NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main) { _ in
          self.schedule()
        })
    }
    network.pathUpdateHandler = { path in
      if path.status == .satisfied { DispatchQueue.main.async { self.schedule() } }
    }
    network.start(queue: DispatchQueue(label: "org.openathlete.healthkit.network"))
    schedule()
  }
  func retry(at date: Date) {
    retryTimer?.invalidate()
    retryTimer = Timer.scheduledTimer(
      withTimeInterval: max(2, date.timeIntervalSinceNow), repeats: false
    ) { _ in self.schedule() }
  }
  func schedule(completion: (() -> Void)? = nil) {
    if let completion { waitingCompletions.append(completion) }
    guard task == nil else {
      needsAnotherAttempt = true
      return
    }
    let completions = waitingCompletions
    waitingCompletions.removeAll()
    var identifier: UIBackgroundTaskIdentifier = .invalid
    identifier = UIApplication.shared.beginBackgroundTask(withName: "Apple Health sync") {
      self.task?.cancel()
    }
    task = Task { @MainActor in
      await HealthKitLocalService.shared.automaticSync()
      // Acknowledge only after the bounded attempt has persisted its cursors,
      // receipts or retry state. Later deliveries belong to the next attempt.
      completions.forEach { $0() }
      self.task = nil
      if identifier != .invalid { UIApplication.shared.endBackgroundTask(identifier) }
      if self.needsAnotherAttempt {
        self.needsAnotherAttempt = false
        self.retry(at: Date().addingTimeInterval(2))
      }
    }
  }
  static func disableDelivery() { HKHealthStore().disableAllBackgroundDelivery { _, _ in } }
}

extension HealthKitLocalService {
  func loadSyncConfiguration() throws -> HealthSyncConfiguration? {
    if UserDefaults.standard.bool(forKey: "openathlete.healthkit.pendingLocalCleanup") {
      return nil
    }
    if let syncConfiguration { return syncConfiguration }
    guard FileManager.default.fileExists(atPath: automationURL.path) else { return nil }
    var saved: HealthSyncConfiguration = try HealthProtectedFile.load(automationURL)
    if let selection = saved.measurements {
      saved.measurements = try HealthSelection(
        types: selection.types, historyDays: selection.historyDays, timeZone: selection.timeZone)
    }
    if let selection = saved.workouts {
      saved.workouts = try HealthWorkoutSelection(
        historyDays: selection.historyDays, includeSensors: selection.includeSensors,
        includeRoute: selection.includeRoute)
    }
    saved.measurementConsent.normalize()
    saved.workoutConsent.normalize()
    _ = try HealthBinding(apiBaseURL: saved.binding.apiBaseURL, accountID: saved.binding.accountID)
    syncConfiguration = saved
    return saved
  }
  func saveSyncConfiguration(_ value: HealthSyncConfiguration) throws {
    try HealthProtectedFile.save(value, directory: store.directory, file: automationURL)
    syncConfiguration = value
  }
  func updateCredentials(binding: HealthBinding, accessToken: String?, refreshToken: String?) throws
  {
    guard activeBinding == binding else { throw HealthLocalError.wrongContext }
    guard let accessToken else {
      syncTaskGeneration += 1
      networkTask?.cancel()
      try HealthSyncKeychain.clear()
      return
    }
    guard Self.tokenAccount(accessToken) == binding.accountID,
      refreshToken == nil || Self.tokenAccount(refreshToken!) == binding.accountID
    else { throw HealthLocalError.wrongContext }
    try HealthSyncKeychain.save(
      HealthSyncCredentials(binding: binding, accessToken: accessToken, refreshToken: refreshToken))
    DispatchQueue.main.async { HealthKitWakeObserver.shared.schedule() }
  }
  private static func tokenPayload(_ token: String) -> [String: Any]? {
    let parts = token.split(separator: ".")
    guard parts.count == 3 else { return nil }
    var value = String(parts[1]).replacingOccurrences(of: "-", with: "+").replacingOccurrences(
      of: "_", with: "/")
    value += String(repeating: "=", count: (4 - value.count % 4) % 4)
    guard let data = Data(base64Encoded: value) else { return nil }
    return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
  }
  private static func tokenAccount(_ token: String) -> String? {
    guard let id = tokenPayload(token)?["userId"] as? NSNumber else { return nil }
    return id.stringValue
  }
  private static func tokenCurrent(_ token: String) -> Bool {
    (tokenPayload(token)?["exp"] as? Double ?? 0) > Date().timeIntervalSince1970 + 60
  }

  func syncSettings(
    binding: HealthBinding, kind: String, selection: JSObject,
    read: Bool?, upload: Bool?, automatic: Bool?
  ) throws -> JSObject {
    guard activeBinding == binding, ["measurements", "workouts"].contains(kind) else {
      throw HealthLocalError.wrongContext
    }
    var config = try loadSyncConfiguration() ?? HealthSyncConfiguration(binding: binding)
    guard config.binding == binding else { throw HealthLocalError.wrongContext }
    if UserDefaults.standard.bool(forKey: "openathlete.healthkit.syncSuspended") {
      config.measurementConsent = HealthSyncConsent()
      config.workoutConsent = HealthSyncConsent()
    }
    let data = try JSONSerialization.data(withJSONObject: selection)
    var consent: HealthSyncConsent
    var scopeChanged = false
    if kind == "measurements" {
      let raw = try JSONDecoder().decode(HealthSelection.self, from: data)
      let scope = try HealthSelection(
        types: raw.types, historyDays: raw.historyDays, timeZone: raw.timeZone)
      scopeChanged = config.measurements != scope
      config.measurements = scope
      consent = scopeChanged ? HealthSyncConsent() : config.measurementConsent
    } else {
      let raw = try JSONDecoder().decode(HealthWorkoutSelection.self, from: data)
      let scope = try HealthWorkoutSelection(
        historyDays: raw.historyDays, includeSensors: raw.includeSensors,
        includeRoute: raw.includeRoute)
      scopeChanged = config.workouts != scope
      config.workouts = scope
      consent = scopeChanged ? HealthSyncConsent() : config.workoutConsent
    }
    if let read { consent.read = read }
    if let upload { consent.upload = upload }
    if let automatic { consent.automatic = automatic }
    consent.normalize()
    let previous = kind == "measurements" ? config.measurementConsent : config.workoutConsent
    if scopeChanged || previous != consent {
      UserDefaults.standard.set(true, forKey: "openathlete.healthkit.syncSuspended")
      generation += 1
      syncTaskGeneration += 1
      networkTask?.cancel()
      config.retryAfter = nil
      config.failure = nil
      config.failures = 0
    }
    if kind == "measurements" {
      config.measurementConsent = consent
    } else {
      config.workoutConsent = consent
    }
    if scopeChanged || previous != consent {
      try saveSyncConfiguration(config)
      UserDefaults.standard.set(false, forKey: "openathlete.healthkit.syncSuspended")
      Task { await self.configureDelivery() }
    }
    if consent.automatic && (scopeChanged || previous != consent) {
      DispatchQueue.main.async { HealthKitWakeObserver.shared.schedule() }
    }
    var result: JSObject = [
      "read": consent.read, "upload": consent.upload, "automatic": consent.automatic,
    ]
    result["lastSuccess"] = config.lastSuccess.map(HealthWorkoutUpload.instant)
    result["failure"] = config.failure
    return result
  }

  func configureDelivery() async {
    guard !configuringDelivery, deliveryGeneration != syncTaskGeneration else { return }
    configuringDelivery = true
    defer { configuringDelivery = false }
    while deliveryGeneration != syncTaskGeneration {
      guard let config = try? loadSyncConfiguration() else { return }
      let version = syncTaskGeneration
      var types = Set<HKObjectType>()
      if config.measurementConsent.automatic, let scope = config.measurements {
        types.formUnion(scope.types.compactMap { sampleType($0) })
      }
      if config.workoutConsent.automatic, let scope = config.workouts {
        types.formUnion(HealthKitWorkoutReader.permissions(scope))
      }
      await withCheckedContinuation { c in
        health.disableAllBackgroundDelivery { _, _ in c.resume() }
      }
      guard version == syncTaskGeneration else { continue }
      for type in types {
        guard version == syncTaskGeneration else { break }
        await withCheckedContinuation { c in
          health.enableBackgroundDelivery(for: type, frequency: .hourly) { _, _ in c.resume() }
        }
      }
      if version == syncTaskGeneration { deliveryGeneration = version }
    }
  }

  private func checkSync(_ binding: HealthBinding, _ version: Int) throws {
    try Task.checkCancellation()
    guard activeBinding == binding, syncTaskGeneration == version,
      !UserDefaults.standard.bool(forKey: "openathlete.healthkit.syncSuspended"),
      !UserDefaults.standard.bool(forKey: "openathlete.healthkit.pendingLocalCleanup")
    else { throw HealthLocalError.wrongContext }
  }
  private func request(
    _ binding: HealthBinding, path: String, body: Data?, token: String?, version: Int
  ) async throws -> [String: Any] {
    try checkSync(binding, version)
    guard let url = URL(string: binding.apiBaseURL + path) else {
      throw HealthLocalError.invalidContext
    }
    var request = URLRequest(url: url)
    request.httpMethod = body == nil ? "GET" : "POST"
    request.httpBody = body
    request.timeoutInterval = 10
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    if let token { request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization") }
    let configuration = URLSessionConfiguration.ephemeral
    configuration.httpShouldSetCookies = false
    configuration.urlCache = nil
    let delegate = HealthSyncNoRedirect()
    let session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
    defer {
      session.invalidateAndCancel()
      networkTask = nil
    }
    let response: (Data, URLResponse) = try await withCheckedThrowingContinuation { c in
      let task = session.dataTask(with: request) { data, response, error in
        if let error {
          c.resume(throwing: error)
        } else if let data, let response {
          c.resume(returning: (data, response))
        } else {
          c.resume(throwing: HealthLocalError.invalidContext)
        }
      }
      networkTask = task
      task.resume()
    }
    try checkSync(binding, version)
    guard let http = response.1 as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
      throw HealthLocalError.invalidContext
    }
    guard response.0.count <= 2 * 1024 * 1024,
      let object = try JSONSerialization.jsonObject(with: response.0) as? [String: Any]
    else { throw HealthLocalError.invalidContext }
    return object
  }
  private func credentials(_ binding: HealthBinding, version: Int) async throws -> String {
    guard var saved = try HealthSyncKeychain.load(), saved.binding == binding else {
      throw HealthLocalError.wrongContext
    }
    if !Self.tokenCurrent(saved.accessToken) {
      guard let refresh = saved.refreshToken, Self.tokenCurrent(refresh) else {
        throw HealthLocalError.invalidContext
      }
      let body = try JSONSerialization.data(withJSONObject: ["refreshToken": refresh])
      let result = try await request(
        binding, path: "/auth/refresh-token", body: body, token: nil, version: version)
      guard let access = result["accessToken"] as? String,
        let newRefresh = result["refreshToken"] as? String,
        Self.tokenAccount(access) == binding.accountID, Self.tokenCurrent(access),
        Self.tokenAccount(newRefresh) == binding.accountID, Self.tokenCurrent(newRefresh)
      else { throw HealthLocalError.wrongContext }
      saved = HealthSyncCredentials(binding: binding, accessToken: access, refreshToken: newRefresh)
      try checkSync(binding, version)
      try HealthSyncKeychain.save(saved)
    }
    return saved.accessToken
  }

  func automaticSync() async {
    guard !UserDefaults.standard.bool(forKey: "openathlete.healthkit.syncSuspended"),
      !automating, !reading, manualSyncLease == nil, var config = try? loadSyncConfiguration(),
      config.measurementConsent.automatic || config.workoutConsent.automatic
    else { return }
    if let retry = HealthAutomaticSyncPolicy.nextAttempt(
      lastAttempt: config.lastAttempt, retryAfter: config.retryAfter), retry > Date() {
      DispatchQueue.main.async { HealthKitWakeObserver.shared.retry(at: retry) }
      return
    }
    if activeBinding == nil { activeBinding = config.binding }
    guard activeBinding == config.binding else { return }
    let binding = config.binding
    let version = syncTaskGeneration
    // Reserve the budget durably before token refresh, network I/O or Health reads.
    // Repeated observer/resume/token events and app restarts cannot bypass it.
    let attemptedAt = Date()
    config.lastAttempt = attemptedAt
    do { try saveSyncConfiguration(config) } catch { return }
    automating = true
    defer { automating = false }
    let deadline = Date().addingTimeInterval(20)
    let changeCounter = UserDefaults.standard.integer(forKey: "openathlete.healthkit.changeCounter")
    UserDefaults.standard.set(true, forKey: "openathlete.healthkit.pendingSync")
    do {
      await configureDelivery()
      try checkSync(binding, version)
      let token = try await credentials(binding, version: version)
      var featureFailure: Error?
      do {
        if config.measurementConsent.automatic, let selection = config.measurements {
          for _ in 0..<3 {
            _ = try await read(binding: binding, selection: selection, automatic: true)
            try checkSync(binding, version)
            if try load(binding: binding)?.completeTypes.count == selection.types.count { break }
            if Date() >= deadline { throw CancellationError() }
          }
          if let snapshot = try load(binding: binding),
            snapshot.completeTypes.count == selection.types.count
          {
            let metrics = HealthPreviewBuilder.importableMetrics(
              HealthPreviewBuilder.build(snapshot).metrics)
            var pending: [[String: Any]] = []
            var receipt: [String: String] = [:]
            for metric in metrics {
              let key = metric.type + ":" + metric.date
              let row: [String: Any] = [
                "type": metric.type, "date": metric.date, "value": metric.value,
                "unit": metric.unit,
                "sampleCount": metric.sampleCount,
              ]
              let data = try JSONSerialization.data(withJSONObject: row, options: [.sortedKeys])
              let hash = SHA256.hash(data: data + Data(selection.timeZone.utf8)).map {
                String(format: "%02x", $0)
              }.joined()
              if config.metricReceipts[key] != hash {
                pending.append(row)
                receipt[key] = hash
              }
            }
            for offset in stride(from: 0, to: pending.count, by: 500) {
              if Date() >= deadline { throw CancellationError() }
              let rows = Array(pending[offset..<min(offset + 500, pending.count)])
              let body = try JSONSerialization.data(withJSONObject: [
                "source": "APPLE_HEALTH", "timeZone": selection.timeZone, "metrics": rows,
              ])
              let result = try await request(
                binding, path: "/metric/import", body: body, token: token, version: version)
              guard let imported = result["imported"] as? Int,
                let skipped = result["skipped"] as? Int,
                imported >= 0, skipped >= 0, imported + skipped == rows.count
              else { throw HealthLocalError.invalidContext }
              for row in rows {
                let key = (row["type"] as! String) + ":" + (row["date"] as! String)
                config.metricReceipts[key] = receipt[key]
              }
              try saveSyncConfiguration(config)
            }
          } else {
            throw CancellationError()
          }
        }
      } catch {
        try checkSync(binding, version)
        featureFailure = error
      }
      do {
        if config.workoutConsent.automatic, let selection = config.workouts {
          if Date() >= deadline { throw CancellationError() }
          let info = try await request(
            binding, path: "/instance", body: nil, token: nil, version: version)
          guard let capability = info["healthkitWorkoutImport"] as? [String: Any],
            capability["protocolVersion"] as? Int == 1,
            let maxBytes = capability["maxBodyBytes"] as? Int,
            let maxSamples = capability["maxSamples"] as? Int
          else { throw HealthLocalError.invalidContext }
          for _ in 0..<4 {
            if Date() >= deadline { throw CancellationError() }
            _ = try await readWorkouts(binding: binding, selection: selection, automatic: true)
            try checkSync(binding, version)
            if try workoutStore.load(binding: binding)?.hasMore == false { break }
          }
          guard let snapshot = try workoutStore.load(binding: binding), !snapshot.hasMore else {
            throw CancellationError()
          }
          for workout in snapshot.workouts.values.sorted(by: { $0.start < $1.start })
          where config.workoutReceipts[workout.uuid] != workout.revision {
            if Date() >= deadline { throw CancellationError() }
            let body = try HealthWorkoutUpload.body(workout)
            let object = try JSONSerialization.jsonObject(with: body) as! [String: Any]
            let streams = object["streams"] as? [String: [String: Any]] ?? [:]
            let count = streams.values.reduce(0) { $0 + (($1["samples"] as? [Any])?.count ?? 0) }
            guard body.count <= maxBytes, count <= maxSamples else {
              throw HealthLocalError.storageLimit
            }
            let response = try await request(
              binding, path: "/activity-import/healthkit", body: body, token: token,
              version: version)
            guard let status = response["status"] as? String,
              ["created", "matched", "enriched", "unchanged", "needs_review"].contains(status),
              let revision = response["revision"] as? Int, revision >= workout.revision,
              let receipt = response["receiptId"] as? Int, receipt > 0,
              let processing = response["processing"] as? String,
              ["queued", "not_required"].contains(processing)
            else { throw HealthLocalError.invalidContext }
            config.workoutReceipts[workout.uuid] = workout.revision
            try saveSyncConfiguration(config)
          }
        }
      } catch {
        try checkSync(binding, version)
        featureFailure = featureFailure ?? error
      }
      if let featureFailure { throw featureFailure }
      try checkSync(binding, version)
      config.lastSuccess = Date()
      config.failure = nil
      config.retryAfter = nil
      config.failures = 0
      try saveSyncConfiguration(config)
      let newerData =
        UserDefaults.standard.integer(forKey: "openathlete.healthkit.changeCounter")
        != changeCounter
      UserDefaults.standard.set(newerData, forKey: "openathlete.healthkit.pendingSync")
      if newerData {
        DispatchQueue.main.async {
          HealthKitWakeObserver.shared.retry(at: attemptedAt.addingTimeInterval(HealthAutomaticSyncPolicy.minimumInterval))
        }
      }
    } catch {
      // Leave cursors/receipts intact. Never log credentials, OS errors or samples.
      guard version == syncTaskGeneration else { return }
      if error is CancellationError && !Task.isCancelled {
        // Keep bounded history progress for the next hourly window. Manual Sync
        // now may continue sooner without consuming another automatic attempt.
        config.retryAfter = Date().addingTimeInterval(2)
      } else {
        config.failures = min(config.failures + 1, 8)
        config.retryAfter = Date().addingTimeInterval(
          min(3600, 30 * pow(2, Double(config.failures - 1))))
      }
      config.retryAfter = HealthAutomaticSyncPolicy.nextAttempt(
        lastAttempt: config.lastAttempt, retryAfter: config.retryAfter)
      config.failure = "pending"
      try? saveSyncConfiguration(config)
      if let date = config.retryAfter {
        DispatchQueue.main.async { HealthKitWakeObserver.shared.retry(at: date) }
      }
    }
  }
}
