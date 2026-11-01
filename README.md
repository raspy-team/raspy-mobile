# raspy-mobile

매치(Match) 앱 화면. 웹으로도 쓰고, 앱(`android`, `iOS`)은 이 화면을 감싼다.

> 운영: **https://raspy-mobile.vercel.app** (Vercel). `main`에 push하면 자동 배포된다. 백엔드는 [`raspy-api`](https://github.com/raspy-team/raspy-api).

## 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Vue 3, Vue Router |
| 빌드 | Vite (포트 8081) |
| 언어 | JavaScript + TypeScript (새 코드는 TS 권장) |
| 스타일 | Tailwind(색은 직접 만든 잉크·시그널), 서체 Geist·Pretendard·Geist Mono, 아이콘 Lucide, 공통 부품 [`src/components/ui/`](src/components/ui/README.md) |
| 실시간 | STOMP WebSocket |
| 에러 추적 | Sentry (`VITE_SENTRY_DSN`이 있을 때만) |

## 실행

```bash
cp .env.example .env.local   # 처음 한 번. 키는 비워도 실행된다
npm ci
npm run serve:dev            # http://localhost:8081, 백엔드는 http://localhost:8080
npm run build                # API 주소 검사 → 타입 검사 → 운영 빌드
npm run api:sync             # 로컬 백엔드에서 API 문서·타입을 다시 받는다 (API가 바뀌면)
```

- 화면 부품 모음: http://localhost:8081/dev/ui (개발 서버에서만)
- 로컬 테스트 계정: `12341234` / `12341234`

## 폴더

| 경로 | 내용 |
|---|---|
| `src/views/` | 화면. 주소는 `src/router/router.js` |
| `src/components/ui/` | 공통 부품(버튼·시트·카드 ...)과 디자인 규칙 |
| `src/api/` | `client.ts`(타입 있는 호출), `api.js`(기존 호출), `openapi.json`·`schema.d.ts`(백엔드에서 받은 문서) |
| `src/stores/` | 앱 전체 상태 (알림함, 서버 연결) |
| `src/websocket/` | 내 채널(변경 신호)과 경기·채팅 소켓 |
| `src/utils/` | 진동, 내 id(`me.ts`), 포맷 등 |
| `src/content/` | 약관·개인정보처리방침 문구 |
| `scripts/` | API 주소 검사(`check-api.mjs`), 문서 받기(`sync-api.mjs`) |

## 규칙

- **새 코드는 API를 `src/api/client.ts`의 `GET`/`POST`로 부른다.** 주소·변수·본문이 타입으로 검사된다. 기존 화면의 `api.js` 호출은 일부러 옮기지 않는다
- 빌드는 백엔드에 없는 API를 부르면 실패한다 (`scripts/check-api.mjs`)
- 서버에 반복해서 묻지(폴링) 않는다. 변경 신호는 `src/websocket/userChannel.js`의 `refreshOnChange`로 받는다
- 화면은 `src/components/ui/`의 부품으로 만든다. 흑백이 기본이고 색은 시그널 하나뿐이다. 규칙은 [`src/components/ui/README.md`](src/components/ui/README.md)
- 말투는 "~해요"

## 환경변수

| 이름 | 용도 |
|---|---|
| `VUE_APP_ENV` | `dev` 또는 `prod` |
| `VUE_APP_API_URL` | 백엔드 주소. 비우면 dev는 localhost, prod는 `https://raspy-api.fly.dev` |
| `VUE_APP_GOOGLE_PLACES_API_KEY` | 장소 자동완성 (비워도 실행됨) |
| `VITE_SENTRY_DSN` | 에러 추적 (`.env.production`, 공개돼도 되는 값) |
