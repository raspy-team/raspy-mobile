import Foundation
import Capacitor
import KakaoSDKCommon
import KakaoSDKAuth
import KakaoSDKUser

/// 카카오톡 앱으로 로그인한다. 카카오톡이 없으면 카카오계정(웹) 로그인 창을 띄운다.
/// 앱 키는 Info.plist의 KAKAO_APP_KEY(빌드 설정 KAKAO_NATIVE_KEY, ~/.config/match/kakao_native_key)에서 읽는다.
/// 키가 비면 login은 "unavailable"로 실패하고, 웹(InitView)은 예전처럼 웹 로그인으로 간다
@objc(MatchKakaoPlugin)
public class MatchKakaoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MatchKakaoPlugin"
    public let jsName = "MatchKakao"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise)
    ]
    private var ready = false

    override public func load() {
        let key = (Bundle.main.object(forInfoDictionaryKey: "KAKAO_APP_KEY") as? String) ?? ""
        // 빌드 설정이 비면 "$(KAKAO_NATIVE_KEY)"가 그대로 남거나 빈 문자열이 된다
        guard key.count == 32 else { return }
        KakaoSDK.initSDK(appKey: key)
        ready = true
        // 카카오톡이 로그인을 마치고 kakao{앱키}://oauth 로 돌아오면 SDK에 넘긴다 (SceneDelegateProxy가 알린다)
        NotificationCenter.default.addObserver(self, selector: #selector(handleOpenUrl(_:)),
                                               name: Notification.Name.capacitorOpenURL, object: nil)
    }

    @objc func handleOpenUrl(_ notification: Notification) {
        guard let object = notification.object as? [String: Any], let url = object["url"] as? URL else { return }
        DispatchQueue.main.async {
            if AuthApi.isKakaoTalkLoginUrl(url) {
                _ = AuthController.handleOpenUrl(url: url)
            }
        }
    }

    @objc func login(_ call: CAPPluginCall) {
        guard ready else {
            call.reject("unavailable")
            return
        }
        DispatchQueue.main.async {
            let done: (OAuthToken?, Error?) -> Void = { token, error in
                if let token = token {
                    call.resolve(["accessToken": token.accessToken])
                } else if let sdkError = error as? SdkError, sdkError.isClientFailed,
                          case .Cancelled = sdkError.getClientError().reason {
                    call.reject("cancel")
                } else {
                    call.reject(error?.localizedDescription ?? "failed")
                }
            }
            if UserApi.isKakaoTalkLoginAvailable() {
                // 카카오톡에 로그인돼 있지 않은 등으로 실패하면 카카오계정 로그인으로 (취소는 그대로 끝)
                UserApi.shared.loginWithKakaoTalk { token, error in
                    if token == nil, let sdkError = error as? SdkError,
                       !(sdkError.isClientFailed && { if case .Cancelled = sdkError.getClientError().reason { return true }; return false }()) {
                        UserApi.shared.loginWithKakaoAccount(completion: done)
                    } else {
                        done(token, error)
                    }
                }
            } else {
                UserApi.shared.loginWithKakaoAccount(completion: done)
            }
        }
    }
}
