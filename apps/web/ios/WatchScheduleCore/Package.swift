// swift-tools-version: 5.9
import PackageDescription

// The core is Foundation-only so it can be tested on Linux and in CI.
// WorkoutKit itself is bound at runtime in the app target (iOS 17+), while
// this package stays linkable by the current iOS 15 deployment target.
let package = Package(
    name: "WatchScheduleCore",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
    ],
    products: [
        .library(name: "WatchScheduleCore", targets: ["WatchScheduleCore"]),
    ],
    targets: [
        .target(name: "WatchScheduleCore"),
        .testTarget(
            name: "WatchScheduleCoreTests",
            dependencies: ["WatchScheduleCore"]
        ),
    ]
)
