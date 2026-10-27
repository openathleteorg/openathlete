import Foundation

struct HealthWorkoutSelection: Codable, Equatable {
  let historyDays: Int
  let includeSensors: Bool
  let includeRoute: Bool

  init(historyDays: Int, includeSensors: Bool, includeRoute: Bool) throws {
    guard [7, 30, 90, 365].contains(historyDays) else { throw HealthLocalError.invalidSelection }
    self.historyDays = historyDays
    self.includeSensors = includeSensors
    self.includeRoute = includeRoute
  }
}

struct HealthWorkoutPoint: Codable, Equatable {
  let uuid: String
  let start: Date
  let end: Date
  let value: Double
  let source: HealthSampleSource
}

struct HealthWorkoutLocation: Codable, Equatable {
  let date: Date
  let latitude: Double
  let longitude: Double
  let altitude: Double?
  let horizontalAccuracy: Double
  let verticalAccuracy: Double?
}

struct HealthWorkoutEvent: Codable, Equatable {
  let type: Int
  let start: Date
  let end: Date
}

struct HealthWorkoutRecord: Codable, Equatable {
  var revision = 0
  let uuid: String
  let activityType: Int
  let sport: String
  let start: Date
  let end: Date
  let activeDuration: Double
  let distanceMeters: Double?
  let energyKilojoules: Double?
  let elevationGainMeters: Double?
  let source: HealthSampleSource
  let timeZone: String?
  let externalUUID: String?
  let wasUserEntered: Bool?
  let indoor: Bool?
  let events: [HealthWorkoutEvent]
  let channels: [String: [HealthWorkoutPoint]]
  let route: [HealthWorkoutLocation]

  func validate() throws {
    guard UUID(uuidString: uuid) != nil, end > start, activeDuration.isFinite,
      activeDuration >= 0, activeDuration <= end.timeIntervalSince(start) + 1,
      [distanceMeters, energyKilojoules, elevationGainMeters].allSatisfy({
        $0 == nil || ($0!.isFinite && $0! >= 0)
      }),
      channels.values.allSatisfy({ $0.count <= 50_000 }), route.count <= 50_000,
      channels.values.flatMap({ $0 }).allSatisfy({
        $0.value.isFinite && $0.value >= 0 && $0.end >= $0.start
      }),
      route.allSatisfy({
        $0.latitude.isFinite && $0.longitude.isFinite && (-90...90).contains($0.latitude)
          && (-180...180).contains($0.longitude) && $0.horizontalAccuracy.isFinite
          && $0.horizontalAccuracy >= 0
      })
    else { throw HealthLocalError.invalidSelection }
  }
}

struct HealthWorkoutSnapshot: Codable {
  let binding: HealthBinding
  let selection: HealthWorkoutSelection
  let historyStart: Date
  var anchor: Data?
  var workouts: [String: HealthWorkoutRecord] = [:]
  var hasMore = true
  var lastRead: Date?

  mutating func apply(
    additions: [HealthWorkoutRecord], deletions: [String], anchor: Data, complete: Bool
  ) throws {
    var next = workouts
    for var workout in additions {
      try workout.validate()
      let previous = next[workout.uuid]
      workout.revision = previous?.revision ?? 0
      if workout != previous {
        // Persist the version with the payload. Wall-clock seconds also permit a
        // fresh cache to enrich a previously imported UUID instead of replaying v1.
        let version = max((previous?.revision ?? 0) + 1, Int(Date().timeIntervalSince1970))
        guard version > 0 && version <= Int(Int32.max) else {
          throw HealthLocalError.invalidSelection
        }
        workout.revision = version
      }
      next[workout.uuid] = workout
    }
    for uuid in deletions { next.removeValue(forKey: uuid) }
    guard next.count <= 2_000 else { throw HealthLocalError.storageLimit }
    workouts = next
    self.anchor = anchor
    hasMore = !complete
    lastRead = Date()
  }
}

final class HealthWorkoutStore {
  let directory: URL
  private var file: URL { directory.appendingPathComponent("workouts.json") }
  init(directory: URL) { self.directory = directory }

  func load(binding: HealthBinding) throws -> HealthWorkoutSnapshot? {
    guard FileManager.default.fileExists(atPath: file.path) else { return nil }
    let snapshot: HealthWorkoutSnapshot = try HealthProtectedFile.load(file)
    _ = try HealthWorkoutSelection(
      historyDays: snapshot.selection.historyDays,
      includeSensors: snapshot.selection.includeSensors,
      includeRoute: snapshot.selection.includeRoute)
    guard snapshot.binding == binding else {
      try clear()
      return nil
    }
    return snapshot
  }

  func save(_ snapshot: HealthWorkoutSnapshot) throws {
    try HealthProtectedFile.save(snapshot, directory: directory, file: file)
  }

  func clear() throws {
    if FileManager.default.fileExists(atPath: file.path) {
      try FileManager.default.removeItem(at: file)
    }
  }
}
