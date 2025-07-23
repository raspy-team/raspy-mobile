<template>
  <div v-if="isLoading" class="loading-overlay">
  <div class="loader">
    <span class="loading-text">로딩중...</span>
  </div>
</div>


  <div class=" flex flex-col justify-between items-center bg-white px-6">
    <div></div>
    <div class="text-center flex-2 mt-20 fixed left-0 w-full text-center top-[30dvh]">
      <span class="raspy mb-4">Match</span>
      <p class="tagline mb-0">
        즐기고 경쟁하는, <span class="text-[var(--point-color)] font-bold">스포츠 플랫폼</span>
      </p>
    </div>
    <div class="oauth-container flex flex-col gap-2 pb-10 w-full max-w-sm">
      <!-- Google Login -->
      <!-- <button class="oauth-btn google" @click="loginWith('google')">
        <div class="icon-text">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M12 11.99v2.98h4.21c-.18 1.12-.83 2.07-1.78 2.71v2.26h2.88c1.69-1.56 2.67-3.86 2.67-6.61 0-.55-.05-1.09-.14-1.61H12z"/>
            <path fill="#34A853" d="M12 21c2.43 0 4.47-.8 5.96-2.15l-2.88-2.26c-.8.54-1.81.86-3.08.86-2.37 0-4.38-1.6-5.1-3.76H3.9v2.36C5.39 18.97 8.45 21 12 21z"/>
            <path fill="#FBBC05" d="M6.9 13.69a5.997 5.997 0 0 1 0-3.38V7.95H3.9a9.003 9.003 0 0 0 0 8.1l3-2.36z"/>
            <path fill="#EA4335" d="M12 6.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C16.46 3.83 14.42 3 12 3 8.45 3 5.39 5.03 3.9 7.95l3 2.36C7.62 8.18 9.63 6.58 12 6.58z"/>
          </svg>
          <span>Google로 시작하기</span>
        </div>
      </button> -->

      <div class="fixed  w-[90%] bottom-10 left-[5%]">
      <!-- Kakao Login -->
      <button class="oauth-btn kakao" @click="loginWith('kakao')">
        <div class="icon-text">
          <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" width="24" height="24" alt="Kakao">
          <span>Kakao로 시작하기</span>
        </div>
      </button>

      <!-- Apple Login (only iOS app) -->
      <button v-if="isIosApp" class="oauth-btn apple" @click="loginWith('apple')">
        <div class="icon-text">
          <i class="fab fa-apple"></i>
          <span>Apple로 시작하기</span>
        </div>
      </button>
      <!-- Group Login -->
      <button class="oauth-btn bg-orange-500 text-white" @click="loginGroup">
        <div class="icon-text">
          <i class="fas fa-building w-6"></i>
          <span>그룹 계정으로 시작하기</span>
        </div>
      </button>

<div class="mt-5 text-xs text-gray-600 text-left">
    본 서비스 이용 시
    <span
      class="text-blue-600 underline cursor-pointer"
      @click="showTermsModal = true"
    >
      개인정보 이용약관
    </span>
    및
    <span
      class="text-blue-600 underline cursor-pointer"
      @click="showPrivacyModal = true"
    >
      개인정보처리방침
    </span>
    에 동의하게 됩니다.

    <!-- 이용약관 모달 -->
    <div
      v-if="showTermsModal"
      class="fixed text-left inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="showTermsModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6">
        <div class="font-bold mb-2">이용약관</div>
