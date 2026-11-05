package me.matchapp.kakao;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kakao.sdk.common.KakaoSdk;
import com.kakao.sdk.common.model.ClientError;
import com.kakao.sdk.common.model.ClientErrorCause;
import com.kakao.sdk.user.UserApiClient;

/**
 * 카카오톡 앱으로 로그인한다. 카카오톡이 없으면 카카오계정(웹) 로그인.
 * 앱 키는 앱 리소스 kakao_native_key(앱 build.gradle이 ~/.config/match/kakao_native_key에서 넣는다).
 * 키가 비면 login은 "unavailable"로 실패하고 웹(InitView)은 웹 로그인으로 간다
 */
@CapacitorPlugin(name = "MatchKakao")
public class MatchKakaoPlugin extends Plugin {

    private boolean ready = false;

    @Override
    public void load() {
        int id = getContext().getResources().getIdentifier("kakao_native_key", "string", getContext().getPackageName());
        String key = id == 0 ? "" : getContext().getString(id);
        if (key.length() != 32) return;
        KakaoSdk.init(getContext(), key);
        ready = true;
    }

    @PluginMethod
    public void login(PluginCall call) {
        if (!ready || getActivity() == null) {
            call.reject("unavailable");
            return;
        }
        getActivity().runOnUiThread(() -> {
            UserApiClient client = UserApiClient.getInstance();
            kotlin.jvm.functions.Function2<com.kakao.sdk.auth.model.OAuthToken, Throwable, kotlin.Unit> done = (token, error) -> {
                if (token != null) {
                    JSObject ret = new JSObject();
                    ret.put("accessToken", token.getAccessToken());
                    call.resolve(ret);
                } else if (error instanceof ClientError && ((ClientError) error).getReason() == ClientErrorCause.Cancelled) {
                    call.reject("cancel");
                } else {
                    call.reject(error != null && error.getMessage() != null ? error.getMessage() : "failed");
                }
                return kotlin.Unit.INSTANCE;
            };
            if (client.isKakaoTalkLoginAvailable(getActivity())) {
                // 카카오톡에 로그인돼 있지 않은 등으로 실패하면 카카오계정 로그인으로 (취소는 그대로 끝)
                client.loginWithKakaoTalk(getActivity(), (token, error) -> {
                    boolean cancelled = error instanceof ClientError && ((ClientError) error).getReason() == ClientErrorCause.Cancelled;
                    if (token == null && error != null && !cancelled) client.loginWithKakaoAccount(getActivity(), done);
                    else done.invoke(token, error);
                    return kotlin.Unit.INSTANCE;
                });
            } else {
                client.loginWithKakaoAccount(getActivity(), done);
            }
        });
    }
}
