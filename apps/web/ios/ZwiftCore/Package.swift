// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "ZwiftCore", platforms: [.iOS(.v15), .macOS(.v13)], targets: [
  .target(name: "ZwiftCore"),
  .testTarget(name: "ZwiftCoreTests", dependencies: ["ZwiftCore"]),
])
