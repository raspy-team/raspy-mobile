// 타입 검사를 받지 않는 화면(<script setup>에 lang="ts"가 없는 .vue, .js)에서 정의하지 않은 이름을 쓰는 곳을 찾는다.
// 빌드의 vue-tsc는 TS 파일만 본다. 그래서 들여오지 않은 함수를 부르는 실수(11/16 ResultEntrySheet의 showToast)가
// 그 줄이 실제로 돌 때까지 드러나지 않았다. JS까지 타입 검사를 돌리고 '이름을 찾을 수 없음'(TS2304·TS2552)만 추린다.
//   npm run check:names        (1분쯤 걸린다. 빌드에는 넣지 않았다)
import { spawnSync } from 'node:child_process'

const r = spawnSync('npx', ['vue-tsc', '--noEmit', '--allowJs', '--checkJs'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const lines = (r.stdout + r.stderr).split('\n').filter((l) => /error TS(2304|2552):/.test(l))
if (lines.length) {
  console.error(`정의하지 않은 이름 ${lines.length}곳:`)
  for (const l of lines) console.error('  ' + l)
  process.exit(1)
}
console.log('정의하지 않은 이름 없음 (JS 화면 포함)')
