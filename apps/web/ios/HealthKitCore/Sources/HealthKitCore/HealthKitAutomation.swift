import Foundation

struct HealthSyncConsent: Codable, Equatable {
  var read = false
  var upload = false
  var automatic = false
  mutating func normalize() { if !read || !upload { automatic = false } }
}

struct HealthSyncConfiguration: Codable {
  let binding: HealthBinding
  var measurements: HealthSelection?
  var workouts: HealthWorkoutSelection?
  var measurementConsent = HealthSyncConsent()
  var workoutConsent = HealthSyncConsent()
  var lastSuccess: Date?
  var lastAttempt: Date?
  var failure: String?
  var retryAfter: Date?
  var failures = 0
  // Receipts advance only after a successful acknowledgement. Failed requests
  // keep the same persisted recording/revision for the next attempt.
  var workoutReceipts: [String: Int] = [:]
  var metricReceipts: [String: String] = [:]
}

/// Automatic attempts (including failed requests and history continuation) share
/// one persisted hourly budget. Manual sync never consults this policy.
enum HealthAutomaticSyncPolicy {
  static let minimumInterval: TimeInterval = 3600
  static func nextAttempt(lastAttempt: Date?, retryAfter: Date?) -> Date? {
    [lastAttempt?.addingTimeInterval(minimumInterval), retryAfter].compactMap { $0 }.max()
  }
}

/// Pure v1 encoding shared by native foreground/background uploads.
enum HealthWorkoutUpload {
  static func instant(_ date: Date) -> String {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f.string(from: date)
  }
  static func body(_ record: HealthWorkoutRecord) throws -> Data {
    try record.validate()
    let start = record.start
    let end = record.end
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    guard let wireStart = formatter.date(from: instant(start)),
      let wireEnd = formatter.date(from: instant(end))
    else { throw HealthLocalError.invalidSelection }
    let elapsed =
      Double(
        Int64((wireEnd.timeIntervalSince1970 * 1000).rounded())
          - Int64((wireStart.timeIntervalSince1970 * 1000).rounded())) / 1000
    let inside: (Date) -> Bool = { $0 >= start && $0 <= end }
    var streams: [String: Any] = [:]
    for (key, unit) in [("heartrate", "bpm"), ("watts", "W"), ("cadence", "rpm")] {
      let ranked = (record.channels[key] ?? []).sorted {
        let a = $0.source.bundleIdentifier == record.source.bundleIdentifier
        let b = $1.source.bundleIdentifier == record.source.bundleIdentifier
        return a != b ? a : $0.uuid < $1.uuid
      }
      var points: [String: Double] = [:]
      for row in ranked where inside(row.start) {
        let time = instant(row.start)
        if points[time] == nil { points[time] = row.value }
      }
      if !points.isEmpty {
        streams[key] = [
          "unit": unit,
          "samples": points.keys.sorted().map {
            ["timestamp": $0, "value": points[$0]!] as [String: Any]
          },
        ]
      }
    }
    var positions: [String: HealthWorkoutLocation] = [:]
    for row in record.route where inside(row.date) {
      let time = instant(row.date)
      if positions[time] == nil { positions[time] = row }
    }
    let times = positions.keys.sorted()
    if !times.isEmpty {
      streams["route"] = [
        "unit": "degrees",
        "samples": times.map {
          [
            "timestamp": $0, "latitude": positions[$0]!.latitude,
            "longitude": positions[$0]!.longitude,
          ] as [String: Any]
        },
      ]
      let altitude = times.compactMap { time -> [String: Any]? in
        guard let altitude = positions[time]?.altitude, altitude.isFinite else { return nil }
        return ["timestamp": time, "value": altitude]
      }
      if !altitude.isEmpty { streams["altitude"] = ["unit": "m", "samples": altitude] }
    }
    let count = streams.values.reduce(0) {
      $0 + ((($1 as? [String: Any])?["samples"] as? [Any])?.count ?? 0)
    }
    guard count <= 100_000, end.timeIntervalSince(start) <= 7 * 86400 else {
      throw HealthLocalError.storageLimit
    }
    var paused = false
    var seen = Set<String>()
    var events: [[String: Any]] = []
    for event in record.events.sorted(by: { $0.start < $1.start })
    where inside(event.start) && [1, 2, 5, 6].contains(event.type) {
      let time = instant(event.start)
      guard seen.insert(time).inserted else { continue }
      let next = [1, 5].contains(event.type)
      if next != paused { events.append(["type": next ? "PAUSE" : "RESUME", "timestamp": time]) }
      paused = next
    }
    var laps: [[String: Any]] = []
    var previous = start
    for event in record.events.sorted(by: { $0.start < $1.start }) where event.type == 3 {
      if event.start >= previous && event.end > event.start && event.end <= end {
        laps.append(["startDate": instant(event.start), "endDate": instant(event.end)])
        previous = event.end
      }
    }
    guard events.count <= 1000, laps.count <= 1000, record.revision > 0 else {
      throw HealthLocalError.invalidSelection
    }
    var source: [String: Any] = [
      "bundleIdentifier": record.source.bundleIdentifier,
      "name": record.source.name, "recordingKind": "single", "original": true,
    ]
    source["version"] = record.source.version
    source["deviceType"] = record.source.productType ?? record.source.deviceModel
    source["indoor"] = record.indoor
    var body: [String: Any] = [
      "protocolVersion": 1, "workoutUuid": record.uuid.lowercased(),
      "revision": record.revision, "name": "Apple Watch \(record.sport)", "sport": record.sport,
      "startDate": instant(start), "endDate": instant(end),
      "elapsedDuration": ["value": elapsed, "unit": "s"],
      "activeDuration": [
        "value": min(record.activeDuration, elapsed), "unit": "s",
      ],
      "source": source, "streams": streams, "events": events, "laps": laps,
    ]
    for (key, value, unit) in [
      ("distance", record.distanceMeters, "m"), ("energy", record.energyKilojoules, "kJ"),
      ("elevationGain", record.elevationGainMeters, "m"),
    ] {
      if let value { body[key] = ["value": value, "unit": unit] }
    }
    let data = try JSONSerialization.data(withJSONObject: body, options: [.sortedKeys])
    guard data.count <= 20 * 1024 * 1024 else { throw HealthLocalError.storageLimit }
    return data
  }
}
