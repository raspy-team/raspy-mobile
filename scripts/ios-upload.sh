#!/bin/zsh
# iOS 앱을 Archive해 App Store Connect(TestFlight)에 올린다. Xcode에 개발자 계정이 로그인돼 있어야 한다.
# 쓰는 법: scripts/ios-upload.sh [export|upload]   (기본 upload. export는 IPA만 만든다)
# 카카오 네이티브 앱 키는 리포 밖 ~/.config/match/kakao_native_key에서 넣는다 (없으면 앱의 카카오 로그인이 웹 로그인으로 간다)
#
# 왜 이렇게 하나: 팀에 등록된 기기가 없으면 자동 서명 Archive가 개발용 프로필을 못 만들어 실패한다.
# 그래서 서명 없이 Archive하고, 앱에 entitlements(푸시·Apple 로그인)를 임시 서명으로 붙인 뒤,
# 내보낼 때 Xcode가 배포 인증서·App Store 프로필로 다시 서명하게 한다 (aps-environment는 production으로 바뀐다).
set -e
MODE=${1:-upload}
TEAM=RXHT6R8P4K
ROOT=${0:A:h:h}
OUT=$(mktemp -d)
cd "$ROOT"
npx cap sync ios
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$OUT/Match.xcarchive" -derivedDataPath "$OUT/dd" archive DEVELOPMENT_TEAM=$TEAM CODE_SIGNING_ALLOWED=NO -quiet \
  KAKAO_NATIVE_KEY="$(cat ~/.config/match/kakao_native_key 2>/dev/null)"
APP="$OUT/Match.xcarchive/Products/Applications/App.app"
for f in "$APP"/Frameworks/*.framework(N); do codesign -f -s - "$f"; done
codesign -f -s - --entitlements App/App.entitlements "$APP"
cat > "$OUT/opts.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>teamID</key><string>$TEAM</string>
<key>signingStyle</key><string>automatic</string>
<key>destination</key><string>$MODE</string>
<key>uploadSymbols</key><true/>
</dict></plist>
PL
xcodebuild -exportArchive -archivePath "$OUT/Match.xcarchive" -exportPath "$OUT/export" -exportOptionsPlist "$OUT/opts.plist" -allowProvisioningUpdates
echo "끝: $OUT/export"
