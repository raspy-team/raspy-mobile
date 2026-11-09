package me.matchapp.instagram;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;

/**
 * 인스타 스토리 편집기를 바로 연다 (인스타 공식 '스토리로 공유', developers.facebook.com/docs/instagram-platform/sharing-to-stories).
 * 스포티파이처럼 배경(색 둘 또는 그림)과 움직이는 스티커를 따로 넘긴다. 페이스북 앱 ID(source_application)는 웹이 넘긴다.
 * 그림은 앱의 캐시에 쓰고 FileProvider(앱 매니페스트의 ${applicationId}.fileprovider, cache-path)로 인스타에 읽기 권한을 준다
 */
@CapacitorPlugin(name = "MatchInstagram")
public class MatchInstagramPlugin extends Plugin {

    private static final String INSTAGRAM = "com.instagram.android";
    private static final String ACTION = "com.instagram.share.ADD_TO_STORY";

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        Activity a = getActivity();
        ret.put("available", a != null && a.getPackageManager().resolveActivity(new Intent(ACTION).setType("image/png"), 0) != null);
        call.resolve(ret);
    }

    /** appId · sticker(PNG base64) · background(PNG base64, 없으면 색) · topColor · bottomColor */
    @PluginMethod
    public void shareToStory(PluginCall call) {
        Activity a = getActivity();
        String appId = call.getString("appId");
        if (a == null || appId == null || appId.isEmpty()) {
            call.reject("unavailable");
            return;
        }
        try {
            Intent intent = new Intent(ACTION);
            intent.putExtra("source_application", appId);
            String bg = call.getString("background");
            if (bg != null && !bg.isEmpty()) {
                intent.setDataAndType(write(bg, "ig-background.png"), "image/png");
            } else {
                intent.setType("image/png");
            }
            String sticker = call.getString("sticker");
            if (sticker != null && !sticker.isEmpty()) {
                Uri s = write(sticker, "ig-sticker.png");
                intent.putExtra("interactive_asset_uri", s);
                a.grantUriPermission(INSTAGRAM, s, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
            intent.putExtra("top_background_color", call.getString("topColor", "#121214"));
            intent.putExtra("bottom_background_color", call.getString("bottomColor", "#121214"));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (a.getPackageManager().resolveActivity(intent, 0) == null) {
                call.reject("not_installed");
                return;
            }
            a.runOnUiThread(() -> {
                try {
                    a.startActivity(intent);
                    call.resolve();
                } catch (Exception e) {
                    call.reject(e.getMessage() != null ? e.getMessage() : "failed");
                }
            });
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "failed");
        }
    }

    /** data:image/png;base64,... 또는 base64만 → 캐시 파일 → 인스타가 읽을 content:// 주소 */
    private Uri write(String data, String name) throws Exception {
        int comma = data.indexOf(',');
        byte[] bytes = Base64.decode(comma >= 0 ? data.substring(comma + 1) : data, Base64.DEFAULT);
        File dir = new File(getContext().getCacheDir(), "instagram");
        if (!dir.exists() && !dir.mkdirs()) throw new Exception("cache");
        File f = new File(dir, name);
        try (FileOutputStream out = new FileOutputStream(f)) {
            out.write(bytes);
        }
        return FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
    }
}
