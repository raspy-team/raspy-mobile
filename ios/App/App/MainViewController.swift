import UIKit
import Capacitor

/// 앱 안에 둔 플러그인을 등록한다 (Main.storyboard의 첫 화면). 패키지 플러그인(카카오·인스타·푸시)은 cap sync가 알아서 붙인다
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MatchLiveActivityPlugin())
    }
}
