// src/native-timer-polyfill.js

export function installNativeTimerPolyfill() {
  // AndroidBridge가 없는 웹 환경에선 아무것도 하지 않음
  if (!window.AndroidBridge) return;

  // 1) 콜백 저장소
  window.__callbacks = {};

  // 2) JS → Native 호출로 register
  window.__wrapCallback = function(cb) {
    const id = `${Date.now()}_${Math.random()}`;
    window.__callbacks[id] = cb;
    return id;
  };

  // 3) Native → JS 호출 엔트리
  window.__timerCallback = function(id) {
    const fn = window.__callbacks[id];
    if (typeof fn === 'function') fn();
  };

  // 4) 글로벌 타이머 덮어쓰기
  window.setTimeout = function(cb, delay) {
    const ref = window.__wrapCallback(cb);
    return window.AndroidBridge.nativeSetTimeout(ref, delay);
  };
  window.clearTimeout = function(id) {
    window.AndroidBridge.nativeClearTimeout(id);
    delete window.__callbacks[id];
  };
  window.setInterval = function(cb, delay) {
    const ref = window.__wrapCallback(cb);
    return window.AndroidBridge.nativeSetInterval(ref, delay);
  };
  window.clearInterval = function(id) {
    window.AndroidBridge.nativeClearInterval(id);
    delete window.__callbacks[id];
  };
}
