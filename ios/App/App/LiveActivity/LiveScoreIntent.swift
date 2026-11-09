import Foundation
import ActivityKit
import AppIntents
import Security

/// 잠금화면·다이내믹 아일랜드의 점수 버튼. LiveActivityIntent라 앱과 위젯 확장에 다 넣어 두면 iOS가 **앱 쪽에서** 실행한다
/// (앱이 꺼져 있으면 뒤에서 깨운다). 앱이 뒤에 있으면 웹소켓이 끊겨 있어서, 서버의 일반 요청
/// POST /api/games/{id}/live-score (raspy-api LiveScoreController)로 점수를 내고 돌려받은 점수로 잠금화면을 바꾼다
@available(iOS 17.0, *)
struct LiveScoreIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "점수"
    static var isDiscoverable: Bool = false

    @Parameter(title: "경기") var gameId: Int
    @Parameter(title: "선수") var targetUserId: Int
    @Parameter(title: "점수") var delta: Int

    init() {}

    init(gameId: Int, targetUserId: Int, delta: Int) {
        self.gameId = gameId
        self.targetUserId = targetUserId
        self.delta = delta
    }

    func perform() async throws -> some IntentResult {
        await LiveScoreClient.send(gameId: gameId, targetUserId: targetUserId, delta: delta)
        return .result()
    }
}

/// 점수 요청과 로그인 정보. 로그인 토큰은 웹이 활동을 시작할 때 넘기고 키체인에 둔다 (잠긴 화면에서도 읽히게 '첫 잠금 해제 뒤')
@available(iOS 17.0, *)
enum LiveScoreClient {
    private static let service = "me.matchapp.live-activity"

    static func save(apiBase: String, token: String, fcmToken: String?) {
        set("apiBase", apiBase)
        set("token", token)
        if let f = fcmToken, !f.isEmpty { set("fcm", f) }
    }

    /// 서버에 이 잠금화면 점수판의 푸시 주소를 알린다. 상대 폰이 낸 점수를 서버가 바로 보내 준다 (raspy-api LiveActivityService).
    /// 서버는 경기 동안만 메모리에 두므로, 서버가 다시 켜져도 이어지게 버튼을 누를 때·점수판이 바뀔 때도 다시 알린다 (1분에 한 번)
    static func registerPush(_ activity: Activity<MatchScoreAttributes>, force: Bool = false) async {
        guard let tokenData = activity.pushToken else { return }
        let key = "pushRegisteredAt-\(activity.id)"
        let last = UserDefaults.standard.double(forKey: key)
        if !force && Date().timeIntervalSince1970 - last < 60 { return }
        guard let base = get("apiBase"), let token = get("token"), let fcm = get("fcm"),
              let url = URL(string: "\(base)/api/games/\(activity.attributes.gameId)/live-activity") else { return }
        let push = tokenData.map { String(format: "%02x", $0) }.joined()
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.timeoutInterval = 10
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try? JSONSerialization.data(withJSONObject: [
            "pushToken": push, "fcmToken": fcm,
            "user1Id": activity.attributes.user1Id, "user2Id": activity.attributes.user2Id,
        ])
        if let (_, res) = try? await URLSession.shared.data(for: req), (res as? HTTPURLResponse)?.statusCode == 200 {
            UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: key)
        }
    }

    static func send(gameId: Int, targetUserId: Int, delta: Int) async {
        guard let activity = Activity<MatchScoreAttributes>.activities.first(where: { $0.attributes.gameId == gameId }) else { return }
        var state = activity.content.state
        guard state.canScore else { return }
        let attrs = activity.attributes
        // 누른 즉시 보이게 먼저 바꾸고, 서버가 돌려준 점수로 맞춘다 (상대 폰에서 낸 점수도 여기서 따라온다)
        let mine = targetUserId == attrs.user1Id
        if mine { state.score1 = max(0, state.score1 + delta) } else { state.score2 = max(0, state.score2 + delta) }
        await activity.update(ActivityContent(state: state, staleDate: nil))

        guard let base = get("apiBase"), let token = get("token"),
              let url = URL(string: "\(base)/api/games/\(gameId)/live-score") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.timeoutInterval = 10
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["targetUserId": targetUserId, "setIndex": state.setIndex, "delta": delta])
        guard let (data, res) = try? await URLSession.shared.data(for: req),
              (res as? HTTPURLResponse)?.statusCode == 200,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let scores = json["scores"] as? [String: Any] else {
            // 실패하면 누르기 전으로 되돌린다 (점수판과 어긋나지 않게)
            if mine { state.score1 = max(0, state.score1 - delta) } else { state.score2 = max(0, state.score2 - delta) }
            await activity.update(ActivityContent(state: state, staleDate: nil))
            return
        }
        state.score1 = (scores[String(attrs.user1Id)] as? NSNumber)?.intValue ?? 0
        state.score2 = (scores[String(attrs.user2Id)] as? NSNumber)?.intValue ?? 0
        await activity.update(ActivityContent(state: state, staleDate: nil))
        await registerPush(activity)
    }

    // MARK: 키체인

    private static func set(_ key: String, _ value: String) {
        let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: key]
        SecItemDelete(base as CFDictionary)
        var add = base
        add[kSecValueData as String] = Data(value.utf8)
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(add as CFDictionary, nil)
    }

    private static func get(_ key: String) -> String? {
        let q: [String: Any] = [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service,
                                kSecAttrAccount as String: key, kSecReturnData as String: true, kSecMatchLimit as String: kSecMatchLimitOne]
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return nil }
        return String(data: d, encoding: .utf8)
    }
}
