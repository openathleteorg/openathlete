import Foundation

enum HealthPreviewBuilder {
  static func importableMetrics(_ metrics: [HealthDailyPreview]) -> [HealthDailyPreview] {
    // Stage ambiguity does not invalidate the normalized total asleep duration.
    metrics.filter {
      ["HRV_SDNN", "HR_REST", "SLEEP_DURATION", "WEIGHT", "BODY_FAT"].contains($0.type)
    }
  }

  static func build(_ snapshot: HealthSnapshot) -> (
    metrics: [HealthDailyPreview], sleep: [HealthSleepPreview]
  ) {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: snapshot.selection.timeZone)!
    let formatter = DateFormatter()
    formatter.calendar = calendar
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = calendar.timeZone
    formatter.dateFormat = "yyyy-MM-dd"
    var metrics: [HealthDailyPreview] = []
    for type in snapshot.selection.types where type != .sleep {
      let sourceID = snapshot.selectedSource(for: type)
      let samples = snapshot.samples.values.filter {
        $0.type == type && $0.source.id == sourceID && $0.value != nil && $0.unit != nil
      }
      for (day, values) in Dictionary(grouping: samples, by: { formatter.string(from: $0.start) }) {
        let value: Double
        if [.restingHeartRate, .weight, .bodyFat].contains(type) {
          value = values.sorted {
            $0.start == $1.start ? $0.uuid < $1.uuid : $0.start < $1.start
          }.last!.value!
        } else {
          value =
            values.sorted { $0.uuid < $1.uuid }.reduce(0) { $0 + $1.value! } / Double(values.count)
        }
        let labels: [HealthReadingType: String] = [
          .hrv: "HRV_SDNN", .restingHeartRate: "HR_REST", .respiratoryRate: "RESPIRATION_RATE_AVG",
          .oxygenSaturation: "PULSE_OX_AVG", .wristTemperature: "WRIST_TEMPERATURE",
          .weight: "WEIGHT", .bodyFat: "BODY_FAT",
        ]
        metrics.append(
          HealthDailyPreview(
            type: labels[type]!, date: day, value: value, unit: values.first!.unit!,
            sampleCount: values.count, sourceID: values.first!.source.id
          ))
      }
    }

    // Group asleep samples into episodes; gaps group an episode but never add sleep time.
    let sleepSourceID = snapshot.selectedSource(for: .sleep)
    let sleepSamples = snapshot.samples.values.filter {
      $0.type == .sleep && $0.source.id == sleepSourceID
    }
    let asleep = sleepSamples.filter {
      [1, 3, 4, 5].contains($0.categoryValue ?? -1) && $0.end > $0.start
    }.sorted { $0.start < $1.start }
    var episodes: [[HealthLocalSample]] = []
    var episodeEnd: Date?
    for sample in asleep {
      if let end = episodeEnd, sample.start.timeIntervalSince(end) <= 90 * 60 {
        episodes[episodes.count - 1].append(sample)
        episodeEnd = max(end, sample.end)
      } else {
        episodes.append([sample])
        episodeEnd = sample.end
      }
    }
    var sleep: [HealthSleepPreview] = []
    let byWakeDate = Dictionary(grouping: episodes) { episode in
      formatter.string(from: episode.map(\.end).max()!)
    }
    for (day, candidates) in byWakeDate {
      // Main episode only; other episodes/naps remain in the raw local store.
      let episode = candidates.max { unionDuration($0) < unionDuration($1) }!
      let start = episode.map(\.start).min()!
      let end = episode.map(\.end).max()!
      let awakeSamples = sleepSamples.filter {
        $0.categoryValue == 2 && $0.start < end && $0.end > start
      }
      let points = Set(
        episode.flatMap { [$0.start, $0.end] }
          + awakeSamples.flatMap { [max(start, $0.start), min(end, $0.end)] }
      ).sorted()
      var stages: [Int: Double] = [:]
      var conflict = false
      for (start, end) in zip(points, points.dropFirst()) {
        let active = Set(
          episode.filter { $0.start < end && $0.end > start }.compactMap(\.categoryValue))
        guard !active.isEmpty else { continue }
        let specific = active.subtracting([1])
        if awakeSamples.contains(where: { $0.start < end && $0.end > start }) {
          if !specific.isEmpty { conflict = true }
          continue
        }
        let stage: Int
        if specific.count > 1 {
          conflict = true
          stage = 1
        } else {
          stage = specific.first ?? 1
        }
        stages[stage, default: 0] += end.timeIntervalSince(start)
      }
      let awake = awakeSamples.map { (max(start, $0.start), min(end, $0.end)) }
      let total = stages.keys.sorted().reduce(0) { $0 + stages[$1]! }
      metrics.append(
        HealthDailyPreview(
          type: "SLEEP_DURATION", date: day, value: total / 3600, unit: "h",
          sampleCount: episode.count, sourceID: episode.first!.source.id
        ))
      sleep.append(
        HealthSleepPreview(
          date: day, core: (stages[3] ?? 0) / 3600, deep: (stages[4] ?? 0) / 3600,
          rem: (stages[5] ?? 0) / 3600, unspecified: (stages[1] ?? 0) / 3600,
          awake: unionDuration(awake) / 3600, hasConflicts: conflict
        ))
    }
    return (
      metrics.sorted { $0.date == $1.date ? $0.type < $1.type : $0.date > $1.date },
      sleep.sorted { $0.date > $1.date }
    )
  }

  private static func unionDuration(_ samples: [HealthLocalSample]) -> Double {
    unionDuration(samples.map { ($0.start, $0.end) })
  }

  private static func unionDuration(_ intervals: [(Date, Date)]) -> Double {
    var total = 0.0
    var merged: (Date, Date)?
    for (start, end) in intervals.sorted(by: { $0.0 < $1.0 }) where end > start {
      if let current = merged, start <= current.1 {
        merged = (current.0, max(current.1, end))
      } else {
        if let current = merged { total += current.1.timeIntervalSince(current.0) }
        merged = (start, end)
      }
    }
    if let current = merged { total += current.1.timeIntervalSince(current.0) }
    return total
  }
}
