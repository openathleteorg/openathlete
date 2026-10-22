import Foundation
import CryptoKit

// Zwift's private API may change. Never surface response bodies or tokens in errors.
enum ZwiftError: String, Error {
  case login = "ZWIFT_LOGIN_REQUIRED", network = "ZWIFT_NETWORK", response = "ZWIFT_RESPONSE"
  case busy = "ZWIFT_BUSY", storage = "ZWIFT_STORAGE", invalid = "ZWIFT_INVALID"
  case verification = "ZWIFT_VERIFY_FAILED"
}

struct ZwiftFailure: Error {
  let cause: ZwiftError
  let reference: String
}

enum ZwiftStage: String { case login, refresh, profile, upload, verify, list, manifest
  case manifestUpload = "manifest-upload", manifestVerify = "manifest-verify"
}

struct ZwiftTokens: Codable {
  let accessToken: String
  let refreshToken: String
  let expires: Date
}

final class ZwiftClient {
  static let tokenURL = URL(string: "https://secure.zwift.com/auth/realms/zwift/protocol/openid-connect/token")!
  private let base = URL(string: "https://us-or-rly101.zwift.com")!
  private let session: URLSession
  private let diagnostic: (String) -> Void
  init(session: URLSession, diagnostic: @escaping (String) -> Void = { _ in }) {
    self.session = session
    self.diagnostic = diagnostic
  }
  private func failure(_ cause: ZwiftError, _ reference: String) -> ZwiftFailure {
    diagnostic(reference)
    return ZwiftFailure(cause: cause, reference: reference)
  }

  func authenticate(username: String, password: String) async throws -> ZwiftTokens {
    try await token(["grant_type": "password", "username": username, "password": password])
  }

  func refresh(_ refreshToken: String) async throws -> ZwiftTokens {
    try await token(["grant_type": "refresh_token", "refresh_token": refreshToken])
  }

  private func token(_ values: [String: String]) async throws -> ZwiftTokens {
    var request = URLRequest(url: Self.tokenURL)
    request.httpMethod = "POST"
    request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
    let form = values.merging(["client_id": "Zwift Game Client"]) { _, new in new }
    let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-._~"))
    request.httpBody = form.sorted { $0.key < $1.key }.map {
      "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: allowed)!)"
    }.joined(separator: "&").data(using: .utf8)
    let data = try await send(request, stage: values["grant_type"] == "password" ? .login : .refresh)
    struct Response: Decodable {
      let access_token: String
      let refresh_token: String
      let expires_in: Double
    }
    guard let decoded = try? JSONDecoder().decode(Response.self, from: data),
      !decoded.access_token.isEmpty, !decoded.refresh_token.isEmpty,
      decoded.expires_in.isFinite, decoded.expires_in > 0
    else { throw failure(.response, "zwift-token-format") }
    return ZwiftTokens(accessToken: decoded.access_token, refreshToken: decoded.refresh_token,
      expires: Date().addingTimeInterval(decoded.expires_in))
  }

  func checkProfile(token: String) async throws {
    let data = try await send(api("/api/profiles/me", token: token), stage: .profile)
    guard let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      value["id"] != nil else { throw failure(.response, "zwift-profile-format") }
  }

