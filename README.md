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

## 앱 (Capacitor)

> 앱은 운영 웹 **https://matchapp.me** 를 그대로 띄운다 (`capacitor.config.ts`의 `server.url`). 화면을 고치면 앱도 스토어 심사 없이 바로 바뀐다. 앱을 다시 올려야 하는 건 앱 쪽(플러그인·아이콘·권한)을 바꿀 때뿐이다

| 항목 | 값 |
|---|---|
| 패키지 | `com.songostudio.match` (Android·iOS 같음) |
| 앱인지 알아보기 | User-Agent에 `raspy-android` / `raspy-ios` (`src/utils/nativeBridge.js`) |
| 서명 키 | 리포 밖 `~/.config/match/android-upload.properties`와 `match-upload.jks`. **잃으면 구글에 키 재설정을 요청해야 하니 따로 백업한다** |
| 아이콘·시작 화면 | `assets/`의 원본에서 만든다 (원본은 `public/favicon.svg`) |

```bash
# 처음 한 번 (맥): Java 21, 안드로이드 SDK
brew install openjdk@21 && brew install --cask android-commandlinetools
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

npx cap sync                                  # 플러그인·설정을 android/ios에 반영
cd android && ./gradlew assembleDebug         # 시험용 APK: app/build/outputs/apk/debug/
cd android && ./gradlew bundleRelease         # 스토어용 AAB(서명됨): app/build/outputs/bundle/release/
npx capacitor-assets generate --android --ios # 아이콘·시작 화면 다시 만들기 (assets/를 바꿨을 때)
```

- 스토어에 올릴 때마다 `android/app/build.gradle`의 `versionCode`를 1씩 올린다
- **빌드 전에 꼭 `npx cap sync`**: 페이스북 SDK를 빼는 설정(`capacitor.config.ts`의 `SocialLogin.providers`)은 sync 때 `node_modules` 안 플러그인에 적힌다. `npm install` 뒤 sync 없이 빌드하면 페이스북 SDK와 광고 ID 권한(AD_ID)이 다시 들어간다. 푸시에는 `~/.config/match/google-services.json`을 `android/app/`에 복사해 둔다
- iOS는 Xcode가 있어야 빌드된다 (`npx cap open ios`). TestFlight에 올리기는 `scripts/ios-upload.sh` 한 줄이다(Xcode에 개발자 계정 로그인 필요). 올릴 때마다 `ios/App/App.xcodeproj`의 `CURRENT_PROJECT_VERSION`(빌드 번호)을 1씩 올린다. 푸시는 `~/.config/match/GoogleService-Info.plist`가 있어야 등록된다(빌드 때 자동 복사). 사용자 할 일은 워크스페이스 `docs/store/ios.md`

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
