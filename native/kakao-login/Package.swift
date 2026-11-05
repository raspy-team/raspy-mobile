// swift-tools-version: 5.9
import PackageDescription

// 카카오톡 로그인 플러그인 (raspy-mobile 안의 로컬 패키지). cap sync가 CapApp-SPM에 넣는다
let package = Package(
    name: "MatchKakaoLogin",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "MatchKakaoLogin", targets: ["MatchKakaoPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/kakao/kakao-ios-sdk.git", from: "2.30.0")
    ],
    targets: [
        .target(
            name: "MatchKakaoPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKUser", package: "kakao-ios-sdk")
            ],
            path: "ios/Sources/MatchKakaoPlugin")
    ]
)
