import Foundation
import XCTest
@testable import ZwiftCore

private final class StubProtocol: URLProtocol {
  static var requests: [URLRequest] = []
  static var handler: ((URLRequest) -> (Int, Data))?
  static var replies: [(Int, Data)] = []
  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
  override func startLoading() {
    var captured = request
    if captured.httpBody == nil, let stream = request.httpBodyStream {
      stream.open()
      defer { stream.close() }
      var body = Data()
      var buffer = [UInt8](repeating: 0, count: 4096)
      while stream.hasBytesAvailable {
        let count = stream.read(&buffer, maxLength: buffer.count)
        if count <= 0 { break }
        body.append(contentsOf: buffer.prefix(count))
      }
      captured.httpBody = body
    }
    Self.requests.append(captured)
    guard Self.handler != nil || !Self.replies.isEmpty else {
      client?.urlProtocol(self, didFailWithError: URLError(.cannotConnectToHost)); return
    }
    let (status, body) = Self.handler?(captured) ?? Self.replies.removeFirst()
    client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed)
    client?.urlProtocol(self, didLoad: body)
    client?.urlProtocolDidFinishLoading(self)
  }
  override func stopLoading() {}
}
final class ZwiftClientTests: XCTestCase {
  var client: ZwiftClient!
  let xml = "<workout_file><sportType>bike</sportType><workout/></workout_file>"
  override func setUp() {
    StubProtocol.requests = []; StubProtocol.replies = []; StubProtocol.handler = nil
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [StubProtocol.self]
    client = ZwiftClient(session: URLSession(configuration: config))
  }
  func testPasswordAndRefreshForms() async throws {
    let token = Data(#"{"access_token":"access","refresh_token":"refresh","expires_in":3600}"#.utf8)
    StubProtocol.replies = [(200, token), (200, token)]
    let result = try await client.authenticate(username: "test+tag@example.org", password: "a&b= +%")
    XCTAssertEqual(result.accessToken, "access")
    let form = String(data: StubProtocol.requests[0].httpBody!, encoding: .utf8)!
    XCTAssertTrue(form.contains("password=a%26b%3D%20%2B%25"))
    XCTAssertTrue(form.contains("username=test%2Btag%40example.org"))
    _ = try await client.refresh("refresh&value")
    let refresh = String(data: StubProtocol.requests[1].httpBody!, encoding: .utf8)!
    XCTAssertTrue(refresh.contains("grant_type=refresh_token"))
    XCTAssertFalse(refresh.contains("password="))
  }
  func testUploadOnlySucceedsAfterMatchingDownload() async throws {
    let name = "openathlete-ab12-42.zwo"
    var manifest = Data("<custom_file_directory><custom_file><name>other.zwo</name><guid>17</guid><checksum>1</checksum><time>100</time><deleted>false</deleted></custom_file><deleted_files/></custom_file_directory>".utf8)
    StubProtocol.handler = { request in
      if request.httpMethod == "POST" {
        let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: String]
        if body["name"] == "workouts.files" { manifest = Data(base64Encoded: body["content"]!)! }
        let id = body["name"] == "workouts.files" ? 8 : 7
        return (200, try! JSONSerialization.data(withJSONObject: ["id": id, "folder": "customworkouts", "name": body["name"]!]))
      }
      if request.url!.path == "/api/zfiles/list" {
        return (200, try! JSONSerialization.data(withJSONObject: [["id": 7, "name": name], ["id": 8, "name": "workouts.files"]]))
      }
      if request.url!.path == "/api/zfiles/8/download" { return (200, manifest) }
      return (200, Data(self.xml.utf8))
    }
    try await client.upload(name: name, xml: xml, token: "secret")
    XCTAssertEqual(StubProtocol.requests.count, 7)
    XCTAssertEqual(StubProtocol.requests[0].url?.path, "/api/zfiles")
    XCTAssertEqual(StubProtocol.requests[1].url?.path, "/api/zfiles/7/download")
    XCTAssertEqual(StubProtocol.requests[0].value(forHTTPHeaderField: "Accept"), "application/json")
    XCTAssertEqual(StubProtocol.requests[1].value(forHTTPHeaderField: "Accept"), "*/*")
    XCTAssertEqual(StubProtocol.requests[0].value(forHTTPHeaderField: "Source"), "zwift-companion")
    let body = try JSONSerialization.jsonObject(with: StubProtocol.requests[0].httpBody!) as! [String: String]
    XCTAssertEqual(Data(base64Encoded: body["content"]!), Data(xml.utf8))
    let directory = try ZwiftManifest.parse(manifest)
    XCTAssertEqual(Set(ZwiftManifest.entries(directory).compactMap { $0.child("name")?.text }), Set(["other.zwo", name]))
    XCTAssertEqual(ZwiftManifest.entries(directory).first { $0.child("name")?.text == "other.zwo" }?.child("guid")?.text, "17")
  }
  func testWrongDownloadedBytesDoNotReportSuccess() async throws {
    StubProtocol.replies = [(200, Data(#"{"id":7,"folder":"customworkouts","name":"openathlete-ab12-42.zwo"}"#.utf8)), (200, Data("other workout".utf8))]
    do {
      try await client.upload(name: "openathlete-ab12-42.zwo", xml: xml, token: "secret")
      XCTFail("Should require matching bytes")
    } catch { XCTAssertEqual((error as? ZwiftFailure)?.cause ?? error as? ZwiftError, .verification) }
  }
  func testErrorsNeverExposeResponseBodyAndDoNotRetryPOST() async throws {
    StubProtocol.replies = [(503, Data("private server response".utf8))]
    do {
      try await client.upload(name: "openathlete-ab12-42.zwo", xml: xml, token: "secret")
      XCTFail("Should fail")
    } catch { XCTAssertEqual((error as? ZwiftFailure)?.cause ?? error as? ZwiftError, .response) }
    XCTAssertEqual(StubProtocol.requests.count, 1)
  }
  func testRejectedLoginAndInvalidFilename() async throws {
    StubProtocol.replies = [(400, Data(#"{"error":"invalid_grant"}"#.utf8))]
    do {
      _ = try await client.authenticate(username: "test", password: "wrong")
      XCTFail("Should fail")
    } catch { XCTAssertEqual((error as? ZwiftFailure)?.cause ?? error as? ZwiftError, .login) }
    do {
      try await client.upload(name: "../workouts.files", xml: xml, token: "secret")
      XCTFail("Should fail")
    } catch { XCTAssertEqual((error as? ZwiftFailure)?.cause ?? error as? ZwiftError, .invalid) }
    XCTAssertEqual(StubProtocol.requests.count, 1)
  }
}

final class ZwiftZFileTests: XCTestCase {
  private func varint(_ number: UInt64) -> Data {
    var number = number
    var result = Data()
    repeat {
      var byte = UInt8(number & 127)
      number >>= 7
      if number > 0 { byte |= 128 }
      result.append(byte)
    } while number > 0
    return result
  }
  private func field(_ number: UInt64, _ bytes: Data) -> Data {
    varint(number << 3 | 2) + varint(UInt64(bytes.count)) + bytes
  }
  private func file(name: String, content: Data) -> Data {
    Data([8, 7]) + field(2, Data("customworkouts".utf8)) + field(3, Data(name.utf8)) + field(4, content)
  }
  func testProtobufDownloadAndDirectory() {
    let xml = Data("<workout_file>test</workout_file>".utf8)
    let record = file(name: "example.zwo", content: xml)
    XCTAssertEqual(ZwiftZFile.content(record, name: "example.zwo"), xml)
    XCTAssertNil(ZwiftZFile.content(record, name: "other.zwo"))
    let directory = ZwiftZFile.directory(field(1, record))
    XCTAssertEqual(directory?.first?.id, "7")
    XCTAssertEqual(directory?.first?.name, "example.zwo")
    XCTAssertEqual(ZwiftZFile.format(record), "protobuf")
  }
  func testJSONEnvelopeAndBareXMLRemainDistinct() throws {
    let xml = Data("<workout_file/>".utf8)
    let json = try JSONSerialization.data(withJSONObject: ["folder": "customworkouts", "name": "example.zwo", "content": xml.base64EncodedString()])
    XCTAssertEqual(ZwiftZFile.content(json, name: "example.zwo"), xml)
    XCTAssertNil(ZwiftZFile.content(xml, name: "example.zwo"))
    XCTAssertEqual(ZwiftZFile.format(xml), "xml")
  }
  func testMalformedAndOversizedProtobufFailSafely() {
    for data in [Data([0]), Data([34, 255, 255, 255]), Data(repeating: 128, count: 11), Data(repeating: 0, count: 2_000_001)] {
      XCTAssertNil(ZwiftZFile.fields(data))
    }
    XCTAssertNil(ZwiftZFile.content(Data([34, 0]), name: "example.zwo"))
  }
}

final class ZwiftManifestTests: XCTestCase {
  let filename = "openathlete-ab12-42.zwo"
  let date = Date(timeIntervalSince1970: 1_700_000_000)
  func testMergePreservesOtherEntriesUnknownNodesAndDeletionHistory() throws {
    let original = Data(#"<custom_file_directory version="2"><!--keep--><future mode="x">A &amp; B</future><custom_file><name>other.zwo</name><guid>17</guid><checksum>33</checksum><time>100</time><deleted>true</deleted><extra>keep me</extra></custom_file><deleted_files><name>old.zwo</name></deleted_files></custom_file_directory>"#.utf8)
    let content = Data("<workout_file/>".utf8)
    let updated = try ZwiftManifest.merge(original, name: filename, content: content, now: date)
    let root = try ZwiftManifest.parse(updated)
    XCTAssertEqual(root.attributes["version"], "2")
    XCTAssertEqual(root.child("future")?.text, "A & B")
    XCTAssertEqual(root.child("future")?.attributes["mode"], "x")
    XCTAssertEqual(root.child("deleted_files")?.child("name")?.text, "old.zwo")
    let entries = ZwiftManifest.entries(root)
    XCTAssertEqual(entries.count, 2)
    XCTAssertEqual(entries[0].child("deleted")?.text, "true")
    XCTAssertEqual(entries[0].child("extra")?.text, "keep me")
    let own = entries[1]
    XCTAssertEqual(own.child("name")?.text, filename)
    XCTAssertEqual(own.child("deleted")?.text, "false")
    XCTAssertEqual(own.child("time")?.text, "1700000000")
    XCTAssertEqual(own.child("checksum")?.text, String((-content.reduce(0) { $0 + Int($1) }) & 255))
    XCTAssertGreaterThan(Int(own.child("guid")!.text)!, 0)
  }
  func testRepeatUpdatesOneEntryAndPreservesGUID() throws {
    let first = try ZwiftManifest.merge(Data("<custom_file_directory><deleted_files/></custom_file_directory>".utf8), name: filename, content: Data([1]), now: date)
    let guid = try ZwiftManifest.entries(ZwiftManifest.parse(first))[0].child("guid")!.text
    let second = try ZwiftManifest.merge(first, name: filename, content: Data([2]), now: date.addingTimeInterval(1))
    let entries = try ZwiftManifest.entries(ZwiftManifest.parse(second))
    XCTAssertEqual(entries.count, 1)
    XCTAssertEqual(entries[0].child("guid")?.text, guid)
    XCTAssertEqual(entries[0].child("checksum")?.text, "254")
    XCTAssertEqual(entries[0].child("time")?.text, "1700000001")
  }
  func testBadXMLAndEntitiesNeverProduceAReplacementDirectory() {
    for value in ["<wrong/>", "<custom_file_directory>", #"<!DOCTYPE x [<!ENTITY a "secret">]><custom_file_directory>&a;</custom_file_directory>"#] {
      XCTAssertThrowsError(try ZwiftManifest.merge(Data(value.utf8), name: filename, content: Data(), now: date))
    }
    XCTAssertThrowsError(try ZwiftManifest.merge(Data("<custom_file_directory/>".utf8), name: "other.zwo", content: Data(), now: date))
  }
}

extension ZwiftClientTests {
  func testConcurrentDirectoryEditIsMergedBeforePublishing() async throws {
    let filename = "openathlete-ab12-42.zwo"
    var manifest = Data("<custom_file_directory><deleted_files/></custom_file_directory>".utf8)
    var reads = 0
    var listReads = 0
    StubProtocol.handler = { request in
      let path = request.url!.path
      if request.httpMethod == "POST" {
        let body = try! JSONSerialization.jsonObject(with: request.httpBody!) as! [String: String]
        if body["name"] == "workouts.files" { manifest = Data(base64Encoded: body["content"]!)! }
        return (200, try! JSONSerialization.data(withJSONObject: ["id": body["name"] == "workouts.files" ? 8 : 7, "folder": "customworkouts", "name": body["name"]!]))
      }
      if path == "/api/zfiles/list" {
        listReads += 1
        return (200, try! JSONSerialization.data(withJSONObject: [["id": 7, "name": filename], ["id": 8, "name": "workouts.files"]]))
      }
      if path == "/api/zfiles/8/download" {
        reads += 1
        if reads == 2 { manifest = Data("<custom_file_directory><custom_file><name>another-device.zwo</name><guid>55</guid><checksum>2</checksum><time>100</time><deleted>false</deleted></custom_file><deleted_files/></custom_file_directory>".utf8) }
        return (200, manifest)
      }
      return (200, Data(self.xml.utf8))
    }
    try await client.upload(name: filename, xml: xml, token: "secret")
    XCTAssertEqual(listReads, 2)
    let names = try ZwiftManifest.entries(ZwiftManifest.parse(manifest)).compactMap { $0.child("name")?.text }
    XCTAssertEqual(Set(names), Set([filename, "another-device.zwo"]))
  }
  func testUnparseableLiveManifestIsNeverOverwritten() async throws {
    let filename = "openathlete-ab12-42.zwo"
    StubProtocol.handler = { request in
      if request.httpMethod == "POST" { return (200, Data("{\"id\":7,\"folder\":\"customworkouts\",\"name\":\"\(filename)\"}".utf8)) }
      if request.url!.path == "/api/zfiles/list" { return (200, Data("[{\"id\":7,\"name\":\"\(filename)\"},{\"id\":8,\"name\":\"workouts.files\"}]".utf8)) }
      if request.url!.path == "/api/zfiles/8/download" { return (200, Data("<unknown-manifest/>".utf8)) }
      return (200, Data(self.xml.utf8))
    }
    do {
      try await client.upload(name: filename, xml: xml, token: "secret")
      XCTFail("Must preserve an unrecognized directory")
    } catch { XCTAssertEqual((error as? ZwiftFailure)?.reference, "zwift-manifest-format") }
    XCTAssertEqual(StubProtocol.requests.filter { $0.httpMethod == "POST" }.count, 1)
  }
}
