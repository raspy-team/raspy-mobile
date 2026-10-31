// 백엔드 OpenAPI 문서를 받아 src/api/openapi.json과 schema.d.ts를 갱신한다.
// 로컬 백엔드(dev)를 띄운 뒤 실행한다. 운영 서버는 문서를 공개하지 않는다
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const url = process.env.API_DOCS_URL || 'http://localhost:8080/v3/api-docs'
const res = await fetch(url)
if (!res.ok) throw new Error(`${url} → ${res.status}`)
const spec = await res.json()
delete spec.servers // 받은 곳 주소는 빼서 로컬·운영 어디서 받아도 같은 파일이 되게
writeFileSync('src/api/openapi.json', JSON.stringify(spec, null, 2) + '\n')
execSync('npx openapi-typescript src/api/openapi.json -o src/api/schema.d.ts', { stdio: 'inherit' })
console.log('API 문서와 타입을 갱신했다:', url)
