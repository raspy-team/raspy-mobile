import Foundation
import ActivityKit
import Capacitor

/// 경기 중 잠금화면 점수판(Live Activity)을 웹 점수판(GamePlayView)이 켜고, 바꾸고, 끈다.
/// 활동의 모양(MatchScoreAttributes)과 버튼(LiveScoreIntent)이 위젯 확장과 같은 파일이라 이 플러그인은 앱 안에 둔다
/// (패키지로 빼면 확장과 모양이 갈라진다). MainViewController가 등록한다
@objc(MatchLiveActivityPlugin)
public class MatchLiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MatchLiveActivityPlugin"
    public let jsName = "MatchLiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 17.0, *) {
            call.resolve(["available": ActivityAuthorizationInfo().areActivitiesEnabled])
        } else {
            call.resolve(["available": false])
        }
    }

    /// gameId · title · user1Id · user2Id · name1 · name2 · apiBase · token · 상태(setIndex·score1·score2·sets1·sets2·canScore·setStartedAt ms)
    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 17.0, *) else { return call.reject("unavailable") }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return call.reject("disabled") }
        guard let gameId = call.getInt("gameId"), let u1 = call.getInt("user1Id"), let u2 = call.getInt("user2Id") else {
            return call.reject("bad_args")
        }
        if let base = call.getString("apiBase"), let token = call.getString("token") {
            LiveScoreClient.save(apiBase: base, token: token, fcmToken: call.getString("fcmToken"))
        }
        let attrs = MatchScoreAttributes(gameId: gameId, title: call.getString("title") ?? "경기", user1Id: u1, user2Id: u2,
                                         name1: call.getString("name1") ?? "", name2: call.getString("name2") ?? "")
        let state = Self.state(call)
        Task {
            // 같은 경기가 이미 떠 있으면 그것을 바꾼다 (화면을 다시 열 때마다 새로 띄우지 않게)
            if let existing = Activity<MatchScoreAttributes>.activities.first(where: { $0.attributes.gameId == gameId }) {
                await existing.update(ActivityContent(state: state, staleDate: nil))
                Self.watchPushToken(existing)
                return call.resolve(["id": existing.id])
            }
            // 다른 경기의 것은 닫는다 (한 번에 한 경기)
            for a in Activity<MatchScoreAttributes>.activities { await a.end(nil, dismissalPolicy: .immediate) }
            do {
                // pushType .token: 서버가 상대 폰의 점수를 이 점수판에 바로 보낼 수 있게 (FCM Live Activity 푸시)
                let a = try Activity.request(attributes: attrs, content: ActivityContent(state: state, staleDate: nil), pushType: .token)
                Self.watchPushToken(a)
                call.resolve(["id": a.id])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 17.0, *), let gameId = call.getInt("gameId") else { return call.resolve() }
        let state = Self.state(call)
        Task {
            for a in Activity<MatchScoreAttributes>.activities where a.attributes.gameId == gameId {
                await a.update(ActivityContent(state: state, staleDate: nil))
                await LiveScoreClient.registerPush(a)
            }
            call.resolve()
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 17.0, *) else { return call.resolve() }
        let gameId = call.getInt("gameId")
        Task {
            for a in Activity<MatchScoreAttributes>.activities where gameId == nil || a.attributes.gameId == gameId {
                await a.end(nil, dismissalPolicy: .immediate)
            }
            call.resolve()
        }
    }

    /// 활동마다 한 번: 푸시 주소가 나오거나 바뀌면 서버에 알린다
    private static var watching = Set<String>()
    @available(iOS 17.0, *)
    private static func watchPushToken(_ activity: Activity<MatchScoreAttributes>) {
        guard !watching.contains(activity.id) else { return }
        watching.insert(activity.id)
        Task {
            for await _ in activity.pushTokenUpdates {
                await LiveScoreClient.registerPush(activity, force: true)
            }
        }
    }

    @available(iOS 17.0, *)
    private static func state(_ call: CAPPluginCall) -> MatchScoreAttributes.ContentState {
        let startedMs = call.getDouble("setStartedAt")
        return MatchScoreAttributes.ContentState(
            setIndex: call.getInt("setIndex") ?? 1,
            score1: call.getInt("score1") ?? 0,
            score2: call.getInt("score2") ?? 0,
            sets1: call.getInt("sets1") ?? 0,
            sets2: call.getInt("sets2") ?? 0,
            canScore: call.getBool("canScore") ?? false,
            setStartedAt: startedMs.map { Date(timeIntervalSince1970: $0 / 1000) }
        )
    }
}