<div class="max-h-64 overflow-auto text-sm space-y-2">
  <b>Match 서비스 이용약관</b>
  <br><br>
  <b>제1조 (목적)</b>
  <br>
  본 약관은 주식회사 래스피(이하 “회사”)가 제공하는 Match 서비스(이하 “서비스”)의 이용과 관련하여 회사와 이용자 간의 권리, 의무, 책임, 기타 필요한 사항을 규정함을 목적으로 합니다.
  <br><br>

  <b>제2조 (정의)</b>
  <br>
  1. “회원”이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.<br>
  2. “콘텐츠”란 서비스 내에 게시 또는 업로드된 텍스트, 사진, 이미지 등 일체의 정보를 의미합니다.
  <br><br>

  <b>제3조 (이용계약의 체결 및 탈퇴)</b>
  <br>
  1. 서비스의 이용은 카카오/애플 소셜 로그인, 이메일 인증 등 회사가 정한 방식으로 회원가입 후 가능합니다.<br>
  2. 회원은 언제든지 서비스 내 제공 기능을 통하여 이용계약을 해지(탈퇴)할 수 있습니다.
  <br><br>

  <b>제4조 (회원의 의무)</b>
  <br>
  1. 회원은 관계 법령, 본 약관 및 서비스 이용안내 등 회사의 공지사항을 준수해야 합니다.<br>
  2. 회원은 다음 각 호의 행위를 하여서는 안 됩니다.<br>
  &nbsp;&nbsp;- 타인 정보 도용 및 허위 정보 제공<br>
  &nbsp;&nbsp;- 불법·유해·음란·도배성 게시물 작성<br>
  &nbsp;&nbsp;- 타인의 권리(저작권 등) 침해<br>
  &nbsp;&nbsp;- 서비스 운영을 방해하는 행위<br>
  3. 회원은 자신의 계정 및 비밀번호를 관리할 책임이 있습니다.
  <br><br>

  <b>제5조 (서비스의 제공 및 변경)</b>
  <br>
  1. 회사는 서비스의 지속적 제공을 위해 최선을 다하나, 운영상·기술상 사유로 일부 내용이 변경될 수 있습니다.<br>
  2. 회사는 서비스 제공에 있어 필요한 경우 사전 공지 후 서비스의 일부 또는 전부를 변경, 중단할 수 있습니다.
  <br><br>

  <b>제6조 (게시물 및 저작권)</b>
  <br>
  1. 회원이 서비스 내에 게시 또는 업로드한 모든 콘텐츠(텍스트, 이미지 등)의 저작권은 해당 회원에게 있습니다.<br>
  2. 회원은 타인의 저작권, 초상권 등 제3자의 권리를 침해해서는 안 됩니다.<br>
  3. 회사는 법령 또는 약관 위반, 권리침해, 서비스 질서 유지를 위하여 게시물을 사전 통지 없이 삭제 또는 제한할 수 있습니다.
  <br><br>

  <b>제7조 (이용제한 및 책임의 한계)</b>
  <br>
  1. 회원이 본 약관을 위반하거나 서비스의 정상적 운영을 방해하는 경우, 회사는 해당 회원의 서비스 이용을 제한할 수 있습니다.<br>
  2. 서비스 내 게시물 및 커뮤니케이션에 대한 책임은 해당 회원에게 있으며, 회사는 회원 간 분쟁에 직접 개입하지 않습니다.<br>
  3. 회사는 불가항력, 회원의 귀책사유, 또는 기타 회사의 합리적 관리 범위를 벗어난 사유로 인한 서비스 장애에 대하여 책임을 지지 않습니다.
  <br><br>

  <b>제8조 (약관의 변경)</b>
  <br>
  1. 회사는 관련 법령, 서비스 운영 정책 변화에 따라 약관을 변경할 수 있으며, 변경 시 사전 고지 후 적용합니다.<br>
  2. 변경된 약관에 동의하지 않는 경우, 회원은 서비스 이용을 중단하고 탈퇴할 수 있습니다.
  <br><br>

  <b>제9조 (기타)</b>
  <br>
  1. 본 약관에 명시되지 않은 사항은 관계 법령 및 회사의 운영정책에 따릅니다.<br>
  2. 서비스 및 약관 관련 문의는 <b>admin@raspyapp.com</b>으로 연락하실 수 있습니다.
  <br>
  <br>
  본 약관은 2025년 7월 21일부터 적용됩니다.
</div>

        <button
          class="mt-4 px-4 py-1 rounded bg-black text-white text-xs"
          @click="showTermsModal = false"
        >
          닫기
        </button>
      </div>
    </div>

    <!-- 개인정보처리방침 모달 -->
    <div
      v-if="showPrivacyModal"
      class="fixed text-left inset-0 bg-black/30 flex items-center justify-center z-50"
      @click.self="showPrivacyModal = false"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6">
        <div class="font-bold mb-2">개인정보처리방침</div>
