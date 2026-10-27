import Foundation

enum HealthReadingType: String, Codable, CaseIterable {
  case hrv = "heartRateVariabilitySDNN"
  case restingHeartRate
  case sleep = "sleepAnalysis"
  case respiratoryRate
  case oxygenSaturation
  case wristTemperature = "appleSleepingWristTemperature"
  case weight = "bodyMass"
  case bodyFat = "bodyFatPercentage"
}

enum HealthLocalError: Error {
  case invalidContext, invalidSelection, storageLimit, wrongContext, busy
}

struct HealthBinding: Codable, Equatable {
  let apiBaseURL: String
  let accountID: String

  init(apiBaseURL: String, accountID: String) throws {
    guard var url = URLComponents(string: apiBaseURL), url.scheme?.lowercased() == "https",
      let host = url.host, !host.isEmpty, url.user == nil, url.password == nil,
      url.query == nil, url.fragment == nil, !accountID.isEmpty, accountID.count <= 200
    else { throw HealthLocalError.invalidContext }
    url.scheme = "https"
    url.host = host.lowercased()
    if url.port == 443 { url.port = nil }
    while url.path.hasSuffix("/") { url.path.removeLast() }
    guard let normalized = url.url?.absoluteString else { throw HealthLocalError.invalidContext }
    self.apiBaseURL = normalized
    self.accountID = accountID
  }
}

struct HealthSelection: Codable, Equatable {
  let types: [HealthReadingType]
  let historyDays: Int
  let timeZone: String

  init(types: [HealthReadingType], historyDays: Int, timeZone: String) throws {
    guard !types.isEmpty, Set(types).count == types.count,
      [7, 30, 90, 365].contains(historyDays), TimeZone(identifier: timeZone) != nil
    else { throw HealthLocalError.invalidSelection }
    self.types = types.sorted { $0.rawValue < $1.rawValue }
    self.historyDays = historyDays
    self.timeZone = timeZone
  }
}

struct HealthSampleSource: Codable, Equatable {
  let bundleIdentifier: String
  let name: String
  let version: String?
  let productType: String?
  let deviceModel: String?
  let operatingSystemVersion: String?
  var id: String { "\(bundleIdentifier)|\(productType ?? "")" }
  var isWatch: Bool { productType?.hasPrefix("Watch") == true }
}

struct HealthLocalSample: Codable, Equatable {
  let uuid: String
  let type: HealthReadingType
  let start: Date
  let end: Date
  let value: Double?
  let unit: String?
  // HealthKit's original category value is retained, including future values.
  let categoryValue: Int?
  let source: HealthSampleSource
  let timeZone: String?
  let wasUserEntered: Bool?
}

struct HealthDailyPreview: Codable, Equatable {
  let type: String
  let date: String
  let value: Double
  let unit: String
  let sampleCount: Int
  let sourceID: String
}

struct HealthSleepPreview: Codable, Equatable {
  let date: String
  let core: Double
  let deep: Double
  let rem: Double
  let unspecified: Double
  let awake: Double
  let hasConflicts: Bool
}

struct HealthSnapshot: Codable {
  var binding: HealthBinding
  var selection: HealthSelection
  // Fixed when the user first chooses the scope. Never advance a rolling predicate with an old anchor.
  var historyStart: Date
  var samples: [String: HealthLocalSample] = [:]
  var anchors: [String: Data] = [:]
  var preferredSources: [String: String] = [:]
  var completeTypes: Set<String> = []
  var lastRead: Date?

  mutating func apply(
    type: HealthReadingType, additions: [HealthLocalSample], deletions: [String],
    anchor: Data, complete: Bool
  ) throws {
    var next = samples
    for sample in additions {
      guard sample.type == type, sample.end >= sample.start,
        sample.value?.isFinite != false
      else { throw HealthLocalError.invalidSelection }
      next[sample.uuid] = sample
    }
    for uuid in deletions where next[uuid]?.type == type { next.removeValue(forKey: uuid) }
    guard next.count <= 100_000 else { throw HealthLocalError.storageLimit }
    samples = next
    anchors[type.rawValue] = anchor
    if complete { completeTypes.insert(type.rawValue) } else { completeTypes.remove(type.rawValue) }
    lastRead = Date()
  }

  func selectedSource(for type: HealthReadingType) -> String? {
    let sources = samples.values.filter { $0.type == type }.map(\.source)
    if let chosen = preferredSources[type.rawValue], sources.contains(where: { $0.id == chosen }) {
      return chosen
    }
    return sources.sorted {
      if $0.isWatch != $1.isWatch { return $0.isWatch }
      return $0.id < $1.id
    }.first?.id
  }
}
