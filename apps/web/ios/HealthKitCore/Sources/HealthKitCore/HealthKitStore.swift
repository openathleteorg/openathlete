import Foundation

/// Atomically persists samples and anchors together. The caller serializes access.
final class HealthSnapshotStore {
  let directory: URL
  private var file: URL { directory.appendingPathComponent("snapshot.json") }

  init(directory: URL) { self.directory = directory }

  func load(binding: HealthBinding) throws -> HealthSnapshot? {
    guard FileManager.default.fileExists(atPath: file.path) else { return nil }
    let snapshot: HealthSnapshot = try HealthProtectedFile.load(file)
    _ = try HealthSelection(
      types: snapshot.selection.types, historyDays: snapshot.selection.historyDays,
      timeZone: snapshot.selection.timeZone)
    _ = try HealthBinding(
      apiBaseURL: snapshot.binding.apiBaseURL, accountID: snapshot.binding.accountID)
    guard snapshot.binding == binding else {
      try clear()
      return nil
    }
    return snapshot
  }

  func save(_ snapshot: HealthSnapshot) throws {
    try HealthProtectedFile.save(snapshot, directory: directory, file: file)
  }

  func clear() throws {
    if FileManager.default.fileExists(atPath: file.path) {
      try FileManager.default.removeItem(at: file)
    }
  }
}

/// Shared protection/atomicity for the independently consented measurement and workout caches.
enum HealthProtectedFile {
  static func load<T: Decodable>(_ file: URL) throws -> T {
    let data = try Data(contentsOf: file)
    guard data.count <= 64 * 1024 * 1024 else { throw HealthLocalError.storageLimit }
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .secondsSince1970
    return try decoder.decode(T.self, from: data)
  }

  static func save<T: Encodable>(_ snapshot: T, directory: URL, file: URL) throws {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    var folder = directory
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try folder.setResourceValues(values)
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .secondsSince1970
    let data = try encoder.encode(snapshot)
    guard data.count <= 64 * 1024 * 1024 else { throw HealthLocalError.storageLimit }
    #if os(iOS)
      try FileManager.default.setAttributes(
        [.protectionKey: FileProtectionType.complete], ofItemAtPath: directory.path)
      try data.write(to: file, options: [.atomic, .completeFileProtection])
    #else
      try data.write(to: file, options: [.atomic])
    #endif
    var stored = file
    try stored.setResourceValues(values)
  }

}
