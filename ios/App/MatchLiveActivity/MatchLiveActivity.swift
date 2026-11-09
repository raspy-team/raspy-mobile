import SwiftUI
import WidgetKit
import ActivityKit
import AppIntents

/// 경기 중 잠금화면·다이내믹 아일랜드 점수판. 앱의 점수판과 같은 흑백 + 볼트 하나
@main
struct MatchLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        MatchScoreLiveActivity()
    }
}

private let volt = Color(red: 210 / 255, green: 1, blue: 77 / 255)
private let ink = Color(red: 18 / 255, green: 18 / 255, blue: 20 / 255)
private let muted = Color(white: 0.66)

struct MatchScoreLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MatchScoreAttributes.self) { context in
            LockScreenScore(context: context)
                .activityBackgroundTint(ink)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let s = context.state
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Side(name: context.attributes.name1, score: s.score1, sets: s.sets1, leading: true)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Side(name: context.attributes.name2, score: s.score2, sets: s.sets2, leading: false)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text("\(s.setIndex)세트").font(.caption).foregroundStyle(muted)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if s.canScore { ScoreButtons(context: context) }
                }
            } compactLeading: {
                Text("\(s.score1)").font(.system(.body, design: .rounded).weight(.semibold)).monospacedDigit()
            } compactTrailing: {
                Text("\(s.score2)").font(.system(.body, design: .rounded).weight(.semibold)).monospacedDigit().foregroundStyle(volt)
            } minimal: {
                Text("\(s.score1):\(s.score2)").font(.caption2.weight(.semibold)).monospacedDigit()
            }
        }
    }
}

/// 잠금화면: 위에 규칙·세트·시계, 가운데 두 사람의 점수, 아래에 사람마다 −1 · +1
struct LockScreenScore: View {
    let context: ActivityViewContext<MatchScoreAttributes>

    var body: some View {
        let s = context.state
        VStack(spacing: 10) {
            HStack {
                Text("\(context.attributes.title) · \(s.setIndex)세트").font(.caption).foregroundStyle(muted).lineLimit(1)
                Spacer()
                if let started = s.setStartedAt, s.canScore {
                    Text(started, style: .timer).font(.caption).monospacedDigit().foregroundStyle(muted)
                }
            }
            HStack(alignment: .center) {
                Side(name: context.attributes.name1, score: s.score1, sets: s.sets1, leading: true)
                Text(":").font(.title).foregroundStyle(muted)
                Side(name: context.attributes.name2, score: s.score2, sets: s.sets2, leading: false)
            }
            if s.canScore {
                ScoreButtons(context: context)
            } else {
                Text("다음 세트는 앱에서 시작해요").font(.caption).foregroundStyle(muted)
            }
        }
        .padding(16)
        .foregroundStyle(.white)
    }
}

/// 한 사람: 이름, 큰 점수, 이긴 세트 수
struct Side: View {
    let name: String
    let score: Int
    let sets: Int
    let leading: Bool

    var body: some View {
        VStack(alignment: leading ? .leading : .trailing, spacing: 2) {
            Text(name).font(.subheadline).lineLimit(1).foregroundStyle(muted)
            Text("\(score)").font(.system(size: 40, weight: .semibold, design: .rounded)).monospacedDigit()
            if sets > 0 { Text("세트 \(sets)").font(.caption2).foregroundStyle(volt) }
        }
        .frame(maxWidth: .infinity, alignment: leading ? .leading : .trailing)
    }
}

/// 사람마다 −1 · +1. 누르면 앱이 뒤에서 서버에 점수를 낸다 (LiveScoreIntent)
struct ScoreButtons: View {
    let context: ActivityViewContext<MatchScoreAttributes>

    var body: some View {
        let a = context.attributes
        HStack(spacing: 8) {
            pair(userId: a.user1Id, name: a.name1)
            pair(userId: a.user2Id, name: a.name2)
        }
    }

    private func pair(userId: Int, name: String) -> some View {
        HStack(spacing: 6) {
            Button(intent: LiveScoreIntent(gameId: context.attributes.gameId, targetUserId: userId, delta: -1)) {
                Image(systemName: "minus").frame(maxWidth: 36, minHeight: 32)
            }
            .buttonStyle(.plain)
            .background(Color(white: 0.18), in: RoundedRectangle(cornerRadius: 10))
            .accessibilityLabel("\(name) 1점 빼기")
            Button(intent: LiveScoreIntent(gameId: context.attributes.gameId, targetUserId: userId, delta: 1)) {
                Text("+1").font(.headline).frame(maxWidth: .infinity, minHeight: 32)
            }
            .buttonStyle(.plain)
            .foregroundStyle(ink)
            .background(volt, in: RoundedRectangle(cornerRadius: 10))
            .accessibilityLabel("\(name) 1점")
        }
    }
}
