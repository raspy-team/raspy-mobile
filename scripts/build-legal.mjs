// 빌드 뒤 약관 원문(src/content/legal.js)으로 공개 페이지 /privacy, /terms를 만든다.
// 앱은 자바스크립트가 화면을 그려서, 스토어·Google 심사 봇이 읽을 수 있는 정적 HTML이 따로 필요하다
import { writeFileSync } from 'node:fs'
import { TERMS, PRIVACY_EN, ACCOUNT_DELETION } from '../src/content/legal.js'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const doc = (id) => TERMS.find((t) => t.id === id)

function page(title, sections) {
  const body = sections
    .map(([h, text]) => `${h === title ? '' : `<h2>${esc(h)}</h2>\n`}<div class="text">${esc(text.trim())}</div>`)
    .join('\n')
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Match</title>
<link rel="icon" href="/favicon.svg">
<style>
  body { margin: 0; font: 15px/1.7 -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; color: #111; background: #fff; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  h2 { font-size: 18px; margin: 32px 0 8px; }
  .text { white-space: pre-wrap; }
  nav a { color: inherit; margin-right: 16px; }
  @media (prefers-color-scheme: dark) { body { color: #eee; background: #111; } }
</style>
</head>
<body>
<main>
<nav><a href="/">Match</a><a href="/privacy">개인정보 처리방침</a><a href="/terms">이용약관</a><a href="/account-deletion">계정 삭제</a></nav>
<h1>${esc(title)}</h1>
${body}
</main>
</body>
</html>
`
}

const privacy = doc('privacy')
writeFileSync('dist/privacy.html', page(privacy.title, [[privacy.title, privacy.body], ['Privacy Policy (English summary)', PRIVACY_EN]]))
const eula = doc('eula')
writeFileSync('dist/terms.html', page(eula.title, [[eula.title, eula.body], [doc('notice').title, doc('notice').body]]))
// 앱 없이 계정 삭제 요청 (Play 데이터 보안의 삭제 웹 주소)
writeFileSync('dist/account-deletion.html', page(ACCOUNT_DELETION.title, [[ACCOUNT_DELETION.title, ACCOUNT_DELETION.body]]))
console.log('legal pages: dist/privacy.html, dist/terms.html, dist/account-deletion.html')
