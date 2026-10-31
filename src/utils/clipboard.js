// 글자를 클립보드에 복사한다. iOS 앱(웹뷰) → 브라우저 API → 예전 방식 순서로 시도. 성공하면 true
export async function copyText(text) {
  const ios = window.webkit?.messageHandlers?.clipboardCopy
  if (ios) {
    ios.postMessage(text)
    return true
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const input = document.createElement('input')
      input.value = text
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(input)
      return ok
    } catch {
      return false
    }
  }
}
