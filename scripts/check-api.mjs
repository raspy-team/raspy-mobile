// 프론트가 부르는 API 주소·메서드가 백엔드(OpenAPI 문서)에 실제로 있는지 검사한다.
// 없는 주소가 하나라도 있으면 실패해서 빌드(배포)를 막는다. 문서는 `npm run api:sync`로 갱신한다.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const spec = JSON.parse(readFileSync('src/api/openapi.json', 'utf8'))
const routes = Object.entries(spec.paths).flatMap(([path, ops]) =>
  Object.keys(ops).map((method) => ({
    method,
    path,
    re: new RegExp('^' + path.replace(/\{[^}]+\}/g, '[^/]+') + '$'),
  })),
)

const files = []
const walk = (dir) =>
  readdirSync(dir).forEach((f) => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(vue|js|ts)$/.test(f)) files.push(p)
  })
walk('src')

const call = /\bapi\.(get|post|put|patch|delete)\(\s*([`'"])(\/api[^`'"]*)\2/g
const problems = []
let count = 0
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(call)) {
    count++
    const method = m[1]
    // 템플릿 변수(${...})는 경로 한 칸으로 보고, 쿼리스트링은 뗀다
    const path = m[3].replace(/\$\{[^}]+\}/g, 'X').split('?')[0].replace(/\/$/, '')
    if (!routes.some((r) => r.method === method && r.re.test(path))) {
      const line = src.slice(0, m.index).split('\n').length
      problems.push(`${relative('.', file)}:${line}  ${method.toUpperCase()} ${m[3]}`)
    }
  }
}

if (problems.length) {
  console.error(`백엔드에 없는 API 호출 ${problems.length}개:\n` + problems.join('\n'))
  process.exit(1)
}
console.log(`API 호출 ${count}개 모두 백엔드 문서와 일치`)
