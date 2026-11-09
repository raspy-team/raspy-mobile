import Foundation
import ActivityKit

/// 경기 중 잠금화면·다이내믹 아일랜드의 점수판 (Live Activity).
/// 앱(App)과 위젯 확장(MatchLiveActivity)이 이 파일을 함께 쓴다. 두 쪽의 모양이 같아야 iOS가 같은 활동으로 본다
@available(iOS 16.1, *)
struct MatchScoreAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// 지금 세트 (1부터)
        var setIndex: Int
        var score1: Int
        var score2: Int
        var sets1: Int
        var sets2: Int
        /// 세트가 진행 중일 때만 점수 버튼을 보인다 (세트가 끝났거나 시작 전이면 앱에서 다음 세트를 연다)
        var canScore: Bool
        /// 세트가 시작된 시각 (잠금화면의 흐르는 시계)
        var setStartedAt: Date?
    }

    var gameId: Int
    /// 규칙 이름 (탁구 3세트)
    var title: String
    /// 점수가 붙는 사람 (팀이면 그 팀 첫 사람)
    var user1Id: Int
    var user2Id: Int
    /// 칸 이름 (팀이면 팀 이름)
    var name1: String
    var name2: String
}
