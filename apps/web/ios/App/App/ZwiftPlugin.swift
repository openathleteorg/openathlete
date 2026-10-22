import Capacitor
import CryptoKit
import Foundation
import Security

private enum ZwiftKeychain {
  static func query(_ scope: String) -> [String: Any] {
    [kSecClass as String: kSecClassGenericPassword,
     kSecAttrService as String: "OpenAthlete.Zwift", kSecAttrAccount as String: scope]
  }
  static func load(_ scope: String) throws -> ZwiftTokens? {
    var attributes = query(scope)
    attributes[kSecReturnData as String] = true
    var result: CFTypeRef?
    let status = SecItemCopyMatching(attributes as CFDictionary, &result)
    if status == errSecItemNotFound { return nil }
    guard status == errSecSuccess, let data = result as? Data,
      let tokens = try? JSONDecoder().decode(ZwiftTokens.self, from: data)
    else { throw ZwiftError.storage }
    return tokens
  }
  static func save(_ tokens: ZwiftTokens, scope: String) throws {
    let data = try JSONEncoder().encode(tokens)
    let update = [kSecValueData as String: data]
    let status = SecItemUpdate(query(scope) as CFDictionary, update as CFDictionary)
    if status == errSecItemNotFound {
      var attributes = query(scope)
      attributes[kSecValueData as String] = data
      attributes[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
      guard SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess else { throw ZwiftError.storage }
    } else if status != errSecSuccess { throw ZwiftError.storage }
  }
  static func remove(_ scope: String) throws {
    let status = SecItemDelete(query(scope) as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else { throw ZwiftError.storage }
  }
}

private final class ZwiftNoRedirect: NSObject, URLSessionTaskDelegate {
  func urlSession(_ session: URLSession, task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}

private actor ZwiftService {
  private let client: ZwiftClient
  private var busy = false
  init() {
    let config = URLSessionConfiguration.ephemeral
    config.httpCookieStorage = nil
    config.urlCredentialStorage = nil
    config.urlCache = nil
    client = ZwiftClient(session: URLSession(configuration: config, delegate: ZwiftNoRedirect(), delegateQueue: nil), diagnostic: { reference in
      // Static stage/status references only: no URLs, headers, bodies or account identifiers.
      let file = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("OpenAthleteZwiftDiagnostic.txt")
      let previous = (try? String(contentsOf: file, encoding: .utf8)) ?? ""
      try? (String(previous.suffix(2000)) + reference + "\n").write(to: file, atomically: true, encoding: .utf8)
    })
  }
  func connected(scope: String) throws -> Bool { try ZwiftKeychain.load(scope) != nil }
  func connect(scope: String, username: String, password: String) async throws {
    guard !busy else { throw ZwiftError.busy }
    busy = true
    defer { busy = false }
    let tokens = try await client.authenticate(username: username, password: password)
    try await client.checkProfile(token: tokens.accessToken)
    try ZwiftKeychain.save(tokens, scope: scope)
  }
  func disconnect(scope: String) throws {
    guard !busy else { throw ZwiftError.busy }
    try ZwiftKeychain.remove(scope)
  }
  func upload(scope: String, eventID: Int, xml: String) async throws {
    guard !busy else { throw ZwiftError.busy }
    busy = true
    defer { busy = false }
    guard var tokens = try ZwiftKeychain.load(scope) else { throw ZwiftError.login }
    if tokens.expires.timeIntervalSinceNow < 60 {
      tokens = try await client.refresh(tokens.refreshToken)
      try ZwiftKeychain.save(tokens, scope: scope)
    }
    let name = "openathlete-\(scope.prefix(16))-\(eventID).zwo"
    // Retry once only after an explicit authentication rejection, never after an ambiguous POST failure.
    do { try await client.upload(name: name, xml: xml, token: tokens.accessToken) }
    catch let failure as ZwiftFailure where failure.cause == .login {
      tokens = try await client.refresh(tokens.refreshToken)
      try ZwiftKeychain.save(tokens, scope: scope)
      try await client.upload(name: name, xml: xml, token: tokens.accessToken)
    }
  }
}

@objc(OpenAthleteZwiftPlugin)
class OpenAthleteZwiftPlugin: CAPPlugin, CAPBridgedPlugin {
  let identifier = "OpenAthleteZwiftPlugin"
  let jsName = "OpenAthleteZwift"
  let pluginMethods: [CAPPluginMethod] = ["status", "connect", "disconnect", "upload"].map {
    CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise)
  }
  private let service = ZwiftService()
  private func scope(_ call: CAPPluginCall) throws -> String {
    guard let server = call.getString("apiBaseURL"), let url = URL(string: server),
      url.scheme == "https", url.host != nil, url.user == nil, url.password == nil,
      let account = call.getString("accountID"), !account.isEmpty
    else { throw ZwiftError.invalid }
    return SHA256.hash(data: Data("\(server)|\(account)".utf8)).map { String(format: "%02x", $0) }.joined()
  }
  private func reject(_ call: CAPPluginCall, _ error: Error) {
    let failure = error as? ZwiftFailure
    let code = failure?.cause.rawValue ?? (error as? ZwiftError)?.rawValue ?? ZwiftError.network.rawValue
    let reference = failure.map { " [\($0.reference)]" } ?? ""
    call.reject("Zwift request failed" + reference, code)
  }
  @objc func status(_ call: CAPPluginCall) {
    Task {
      do { call.resolve(["connected": try await service.connected(scope: scope(call))]) }
      catch { reject(call, error) }
    }
  }
  @objc func connect(_ call: CAPPluginCall) {
    Task {
      do {
        guard let username = call.getString("username"), !username.isEmpty,
          let password = call.getString("password"), !password.isEmpty else { throw ZwiftError.invalid }
        try await service.connect(scope: scope(call), username: username, password: password)
        call.resolve(["connected": true])
      } catch { reject(call, error) }
    }
  }
  @objc func disconnect(_ call: CAPPluginCall) {
    Task {
      do { try await service.disconnect(scope: scope(call)); call.resolve() }
      catch { reject(call, error) }
    }
  }
  @objc func upload(_ call: CAPPluginCall) {
    Task {
      do {
        guard let id = call.getInt("eventID"), id > 0,
          let xml = call.getString("xml") else { throw ZwiftError.invalid }
        try await service.upload(scope: scope(call), eventID: id, xml: xml)
        call.resolve(["verified": true])
      } catch { reject(call, error) }
    }
  }
}
