import CoreLocation
import Foundation
import HealthKit

/// Reads existing recordings only; never starts a workout or requests Health writes.
enum HealthKitWorkoutReader {
  struct Page {
    let workouts: [HKWorkout]
    let deleted: [String]
    let anchor: Data
    let complete: Bool
  }

  static func permissions(_ selection: HealthWorkoutSelection) -> Set<HKObjectType> {
    var result: Set<HKObjectType> = [HKObjectType.workoutType()]
    if selection.includeSensors {
      for (type, _, _) in sensors() { result.insert(type) }
    }
    if selection.includeRoute { result.insert(HKSeriesType.workoutRoute()) }
    return result
  }

  static func authorize(_ health: HKHealthStore, selection: HealthWorkoutSelection) async throws {
    try await withCheckedThrowingContinuation { (c: CheckedContinuation<Void, Error>) in
      health.requestAuthorization(toShare: [], read: permissions(selection)) { ok, error in
        if let error {
          c.resume(throwing: error)
        } else if !ok {
          c.resume(throwing: HealthLocalError.invalidSelection)
        } else {
          c.resume()
        }
      }
    }
  }

  static func page(_ health: HKHealthStore, anchor: Data?, since: Date) async throws -> Page {
    let decoded = try anchor.flatMap {
      try NSKeyedUnarchiver.unarchivedObject(ofClass: HKQueryAnchor.self, from: $0)
    }
    return try await withCheckedThrowingContinuation { c in
      health.execute(
        HKAnchoredObjectQuery(
          type: HKObjectType.workoutType(),
          predicate: HKQuery.predicateForSamples(
            withStart: since, end: nil, options: [.strictStartDate]),
          anchor: decoded, limit: 25
        ) { _, samples, deleted, next, error in
          if let error {
            c.resume(throwing: error)
            return
          }
          guard let next else {
            c.resume(throwing: HealthLocalError.invalidSelection)
            return
          }
          do {
            c.resume(
              returning: Page(
                workouts: (samples ?? []).compactMap { $0 as? HKWorkout },
                deleted: (deleted ?? []).map { $0.uuid.uuidString.lowercased() },
                anchor: try NSKeyedArchiver.archivedData(
                  withRootObject: next, requiringSecureCoding: true),
                complete: (samples ?? []).count + (deleted ?? []).count < 25))
          } catch { c.resume(throwing: error) }
        })
    }
  }