  // Reuse a deterministic filename on explicit retries. Do not edit Zwift's shared manifest.
  // A 2xx alone is insufficient: retrieve the resulting file and compare its contents.
  func upload(name: String, xml: String, token: String) async throws {
    guard name.range(of: #"^openathlete-[a-f0-9]+-[0-9]+\.zwo$"#, options: .regularExpression) != nil,
      xml.utf8.count <= 512_000, xml.contains("<workout_file>"), xml.contains("<sportType>bike</sportType>")
    else { throw ZwiftError.invalid }
    var request = api("/api/zfiles", token: token)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try JSONSerialization.data(withJSONObject: [
      "folder": "customworkouts", "name": name, "content": Data(xml.utf8).base64EncodedString(),
    ])
    let result = try await send(request, stage: .upload)
    guard let value = try? JSONSerialization.jsonObject(with: result) as? [String: Any],
      value["folder"] as? String == "customworkouts",
      (value["name"] as? String ?? value["filename"] as? String) == name
    else { throw failure(.verification, "zwift-upload-format") }
    let id = (value["id"] as? NSNumber)?.stringValue ?? value["id"] as? String ?? ""
    guard !id.isEmpty, id.allSatisfy({ $0.isASCII && $0.isNumber }) else { throw failure(.verification, "zwift-upload-id") }
    var download = api("/api/zfiles/\(id)/download", token: token)
    // This endpoint returns the stored file, not a JSON resource. Requiring JSON
    // makes production Zwift reject the otherwise successful upload with HTTP 406.
    download.setValue("*/*", forHTTPHeaderField: "Accept")
    let downloaded = try await send(download, stage: .verify)
    let content = ZwiftZFile.content(downloaded, name: name) ?? downloaded
    guard content == Data(xml.utf8) else {
      diagnostic("zwift-verify-format-" + ZwiftZFile.format(downloaded))
      throw failure(.verification, "zwift-verify-content")
    }
    try await registerWorkout(token: token, name: name, content: content)
  }

  private func downloadFile(id: String, name: String, token: String, stage: ZwiftStage) async throws -> Data {
    var request = api("/api/zfiles/\(id)/download", token: token)
    request.setValue("*/*", forHTTPHeaderField: "Accept")
    let data = try await send(request, stage: stage)
    return ZwiftZFile.content(data, name: name) ?? data
  }

  private func registerWorkout(token: String, name: String, content: Data) async throws {
    for _ in 0..<3 {
      var list = api("/api/zfiles/list", token: token)
      var url = URLComponents(url: list.url!, resolvingAgainstBaseURL: false)!
      url.queryItems = [URLQueryItem(name: "folder", value: "customworkouts")]
      list.url = url.url
      let data = try await send(list, stage: .list)
      guard let records = ZwiftZFile.directory(data), records.contains(where: { $0.name == name }) else {
        throw failure(.verification, "zwift-list-workout-missing")
      }
      let manifests = records.filter { $0.name == "workouts.files" }
      guard manifests.count <= 1 else { throw failure(.verification, "zwift-manifest-ambiguous") }
      let manifest = manifests.first
      let original: Data
      if let manifest {
        original = try await downloadFile(id: manifest.id, name: "workouts.files", token: token, stage: .manifest)
      } else {
        // Do not publish an incomplete new directory over other unindexed files.
        guard records.allSatisfy({ $0.name == name }) else { throw failure(.verification, "zwift-manifest-missing-other-files") }
        original = Data("<custom_file_directory><deleted_files/></custom_file_directory>".utf8)
      }
      let updated: Data
      do { updated = try ZwiftManifest.merge(original, name: name, content: content) }
      catch { throw failure(.verification, "zwift-manifest-format") }
      if let manifest {
        // Detect concurrent edits before publishing. Never replace a directory
        // we could not parse, and never modify/delete another workout's entry.
        let latest = try await downloadFile(id: manifest.id, name: "workouts.files", token: token, stage: .manifest)
        if latest != original { continue }
      }
      if updated == original {
        diagnostic("zwift-manifest-entry-verified"); return
      }
      var request = api("/api/zfiles", token: token)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = try JSONSerialization.data(withJSONObject: [
        "folder": "customworkouts", "name": "workouts.files", "content": updated.base64EncodedString(),
      ])
      let response = try await send(request, stage: .manifestUpload)
      guard let value = try? JSONSerialization.jsonObject(with: response) as? [String: Any],
        value["folder"] as? String == "customworkouts", let record = ZwiftZFile.record(value),
        record.name == "workouts.files" else { throw failure(.verification, "zwift-manifest-upload-format") }
      let saved = try await downloadFile(id: record.id, name: "workouts.files", token: token, stage: .manifestVerify)
      guard saved == updated else { throw failure(.verification, "zwift-manifest-verify-content") }
      diagnostic("zwift-manifest-entry-verified")
      return
    }
    throw failure(.verification, "zwift-manifest-changed")
  }

  private func api(_ path: String, token: String) -> URLRequest {
    var request = URLRequest(url: base.appendingPathComponent(path))
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue("zwift-companion", forHTTPHeaderField: "Source")
    // No spoofed Android/OSX platform or fabricated game version.
    return request
  }

  private func send(_ input: URLRequest, stage: ZwiftStage) async throws -> Data {
    var request = input
    request.timeoutInterval = 30
    request.cachePolicy = .reloadIgnoringLocalCacheData
    do {
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse else { throw failure(.response, "zwift-\(stage.rawValue)-no-http") }
      let reference = "zwift-\(stage.rawValue)-http-\(http.statusCode)"
      diagnostic(reference)
      if http.statusCode == 401 || ([ZwiftStage.login, .refresh].contains(stage) && [400, 403].contains(http.statusCode)) {
        throw failure(.login, reference)
      }
      guard (200...299).contains(http.statusCode), data.count <= 2_000_000 else { throw failure(.response, reference) }
      return data
    } catch let error as ZwiftFailure { throw error }
      catch let error as ZwiftError { throw error }
      catch { throw failure(.network, "zwift-\(stage.rawValue)-network-\((error as NSError).code)") }
  }
}

// Minimal bounded reader for Zwift's published ZFileProto layout. The production
// download may wrap file bytes in protobuf rather than return a bare .zwo document.
// Reference: zoffline/zwift-offline/protobuf/zfiles.proto (fields 1–5).
enum ZwiftZFile {
  struct Record { let id: String; let name: String }
  struct Field { let number: UInt64; let integer: UInt64?; let bytes: Data? }
  static func fields(_ data: Data) -> [Field]? {
    let bytes = [UInt8](data)
    guard bytes.count <= 2_000_000 else { return nil }
    var index = 0
    func varint() -> UInt64? {
      var value: UInt64 = 0
      for shift in stride(from: 0, through: 63, by: 7) {
        guard index < bytes.count else { return nil }
        let byte = bytes[index]; index += 1
        if shift == 63 && byte > 1 { return nil }
        value |= UInt64(byte & 127) << shift
        if byte < 128 { return value }
      }
      return nil
    }
    var result: [Field] = []
    while index < bytes.count {
      guard result.count < 10_000, let key = varint(), key >> 3 > 0 else { return nil }
      let number = key >> 3
      switch key & 7 {
      case 0:
        guard let value = varint() else { return nil }
        result.append(Field(number: number, integer: value, bytes: nil))
      case 2:
        guard let count = varint(), count <= UInt64(bytes.count - index) else { return nil }
        let end = index + Int(count)
        result.append(Field(number: number, integer: nil, bytes: Data(bytes[index..<end])))
        index = end
      case 1, 5:
        let count = key & 7 == 1 ? 8 : 4
        guard index + count <= bytes.count else { return nil }
        index += count
      default: return nil
      }
    }
    return result
  }
  static func string(_ fields: [Field], _ number: UInt64) -> String? {
    fields.first { $0.number == number }?.bytes.flatMap { String(data: $0, encoding: .utf8) }
  }
  static func content(_ data: Data, name: String) -> Data? {
    if let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      object["folder"] as? String == "customworkouts",
      (object["name"] as? String ?? object["filename"] as? String) == name,
      let encoded = object["content"] as? String { return Data(base64Encoded: encoded) }
    guard let fields = fields(data), string(fields, 2) == "customworkouts", string(fields, 3) == name
    else { return nil }
    return fields.first { $0.number == 4 }?.bytes
  }
  static func record(_ item: [String: Any]) -> Record? {
    guard let name = (item["name"] as? String) ?? (item["filename"] as? String),
      let id = (item["id"] as? NSNumber)?.stringValue ?? item["id"] as? String,
      !id.isEmpty, id.allSatisfy({ $0.isASCII && $0.isNumber }) else { return nil }
    return Record(id: id, name: name)
  }
  static func directory(_ data: Data) -> [Record]? {
    if let json = try? JSONSerialization.jsonObject(with: data) {
      let wrapper = json as? [String: Any]
      guard let items = (json as? [[String: Any]]) ?? (wrapper?["zfiles"] as? [[String: Any]]) ?? (wrapper?["files"] as? [[String: Any]]) else { return nil }
      var result: [Record] = []
      for item in items {
        guard let record = record(item) else { return nil }
        result.append(record)
      }
      return result
    }
    guard let list = fields(data) else { return nil }
    var result: [Record] = []
    for field in list where field.number == 1 {
      guard let bytes = field.bytes, let file = fields(bytes), let name = string(file, 3),
        string(file, 2) == "customworkouts", let id = file.first(where: { $0.number == 1 })?.integer else { return nil }
      result.append(Record(id: String(id), name: name))
    }
    return result
  }
  static func format(_ data: Data) -> String {
    if let _ = try? JSONSerialization.jsonObject(with: data) { return "json" }
    if let parsed = fields(data), !parsed.isEmpty { return "protobuf" }
    if let string = String(data: data, encoding: .utf8), string.trimmingCharacters(in: .whitespacesAndNewlines).hasPrefix("<") { return "xml" }
    return "other"
  }
}

// Preserve the complete existing directory tree, including unknown elements and
// attributes. Only the exact uploaded filename may be inserted or updated.
enum ZwiftManifest {
  final class Node {
    let name: String
    var attributes: [String: String]
    var children: [Child] = []
    init(_ name: String, attributes: [String: String] = [:]) {
      self.name = name; self.attributes = attributes
    }
    var text: String { children.map { if case .text(let value) = $0 { return value }; return "" }.joined() }
    func child(_ name: String) -> Node? {
      children.compactMap { if case .node(let node) = $0, node.name == name { return node }; return nil }.first
    }
    func set(_ name: String, _ value: String) {
      let node = child(name) ?? Node(name)
      if child(name) == nil { children.append(.node(node)) }
      node.children = [.text(value)]
    }
    func xml() -> String {
      let attrs = attributes.keys.sorted().map { " \($0)=\"\(ZwiftManifest.escape(attributes[$0]!))\"" }.joined()
      return "<\(name)\(attrs)>" + children.map { child in
        switch child {
        case .node(let node): return node.xml()
        case .text(let value): return ZwiftManifest.escape(value)
        case .comment(let value): return "<!--\(value)-->"
        }
      }.joined() + "</\(name)>"
    }
  }
  enum Child { case node(Node), text(String), comment(String) }
  private final class Reader: NSObject, XMLParserDelegate {
    var root: Node?
    var stack: [Node] = []
    var count = 0
    func parser(_ parser: XMLParser, didStartElement name: String, namespaceURI: String?, qualifiedName: String?, attributes: [String: String]) {
      count += 1
      guard stack.count < 20, count <= 10_000 else { parser.abortParsing(); return }
      let node = Node(name, attributes: attributes)
      if let parent = stack.last { parent.children.append(.node(node)) } else { root = node }
      stack.append(node)
    }
    func parser(_ parser: XMLParser, didEndElement name: String, namespaceURI: String?, qualifiedName: String?) { _ = stack.popLast() }
    func parser(_ parser: XMLParser, foundCharacters string: String) {
      guard let node = stack.last else { return }
      if case .text(let previous)? = node.children.last { node.children[node.children.count - 1] = .text(previous + string) }
      else { node.children.append(.text(string)) }
    }
    func parser(_ parser: XMLParser, foundCDATA data: Data) {
      guard let value = String(data: data, encoding: .utf8) else { parser.abortParsing(); return }
      self.parser(parser, foundCharacters: value)
    }
    func parser(_ parser: XMLParser, foundComment comment: String) { stack.last?.children.append(.comment(comment)) }
    func parser(_ parser: XMLParser, foundInternalEntityDeclarationWithName name: String, value: String?) { parser.abortParsing() }
    func parser(_ parser: XMLParser, foundExternalEntityDeclarationWithName name: String, publicID: String?, systemID: String?) { parser.abortParsing() }
  }
  static func escape(_ value: String) -> String {
    value.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "<", with: "&lt;")
      .replacingOccurrences(of: ">", with: "&gt;").replacingOccurrences(of: "\"", with: "&quot;")
  }
  static func parse(_ data: Data) throws -> Node {
    guard !data.isEmpty, data.count <= 2_000_000 else { throw ZwiftError.verification }
    let reader = Reader()
    let parser = XMLParser(data: data)
    parser.shouldResolveExternalEntities = false
    parser.delegate = reader
    guard parser.parse(), let root = reader.root, root.name == "custom_file_directory" else { throw ZwiftError.verification }
    return root
  }
  static func entries(_ root: Node) -> [Node] {
    root.children.compactMap { if case .node(let node) = $0, node.name == "custom_file" { return node }; return nil }
  }
  static func merge(_ data: Data, name: String, content: Data, now: Date = Date()) throws -> Data {
    let root = try parse(data)
    guard name.range(of: #"^openathlete-[a-f0-9]+-[0-9]+\.zwo$"#, options: .regularExpression) != nil else { throw ZwiftError.invalid }
    let existing = entries(root)
    let own = existing.filter { $0.child("name")?.text.trimmingCharacters(in: .whitespacesAndNewlines) == name }
    let checksum = content.reduce(0) { ($0 - Int($1)) & 255 }
    let entry = own.first ?? Node("custom_file")
    let used = Set(existing.filter { $0 !== entry }.compactMap { $0.child("guid").flatMap { Int($0.text) } })
    // A positive filename-derived ID, collision checked against the live directory.
    let digest = Insecure.SHA1.hash(data: Data(name.utf8))
    let generated = Int(digest.prefix(4).reduce(UInt32(0)) { ($0 << 8) | UInt32($1) } & 0x7fffffff)
    var guid = entry.child("guid").flatMap { Int($0.text) } ?? max(1, generated)
    if guid < 1 || guid > 0x7fffffff { guid = 1 }
    while used.contains(guid) { guid = guid == 0x7fffffff ? 1 : guid + 1 }
    let milliseconds = existing.contains { (Int64($0.child("time")?.text ?? "") ?? 0) > 100_000_000_000 }
    entry.set("name", name)
    entry.set("time", String(Int64(now.timeIntervalSince1970 * (milliseconds ? 1000 : 1))))
    entry.set("guid", String(guid))
    entry.set("checksum", String(checksum))
    entry.set("deleted", "false")
    root.children.removeAll { child in
      if case .node(let node) = child, node.name == "custom_file" { return node.child("name")?.text.trimmingCharacters(in: .whitespacesAndNewlines) == name }
      return false
    }
    let index = root.children.firstIndex { if case .node(let node) = $0 { return node.name == "deleted_files" }; return false } ?? root.children.endIndex
    root.children.insert(.node(entry), at: index)
    let output = Data(("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + root.xml()).utf8)
    _ = try parse(output)
    return output
  }
}