<div class="max-h-64 overflow-auto text-sm space-y-2">
  <b>Match 개인정보처리방침</b>
  <br><br>
  <b>1. 개인정보 수집 항목 및 방법</b><br>
  회사는 회원가입 및 서비스 제공을 위해 <b>이메일</b>(카카오/애플 소셜 로그인)만을 수집합니다.<br>
  카메라·앨범 권한은 사진 첨부 및 게시물 작성, 알림 권한은 커뮤니티 알림 제공 목적으로만 사용됩니다.
  <br><br>

  <b>2. 개인정보 이용 목적</b><br>
  - 회원관리(본인확인, 중복가입 방지, 문의 대응 등)<br>
  - 서비스 제공 및 운영, 커뮤니티 알림 전송 등<br>
  - 법령 또는 서비스 운영에 필요한 최소 범위 내에서만 이용됩니다.
  <br><br>

  <b>3. 개인정보 보유 및 파기</b><br>
  - 회원 탈퇴 또는 수집·이용 목적 달성 시 지체 없이 파기합니다.<br>
  - 단, 법령에 따라 보관이 필요한 정보는 해당 법률에서 정한 기간 동안 보유될 수 있습니다.
  <br><br>

  <b>4. 개인정보 국외 이전 안내</b><br>
  - 회원정보 및 서비스 운영 데이터는 Amazon Web Services(AWS) 북미(USA) 리전 서버에 안전하게 보관·처리됩니다.<br>
  - 국외 이전 관련 보호 조치를 준수합니다.
  <br><br>

  <b>5. 외부 서비스 연동</b><br>
  - 본 서비스는 카카오, 애플 소셜 로그인, Firebase(알림 서비스)와 연동되어 있으며, 각 서비스 제공자의 정책에 따라 일부 정보가 연동·처리될 수 있습니다.
  <br><br>

  <b>6. 회원의 권리와 행사방법</b><br>
  - 회원은 언제든지 개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다.<br>
  - 서비스 내 설정 또는 <b>admin@raspyapp.com</b>을 통해 문의 가능합니다.
  <br><br>

  <b>7. 개인정보 보호 책임자</b><br>
  - 책임자: 대표이사(주식회사 래스피)
  <br>
  - 연락처: <b>admin@raspyapp.com</b>
  <br><br>

  <b>8. 정책 변경 및 고지</b><br>
  본 방침은 2025년 7월 21일부터 적용되며, 변경 시 서비스 내 공지 후 시행됩니다.
</div>

        <button
          class="mt-4 px-4 py-1 rounded bg-black text-white text-xs"
          @click="showPrivacyModal = false"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
import { ref } from 'vue'
const isLoading = ref(false)
const showTermsModal = ref(false)
const showPrivacyModal = ref(false)
const goHomeIfLoggedIn = () => {
  if (localStorage.getItem("raspy_access_token2") != undefined) {
    router.push("/")
  }
}
goHomeIfLoggedIn()

const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)

// 플랫폼 감지 (iOS 웹뷰)
const userAgent = navigator.userAgent.toLowerCase()
const isIosApp = userAgent.includes('raspy-ios')

const loginWith = (provider) => {
  const isLocalhostClient = window.location.hostname === 'localhost' && window.location.port === '8081'
  isLoading.value = true
  const apiBase = isLocalhostClient
    ? 'http://localhost:8080'
    : 'https://raspy-be.shop'

  if (provider === 'kakao') {
    if (userAgent.includes("raspy-ios")) {
      window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: "kakaoLogin" })
    } else {
      window.location.href = `${apiBase}/oauth2/authorization/kakao`
    }
  } else if (provider === 'apple') {
    if (userAgent.includes("raspy-ios")) {
      window.webkit?.messageHandlers?.iosBridge?.postMessage({ action: "appleLogin" })
    } else {
      alert("Apple 로그인은 iOS 앱에서만 가능합니다.")
    }
  } else {
    window.location.href = `${apiBase}/oauth2/authorization/${provider}`
  }
}


const loginGroup = () => {
  router.push("/group/login")
}

window.onKakaoLoginSuccess = function({ token }) { 
  // 토큰 저장
  localStorage.setItem("raspy_access_token2", token)

  // 홈으로 이동
  window.location.href = "/"
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');

.raspy {
  font-family: 'Kanit', sans-serif;
  font-weight: 600;
  font-size: 2.7rem;
  letter-spacing: 0.04em;
  color: var(--point-color);
}

.tagline {
  font-family: 'Kanit', sans-serif;
  font-size: 1.15rem;
  color: #333;
  text-align: center;
}

.oauth-container {
  display: flex;
  flex-direction: column;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 15px 16px;
  border-radius: 8px;
  font-size: 1rem;
  width: 90%;
  margin:2% 5%;
  transition: background-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
  border: none;
}

.oauth-btn:hover {
  transform: scale(1.02);
}

.icon-text {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.google {
  background: #fff;
  border: 1px solid #dfdfdf;
  color: #444;
}

.google:hover {
  background: #f7f7f7;
}

.kakao {
  background: #FEE500;
  color: #3C1E1E;
}

.kakao:hover {
  background: #fddc00;
}

.apple {
  background: #000000;
  color: #fff;
}

.apple:hover {
  background: #222;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(255,255,255,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  transition: background 0.2s;
}
.loader {
  background: rgba(255,255,255,0.7);
  padding: 24px 36px;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop-in 0.23s cubic-bezier(.47,1.64,.41,.8);
}
.loading-text {
  font-size: 1.2rem;
  color: var(--point-color, #ff6f1f);
  font-family: 'Kanit', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  animation: blink 1.3s infinite alternate;
}
@keyframes pop-in {
  0% { transform: scale(0.7); opacity:0; }
  100% { transform: scale(1); opacity:1; }
}
@keyframes blink {
  0% { opacity:1; }
  100% { opacity:0.55; }
}

</style>
