// swift-tools-version: 5.9
import PackageDescription

// 인스타 스토리로 보내기 플러그인 (raspy-mobile 안의 로컬 패키지). cap sync가 CapApp-SPM에 넣는다
let package = Package(
    name: "MatchInstagramStories",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "MatchInstagramStories", targets: ["MatchInstagramPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "MatchInstagramPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/MatchInstagramPlugin")
    ]
)
