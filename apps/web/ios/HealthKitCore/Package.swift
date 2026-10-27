// swift-tools-version: 5.9
import PackageDescription

let package = Package(
  name: "HealthKitCore",
  platforms: [.iOS(.v15), .macOS(.v13)],
  products: [.library(name: "HealthKitCore", targets: ["HealthKitCore"])],
  targets: [
    .target(name: "HealthKitCore"),
    .testTarget(name: "HealthKitCoreTests", dependencies: ["HealthKitCore"]),
  ]
)