  static func samples(
    _ health: HKHealthStore, type: HKSampleType, predicate: NSPredicate, limit: Int = 50_001
  ) async throws -> [HKSample] {
    try await withCheckedThrowingContinuation { c in
      health.execute(
        HKSampleQuery(
          sampleType: type, predicate: predicate, limit: limit,
          sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)]
        ) { _, samples, error in
          if let error { c.resume(throwing: error) } else { c.resume(returning: samples ?? []) }
        })
    }
  }

  static func source(_ sample: HKSample) -> HealthSampleSource {
    let r = sample.sourceRevision
    let os = r.operatingSystemVersion
    return HealthSampleSource(
      bundleIdentifier: r.source.bundleIdentifier, name: r.source.name,
      version: r.version, productType: r.productType, deviceModel: sample.device?.model,
      operatingSystemVersion: "\(os.majorVersion).\(os.minorVersion).\(os.patchVersion)")
  }

  static func sensors() -> [(HKQuantityType, String, HKUnit)] {
    var result: [(HKQuantityType, String, HKUnit)] = [
      (
        HKQuantityType.quantityType(forIdentifier: .heartRate)!, "heartrate",
        .count().unitDivided(by: .minute())
      )
    ]
    if #available(iOS 16, *) {
      result.append((HKQuantityType.quantityType(forIdentifier: .runningPower)!, "watts", .watt()))
    }
    if #available(iOS 17, *) {
      result.append((HKQuantityType.quantityType(forIdentifier: .cyclingPower)!, "watts", .watt()))
      result.append(
        (
          HKQuantityType.quantityType(forIdentifier: .cyclingCadence)!, "cadence",
          .count().unitDivided(by: .minute())
        ))
    }
    return result
  }

  static func read(_ health: HKHealthStore, workout: HKWorkout, selection: HealthWorkoutSelection)
    async throws -> HealthWorkoutRecord?
  {
    let origin = source(workout)
    // Phone/Strava copies are not original Watch recordings. Multisport parents
    // need a separate leg identity contract and must not become a second activity.
    guard origin.isWatch,
      workout.metadata?[HKMetadataKeyWasUserEntered] as? Bool != true
    else { return nil }
    if #available(iOS 16, *), workout.workoutActivityType == .swimBikeRun { return nil }
    let predicate = HKQuery.predicateForObjects(from: workout)
    var channels: [String: [HealthWorkoutPoint]] = [:]
    if selection.includeSensors {
      for (type, key, unit) in sensors() {
        let rows = try await samples(health, type: type, predicate: predicate)
        guard rows.count <= 50_000 else { throw HealthLocalError.storageLimit }
        channels[key, default: []] += rows.compactMap { row in
          guard let q = row as? HKQuantitySample, q.quantity.is(compatibleWith: unit) else {
            return nil
          }
          let value = q.quantity.doubleValue(for: unit)
          guard value.isFinite && value >= 0 else { return nil }
          return HealthWorkoutPoint(
            uuid: q.uuid.uuidString.lowercased(), start: q.startDate, end: q.endDate,
            value: value, source: source(q))
        }
      }
    }
    var route: [HealthWorkoutLocation] = []
    if selection.includeRoute {
      let routes = try await samples(
        health, type: HKSeriesType.workoutRoute(), predicate: predicate, limit: 101)
      guard routes.count <= 100 else { throw HealthLocalError.storageLimit }
      for case let series as HKWorkoutRoute in routes {
        let points = try await locations(health, series)
        guard route.count + points.count <= 50_000 else { throw HealthLocalError.storageLimit }
        route += points
      }
    }
    let result = HealthWorkoutRecord(
      uuid: workout.uuid.uuidString.lowercased(),
      activityType: Int(workout.workoutActivityType.rawValue),
      sport: sport(workout.workoutActivityType),
      start: workout.startDate, end: workout.endDate, activeDuration: workout.duration,
      distanceMeters: workout.totalDistance?.doubleValue(for: .meter()),
      energyKilojoules: workout.totalEnergyBurned?.doubleValue(for: .jouleUnit(with: .kilo)),
      elevationGainMeters: (workout.metadata?[HKMetadataKeyElevationAscended] as? HKQuantity)?
        .doubleValue(for: .meter()),
      source: origin, timeZone: workout.metadata?[HKMetadataKeyTimeZone] as? String,
      externalUUID: workout.metadata?[HKMetadataKeyExternalUUID] as? String,
      wasUserEntered: workout.metadata?[HKMetadataKeyWasUserEntered] as? Bool,
      indoor: workout.metadata?[HKMetadataKeyIndoorWorkout] as? Bool,
      events: (workout.workoutEvents ?? []).map {
        HealthWorkoutEvent(
          type: $0.type.rawValue,
          start: $0.dateInterval.start, end: $0.dateInterval.end)
      },
      channels: channels.mapValues {
        $0.sorted { $0.start == $1.start ? $0.uuid < $1.uuid : $0.start < $1.start }
      },
      route: route.sorted { $0.date < $1.date })
    try result.validate()
    return result
  }

  private static func locations(_ health: HKHealthStore, _ route: HKWorkoutRoute) async throws
    -> [HealthWorkoutLocation]
  {
    try await withCheckedThrowingContinuation { c in
      let accumulator = RouteAccumulator(c)
      let query = HKWorkoutRouteQuery(route: route) { query, locations, done, error in
        accumulator.receive(locations ?? [], done: done, error: error, stop: { health.stop(query) })
      }
      health.execute(query)
    }
  }

  private static func sport(_ type: HKWorkoutActivityType) -> String {
    switch type {
    case .running: return "RUNNING"
    case .walking: return "WALK"
    case .cycling: return "CYCLING"
    case .swimming: return "SWIMMING"
    case .hiking: return "HIKING"
    case .traditionalStrengthTraining, .functionalStrengthTraining: return "STRENGTH"
    case .rowing: return "ROWING"
    case .yoga: return "YOGA"
    case .pilates: return "PILATES"
    case .highIntensityIntervalTraining: return "HIGH_INTENSITY_INTERVAL_TRAINING"
    case .elliptical: return "ELLIPTICAL"
    case .stairClimbing: return "STAIR_STEPPER"
    case .downhillSkiing: return "ALPINE_SKI"
    case .crossCountrySkiing: return "NORDIC_SKI"
    case .snowboarding: return "SNOWBOARD"
    case .tennis: return "TENNIS"
    case .golf: return "GOLF"
    case .soccer: return "SOCCER"
    case .climbing: return "ROCK_CLIMBING"
    default: return "OTHER"
    }
  }
}

private final class RouteAccumulator: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<[HealthWorkoutLocation], Error>?
  private var points: [HealthWorkoutLocation] = []
  init(_ continuation: CheckedContinuation<[HealthWorkoutLocation], Error>) {
    self.continuation = continuation
  }
  func receive(_ rows: [CLLocation], done: Bool, error: Error?, stop: () -> Void) {
    lock.lock()
    guard let c = continuation else {
      lock.unlock()
      return
    }
    let valid = rows.filter {
      $0.horizontalAccuracy >= 0 && CLLocationCoordinate2DIsValid($0.coordinate)
    }
    points += valid.map {
      HealthWorkoutLocation(
        date: $0.timestamp, latitude: $0.coordinate.latitude,
        longitude: $0.coordinate.longitude, altitude: $0.verticalAccuracy >= 0 ? $0.altitude : nil,
        horizontalAccuracy: $0.horizontalAccuracy,
        verticalAccuracy: $0.verticalAccuracy >= 0 ? $0.verticalAccuracy : nil)
    }
    let failure = error ?? (points.count > 50_000 ? HealthLocalError.storageLimit : nil)
    if failure != nil || done { continuation = nil }
    let result = points
    lock.unlock()
    if let failure {
      c.resume(throwing: failure)
      stop()
    } else if done {
      c.resume(returning: result)
    }
  }
}
