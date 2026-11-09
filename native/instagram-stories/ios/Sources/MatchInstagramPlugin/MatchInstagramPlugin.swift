import Foundation
import UIKit
import Capacitor

/// 인스타 스토리 편집기를 바로 연다 (인스타 공식 '스토리로 공유', developers.facebook.com/docs/instagram-platform/sharing-to-stories).
/// 스포티파이처럼 배경(색 둘 또는 그림)과 움직이는 스티커를 붙여넣기 칸(UIPasteboard)에 넣고 instagram-stories:// 를 연다.
/// 페이스북 앱 ID(source_application)는 웹이 넘긴다. Info.plist LSApplicationQueriesSchemes에 instagram-stories가 있어야 canOpenURL이 된다
@objc(MatchInstagramPlugin)
public class MatchInstagramPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MatchInstagramPlugin"
    public let jsName = "MatchInstagram"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "shareToStory", returnType: CAPPluginReturnPromise)
    ]

    @objc func isAvailable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let ok = URL(string: "instagram-stories://share").map { UIApplication.shared.canOpenURL($0) } ?? false
            call.resolve(["available": ok])
        }
    }

    /// appId · sticker(PNG base64) · background(PNG base64, 없으면 색) · topColor · bottomColor · link(붙여넣기 칸에)
    @objc func shareToStory(_ call: CAPPluginCall) {
        guard let appId = call.getString("appId"), !appId.isEmpty,
              let url = URL(string: "instagram-stories://share?source_application=\(appId)") else {
            call.reject("unavailable")
            return
        }
        DispatchQueue.main.async {
            guard UIApplication.shared.canOpenURL(url) else {
                call.reject("not_installed")
                return
            }
            var item: [String: Any] = [
                "com.instagram.sharedSticker.backgroundTopColor": call.getString("topColor") ?? "#121214",
                "com.instagram.sharedSticker.backgroundBottomColor": call.getString("bottomColor") ?? "#121214"
            ]
            if let s = MatchInstagramPlugin.png(call.getString("sticker")) {
                item["com.instagram.sharedSticker.stickerImage"] = s
            }
            if let b = MatchInstagramPlugin.png(call.getString("background")) {
                item["com.instagram.sharedSticker.backgroundImage"] = b
            }
            // 스티커에 링크를 붙이는 공개 방법은 없다. 같은 붙여넣기 칸에 링크도 넣어 인스타 '링크' 스티커에 붙여 넣게 한다 (Strava 방식)
            if let link = call.getString("link"), !link.isEmpty {
                item["public.utf8-plain-text"] = link
            }
            UIPasteboard.general.setItems([item], options: [.expirationDate: Date().addingTimeInterval(60 * 5)])
            UIApplication.shared.open(url, options: [:]) { ok in
                if ok { call.resolve() } else { call.reject("failed") }
            }
        }
    }

    /// data:image/png;base64,... 또는 base64만 → PNG 바이트
    private static func png(_ data: String?) -> Data? {
        guard let data = data, !data.isEmpty else { return nil }
        let raw = data.components(separatedBy: ",").last ?? data
        return Data(base64Encoded: raw)
    }
}
