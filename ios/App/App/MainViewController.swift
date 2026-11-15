import UIKit
import Capacitor

/// 앱 안에 둔 플러그인을 등록한다 (Main.storyboard의 첫 화면). 패키지 플러그인(카카오·인스타·푸시)은 cap sync가 알아서 붙인다
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(MatchLiveActivityPlugin())
        // 화면 왼쪽 끝에서 밀어 뒤로 가기 (아이폰의 버릇). 웹 화면의 기록을 그대로 따라간다 (11/15 고병연: 앱에서 안 됐다. 빌드 8부터)
        webView?.allowsBackForwardNavigationGestures = true
    }
}
