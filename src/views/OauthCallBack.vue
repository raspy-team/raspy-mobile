<template>
  <div class="app-container">
    <!-- TopBar: 뒤로가기 -->
    <div class="top-bar-global">
      <button
        class="back-btn fas fa-arrow-left"
        :class="{ disabled: step === 0 }"
        @click="prev"
      ></button>
    </div>
    <!-- Progress Bar -->
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
    <div class="screen">
      <!-- Step 0: 환영+약관 동의 -->
      <div v-if="step === 0" class="screen-inner">
        <div class="content flex flex-col items-center w-full h-full justify-center text-center">
          <div class="question-box center w-full">
            <i class="fas fa-smile icon-large mb-3"></i>
            <h1 class="text-center text-2xl font-bold mb-3">환영합니다!</h1>
            <p class="text-center mb-5">시작하려면 간단한 설정이 필요해요.</p>
          </div>
          <transition name="fade">
            <div class="eula-box" v-if="!eulaComplete" key="eula">
              <label v-if="false" class="checkbox-row all" @click="toggleAll">
                <input type="checkbox" v-model="eulaAllChecked" />
                <span class="fake-checkbox"></span>
                <span class="all-label">전체 동의</span>
              </label>
              <div v-for="term in terms" :key="term.id" class="checkbox-row term py-2">
                <label class="flex-1 flex items-center" @click.stop="toggleTerm(term.id)">
                  <input
                    type="checkbox"
                    :checked="eulaChecked[term.id]"
                    @change="toggleTerm(term.id)"
                  />
                  <span class="fake-checkbox"></span>
                  <span class="ml-1.5">{{ term.title }}</span>
                  <span class="required">*</span>
                </label>
                <button class="see-detail" @click.stop="openModal(term)">전체보기</button>
              </div>
              <div class="eula-desc mt-3 text-xs text-gray-400">
                아래 약관을 모두 동의해야 가입을 시작할 수 있습니다.
              </div>
            </div>
          </transition>
        </div>
        <div class="footer">
          <transition name="slide-fade">
            <div>
              <button
                class="btn btn-primary"
                :disabled="!allChecked"
                @click="onEulaNext"
                v-if="!eulaComplete"
                key="eula-btn"
              >
                동의하고 시작하기
              </button>
              <button class="btn btn-primary" v-if="eulaComplete" @click="next" key="start-btn">
                시작하기
              </button>
            </div>
          </transition>
        </div>
      </div>
      <!-- Step 1: 사용자 ID (건너뛰기 없음) -->
      <div v-else-if="step === 1" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">사용자 이름 생성</h1>
          <p class="subtext">영문 소문자+숫자 1~12자</p>
        </div>
        <div class="content center">
          <input
            type="text"
            v-model="username"
            @input="onUsernameInput"
            class="input-box"
            maxlength="12"
            placeholder="아이디 입력"
          />
          <p class="error-text" v-if="dupError">{{ dupError }}</p>
        </div>
        <div class="footer-col">
          <button
            class="btn btn-primary mb-3"
            :disabled="!canProceedUsername || validating"
            @click="onUsernameSubmit"
          >
            {{ validating ? '검증 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 2: 닉네임 (건너뛰기 없음) -->
      <div v-else-if="step === 2" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">이름 입력</h1>
          <p class="subtext">실명을 입력해주세요.</p>
        </div>
        <div class="content center">
          <input
            type="text"
            v-model="nickname"
            @input="onNicknameInput"
            class="input-box"
            maxlength="9"
            placeholder="실명 입력"
          />
          <p class="error-text" v-if="nickError">{{ nickError }}</p>
        </div>
        <div class="footer-col">
          <button
            class="btn btn-primary mb-3"
            :disabled="!canProceedNickname || nickValidating"
            @click="onNicknameSubmit"
          >
            {{ nickValidating ? '확인 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 3: 나이 -->
      <div v-else-if="step === 3" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">나이를 알려주세요</h1>
          <p class="subtext">0~150세 사이 숫자</p>
        </div>
        <div class="content center">
          <input
            type="number"
            v-model.number="age"
            class="input-box"
            min="0"
            max="150"
            placeholder="나이 입력"
          />
          <p class="error-text" v-if="ageError">{{ ageError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 4: 성별 -->
      <div v-else-if="step === 4" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">성별을 선택해주세요</h1>
        </div>
        <div class="content center">
          <div class="flex-row gap">
            <button
              v-for="g in genders"
              :key="g"
              @click="gender = g"
              :class="gender === g ? 'btn btn-primary flex-1' : 'btn btn-outline flex-1'"
            >
              {{ g }}
            </button>
          </div>
          <p class="error-text" v-if="genderError">{{ genderError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 5: 지역 -->
      <div v-else-if="step === 5" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">지역을 설정해주세요</h1>
        </div>
        <div class="content center">
          <select v-model="regionP" class="input-box">
            <option disabled value="">시/도 선택</option>
            <option v-for="p in regionList" :key="p">{{ p }}</option>
          </select>
          <select v-model="regionS" class="input-box" style="margin-top: 12px">
            <option disabled value="">시/군/구 선택</option>
            <option v-for="s in regionMap[regionP]" :key="s">{{ s }}</option>
          </select>
          <p class="error-text" v-if="regionError">{{ regionError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 6: 소개 -->
      <div v-else-if="step === 6" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">한 줄 소개</h1>
          <p class="subtext">최대 100자</p>
        </div>
        <div class="content center">
          <textarea
            v-model="bio"
            class="input-box"
            maxlength="100"
            rows="3"
            placeholder="최대 100자"
          ></textarea>
          <p class="subtext">{{ bio.length }}/100</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="next">
            다음
          </button>
        </div>
      </div>
      <!-- Step 7: 소속 -->
      <div v-else-if="step === 7" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">소속</h1>
          <p class="subtext">선택사항 / 최대 100자</p>
        </div>
        <div class="content center">
          <input
            type="text"
            v-model="affiliation"
            class="input-box"
            maxlength="100"
            placeholder="예: 서울대학교, ABC회사, 런닝크루 등"
          />
          <p class="subtext">{{ affiliation.length }}/100</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="next">
            다음
          </button>
        </div>
      </div>
      <!-- Step 8: 사진 -->
      <div v-else-if="step === 8" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">프로필 사진</h1>
        </div>
        <div class="content center">
          <label class="image-label">
            <span class="upload-text">이미지 선택</span>
            <input type="file" accept="image/*" @change="onImageChange" class="input-image" />
          </label>
          <div v-if="preview" class="img-preview-area">
            <img :src="preview" class="profile-preview" />
            <button class="remove-img-btn" @click="removeImage" type="button">
              <span class="fas fa-times"></span>
            </button>
          </div>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating || !avatar">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
        </div>
      </div>
      <!-- Step 9: 완료 -->
      <div v-else-if="step === 9" class="screen-inner">
        <div class="content center">
          <i class="fas fa-circle-check icon-large"></i>
          <h1 class="text-center font-extrabold text-orange-500 mt-2 text-2xl">설정 완료!</h1>
          <div class="text-orange-500 mt-3 font-[300]">지금부터 Match를 이용하실 수 있습니다</div>
        </div>
        <div class="p-5">
          <button class="btn btn-primary" @click="toHome">홈으로 가기</button>
        </div>
      </div>
    </div>
    <!-- 약관 전체보기 모달 -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-title font-bold text-base mb-2">{{ modalTerm.title }}</div>
          <div class="modal-body text-sm whitespace-pre-line" v-html="modalTerm.body"></div>
          <button class="modal-close-btn mt-6" @click="closeModal">확인</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'
import regionData from '../assets/regionMap.json'
import { compressImage, dataUrlToFile } from '../utils/gamePictureStorage'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.token) localStorage.setItem('raspy_access_token2', route.query.token)
  if (route.query.isNewUser == 'false') {
    router.push('/')
  }
  const token = localStorage.getItem('raspy_access_token2')
  if (window.AndroidApp && window.AndroidApp.registerFcmToken) {
    window.AndroidApp.registerFcmToken(token)
  } else if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.iosBridge
  ) {
    window.webkit.messageHandlers.iosBridge.postMessage({
      action: 'registerFcmToken',
      jwt: token,
    })
  }
})

// ============ EULA / 약관 동의 ============

const terms = [
  {
    id: 'eula',
    title: '서비스 이용약관',
    body: `
제1조 (목적)
본 약관은 주식회사 래스피(이하 "회사"라 함)가 제공하는 모든 서비스(이하 "서비스"라 함)의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항 등 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (회원의 정의 및 가입조건)
① "회원"이란 본 약관에 동의하고, 회사가 정한 절차에 따라 가입하여 서비스를 이용하는 자를 의미합니다.
② 만 4세 미만은 회원 가입이 불가하며, 만 19세 미만은 일부 서비스 이용이 제한될 수 있습니다.

제3조 (약관의 게시 및 개정)
회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 내에 게시합니다. 약관의 개정 시 회사는 관련법에 따라 공지합니다.

제4조 (서비스 이용계약의 성립)
회원 가입 시 본 약관 및 개인정보 처리방침에 동의함으로써 서비스 이용계약이 성립됩니다.

제5조 (회원의 의무)
① 회원은 관계법령, 본 약관, 이용안내 및 서비스상에 공지한 주의사항 등을 준수하여야 하며, 다음 각 호의 행위를 해서는 안됩니다.
  1. 타인의 개인정보, 계정도용, 사칭 등 허위정보 제공 행위
  2. 회사 또는 제3자의 저작권 등 권리 침해 행위
  3. 불법, 유해, 음란, 욕설, 차별, 혐오, 폭력, 불쾌, 선정적, 위협적, 불법광고 등
     ("Objectionable Content" 포함)  
     - 예: 불법촬영물, 음란물, 도박, 마약, 자살, 자해, 폭력, 증오/차별조장, 개인정보 노출, 불쾌한 언사 등 일체  
     - 청소년유해매체, 법령 위반 게시물, 범죄 모의/방조/권유/유도성 내용, 기타 사회질서 해치는 행위
  4. 서비스의 정상적 운영을 방해하거나 서버에 과도한 부담을 주는 행위
  5. 기타 본 약관 및 관련법에 위반되는 일체의 행위
② 회원의 위반행위로 인해 발생한 모든 민형사상 책임은 본인에게 있습니다.

제6조 (서비스의 제공 및 중단)
① 회사는 회원에게 안정적 서비스를 제공하기 위해 최선을 다합니다.
② 회사는 다음 각 호에 해당하는 경우 서비스의 일부 또는 전부를 일시적으로 제한, 중지할 수 있습니다.
  1. 시스템 정기/비정기 점검
  2. 천재지변, 불가항력적 사유 등

제7조 (게시물의 저작권 및 관리)
① 회원이 서비스 내에 게시한 모든 게시물의 저작권은 회원에게 있습니다. 단, 회사는 서비스의 운영·홍보·연구를 위해 필요한 범위 내에서 이를 사용할 수 있습니다.
② 회원의 게시물이 "Objectionable Content" 또는 관련법 위반 등 금지행위에 해당하는 경우, 회사는 사전통지 없이 삭제, 차단, 임시조치, 서비스 이용제한 등 조치를 할 수 있습니다.
③ 회사는 수사기관, 사법당국의 요청이 있을 경우 관련 정보를 제공할 수 있습니다.

제8조 (계약해지 및 서비스 이용제한)
회원이 이용계약을 해지하고자 할 경우, 서비스 내 탈퇴기능을 통해 언제든지 해지할 수 있습니다.  
회사는 회원의 위반행위 발생 시 즉시 서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.

제9조 (면책)
회사는 천재지변, 불가항력적 사유, 회원의 고의·과실 등으로 인한 서비스 장애에 대해 책임을 지지 않습니다.

제10조 (분쟁해결 및 관할)
본 약관과 관련한 분쟁은 회사의 본사 소재지 법원을 관할법원으로 합니다.

[부칙]
본 약관은 2025년 7월 25일부터 시행합니다.
    `,
  },
  {
    id: 'privacy',
    title: '개인정보 처리방침',
    body: `
1. 총칙
회사는 이용자의 개인정보를 소중히 여기며, "정보통신망 이용촉진 및 정보보호 등에 관한 법률", "개인정보보호법" 등 관련 법령을 준수합니다.

2. 수집하는 개인정보 항목
- 회원가입 시: 이메일
- 프로필 설정 시: 나이, 성별, 지역, 자기소개, 프로필사진 등

3. 개인정보의 수집 및 이용 목적
- 회원 가입, 본인확인, 서비스 제공 및 유지, 고객지원, 서비스 품질개선, 신규 서비스 개발, 부정이용 방지 등

4. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 또는 개인정보 수집 및 이용 목적 달성 시까지 보유 및 이용
- 단, 관련법령(전자상거래 등 소비자 보호법 등)에 따라 일정 기간 보관 필요 시 그에 따름

5. 개인정보의 제3자 제공
- 회사는 원칙적으로 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.
  1) 이용자가 사전에 동의한 경우
  2) 법령에 근거하여 수사기관, 사법기관 등 국가기관의 요청이 있는 경우

6. 개인정보의 파기절차 및 방법
- 목적 달성, 보유기간 경과 등 파기사유 발생 시 지체 없이 복구 불가능한 방법으로 파기

7. 이용자의 권리 및 행사 방법
- 본인 및 법정대리인은 개인정보 열람, 정정, 삭제, 처리정지, 동의철회를 요구할 수 있습니다.

8. 개인정보보호책임자
- 개인정보보호책임자: 김우진 (xhae000y@gmail.com 또는 admin@raspy.app)
- 기타 문의는 서비스 내 고객센터를 통해 문의하실 수 있습니다.

[부칙]
본 방침은 2025년 7월 25일부터 시행합니다.
    `,
  },
]

const eulaChecked = ref({
  eula: false,
  privacy: false,
})
const eulaAllChecked = ref(false)
const allChecked = computed(() => Object.values(eulaChecked.value).every((v) => v))
const showModal = ref(false)
const modalTerm = ref({})
const eulaComplete = ref(false)

function toggleAll() {
  const checked = !allChecked.value

  eulaChecked.value.eula = checked
  eulaChecked.value.privacy = checked

  eulaAllChecked.value = checked
}
function toggleTerm(id) {
  eulaChecked.value[id] = !eulaChecked.value[id]
  // 전체 동의 상태 업데이트
  eulaAllChecked.value = allChecked.value
}
function openModal(term) {
  modalTerm.value = term
  showModal.value = true
}
function closeModal() {
  showModal.value = false
}
function onEulaNext() {
  eulaComplete.value = true
  setTimeout(() => {
    step.value++
    eulaComplete.value = false
  }, 0)
}

// 기존 온보딩 스텝 로직 그대로
const step = ref(0)
const username = ref(''),
  dupError = ref(''),
  dupTimer = ref(null),
  validating = ref(false)
const nickname = ref(decodeURIComponent(route.query.nickname || ''))
const nickError = ref(''),
  nickValidating = ref(false)
const age = ref(0),
  ageError = ref('')
const gender = ref(''),
  genderError = ref('')
const regionP = ref(''),
  regionS = ref(''),
  regionError = ref('')
const bio = ref('')
const affiliation = ref('')
const avatar = ref(null),
  preview = ref('')
const profileValidating = ref(false)
const genders = ['남성', '여성', '기타']
const regionMap = regionData
const regionList = computed(() => Object.keys(regionMap).filter((k) => k !== '전국'))
const totalSteps = 9

const progressWidth = computed(() => (step.value / totalSteps) * 100)
const next = () => {
  step.value++
}
const prev = () => {
  if (step.value > 0) step.value--
}
const canProceedUsername = computed(
  () => /^[a-z0-9]{1,12}$/.test(username.value) && !dupError.value,
)
const canProceedNickname = computed(() => {
  return nickname.value.trim().length > 0 && nickname.value.trim().length <= 9
})
function onUsernameInput() {
  clearTimeout(dupTimer.value)
  dupError.value = ''
  if (!/^[a-z0-9]{1,12}$/.test(username.value)) {
    dupError.value = '영문소문자/숫자 1~12자'
    return
  }
  dupTimer.value = setTimeout(checkDupUser, 300)
}
async function checkDupUser() {
  validating.value = true
  try {
    const res = await api.post(`/api/auth/check-username`, { username: username.value })
    dupError.value = res.data.exists ? '이미 사용중인 ID입니다.' : ''
  } catch {
    dupError.value = '서버 오류'
  } finally {
    validating.value = false
  }
}
async function onUsernameSubmit() {
  if (!canProceedUsername.value) return
  await checkDupUser()
  if (dupError.value) return
  step.value++
}
function onNicknameInput() {
  nickError.value = ''
}
async function onNicknameSubmit() {
  if (!canProceedNickname.value) {
    nickError.value = '닉네임을 입력해주세요'
    return
  }
  nickValidating.value = true
  try {
    api.post('/api/auth/complete', { username: username.value, nickname: nickname.value })
    step.value++
  } catch {
    nickError.value = '서버 오류'
  } finally {
    nickValidating.value = false
  }
}
function removeImage() {
  avatar.value = null
  preview.value = ''
}
// // 각 프로필 단계 skip(값 초기화) - 3~7단계만 적용
// function onStepSkip() {
//   if (step.value === 3) age.value = 0
//   if (step.value === 4) gender.value = ''
//   if (step.value === 5) {
//     regionP.value = ''
//     regionS.value = ''
//   }
//   if (step.value === 6) bio.value = ''
//   if (step.value === 7) {
//     avatar.value = null
//     preview.value = ''
//   }
//   step.value++
// }
function validateProfileStep() {
  ageError.value =
    step.value === 3 && (!age.value || age.value < 0 || age.value > 150) ? '0~150 입력' : ''
  genderError.value = step.value === 4 && !gender.value ? '성별 선택' : ''
  regionError.value = step.value === 5 && (!regionP.value || !regionS.value) ? '지역 선택' : ''
  return !(ageError.value || genderError.value || regionError.value)
}
async function onProfileNext() {
  if (!validateProfileStep()) return
  profileValidating.value = true
  try {
    if (step.value === 8) {
      const fd = new FormData()
      fd.append('age', age.value)
      fd.append('gender', gender.value == '남성' ? 'M' : gender.value == '여성' ? 'F' : 'O')
      fd.append('region', `${regionP.value} ${regionS.value}`)
      fd.append('bio', bio.value)
      fd.append('affiliation', affiliation.value)
      if (avatar.value) fd.append('profile_picture', avatar.value)
      await api.patch('/api/user-profile/save', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    step.value++
  } catch {
    console.log('errr')
  } finally {
    profileValidating.value = false
  }
}
async function onImageChange(e) {
  const file = e.target.files[0]
  if (file && file.size <= 1 * 1024 * 1024 * 10) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        // 이미지 압축 (화질 30%)
        const compressedDataUrl = await compressImage(reader.result)
        preview.value = compressedDataUrl
        // 압축된 이미지를 File 객체로 변환
        avatar.value = dataUrlToFile(compressedDataUrl, file.name)
      } catch (error) {
        console.error('이미지 압축 실패:', error)
        alert('이미지 처리 중 오류가 발생했습니다.')
      }
    }
    reader.readAsDataURL(file)
  } else {
    alert('파일은 10MB 이하여야합니다')
  }
}
function toHome() {
  router.push('/')
}
</script>

<style scoped>
.app-container {
  background: #fff;
  height: full;
  display: flex;
  flex-direction: column;
}
.top-bar-global {
  width: 100vw;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 0 0 12px;
  /* 패딩 UP, 좌측 여유 */
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 56px;
  position: relative;
  z-index: 40;
  background: transparent;
}
.back-btn {
  font-size: 22px;
  color: #333;
  background: none;
  border: none;
  padding: 12px;
}
.back-btn.disabled {
  visibility: hidden;
}
.progress-bar-container {
  width: 92vw;
  margin: 0 auto 18px auto;
  padding-top: 8px;
  padding-bottom: 8px;
  background: transparent;
  display: flex;
  align-items: center;
  z-index: 20;
}
.progress-bar {
  width: 100%;
  height: 6px;
  background: #eee;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}
.progress {
  height: 100%;
  background: #f77f00;
  border-radius: 3px;
  transition: width 0.3s;
}
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.screen-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.question-box {
  padding: 0 24px 0 12px;
  margin-top: 16px;
  margin-bottom: 0;
  align-self: flex-start;
}
.center {
  align-items: center;
  justify-content: center;
}
.content {
  flex: 1;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
}
.heading {
  font-size: 22px;
  padding-left: 1rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  text-align: left;
}
.subtext {
  font-size: 14px;
  padding-left: 1rem;
  color: #888;
  text-align: left;
  margin-bottom: 8px;
}
.icon-large {
  font-size: 48px;
  color: #f77f00;
  margin-bottom: 10px;
}
.input-box {
  width: 100%;
  padding: 14px;
  font-size: 18px;
  margin-top: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
.error-text {
  margin-top: 8px;
  font-size: 14px;
  color: #e63946;
}
.footer,
.footer-col {
  padding: 20px 16px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.btn {
  width: 100%;
  padding: 14px;
  font-size: 18px;
  border-radius: 8px;
  border: none;
}
.btn-primary {
  background: #f77f00;
  color: #fff;
}
.btn-primary:disabled {
  background: #f1a663;
}
.btn-outline {
  background: #fff;
  border: 1px solid #f77f00;
  color: #f77f00;
}
.mb-3 {
  margin-bottom: 18px;
}
.flex-row {
  display: flex;
}
.gap {
  gap: 12px;
}
.profile-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin-top: 16px;
  object-fit: cover;
  box-shadow: 0 0 0 3px #f77f0044;
}
.image-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 8px;
  gap: 8px;
}
.input-image {
  display: none;
}
.upload-text {
  font-size: 16px;
  color: #f77f00;
  border: 1px solid #f77f00;
  border-radius: 8px;
  padding: 8px 18px;
  background: #fff;
}
.img-preview-area {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.remove-img-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #eee;
  color: #d33;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 8px #0001;
  cursor: pointer;
  z-index: 10;
}

/* === EULA 약관 동의 추가 스타일 === */
.eula-box {
  background: #f9f9fa;
  border-radius: 16px;
  padding: 24px 16px 16px 16px;
  margin: 0 auto;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 3px 24px #0001;
  transition: box-shadow 0.25s;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
}
.checkbox-row input[type='checkbox'] {
  display: none;
}
.fake-checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #f77f00;
  border-radius: 7px;
  background: #fff;
  display: inline-block;
  margin-right: 8px;
  position: relative;
}
.checkbox-row input[type='checkbox']:checked + .fake-checkbox {
  background: #f77f00;
  border-color: #f77f00;
}
.checkbox-row input[type='checkbox']:checked + .fake-checkbox::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1.5px;
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}
.checkbox-row .all-label {
  font-weight: 600;
  color: #f77f00;
  margin-left: 2px;
}
.checkbox-row.term .see-detail {
  margin-left: auto;
  background: none;
  border: none;
  color: #aaa;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0 6px;
}
.checkbox-row .required {
  color: #e63946;
  font-size: 13px;
  margin-left: 4px;
}
.divide {
  border-top: 1px solid #eee;
  margin: 8px 0 4px 0;
}
.eula-desc {
  margin-top: 12px;
  text-align: left;
}

/* === 약관 모달 === */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10010;
  background: rgba(24, 24, 24, 0.32);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: modal-in 0.16s;
}
.modal-content {
  background: #fff;
  border-radius: 14px;
  max-width: 90vw;
  width: 370px;
  max-height: 75vh;
  overflow: auto;
  box-shadow: 0 8px 32px #0003;
  padding: 28px 20px 24px 20px;
  display: flex;
  flex-direction: column;
  animation: popin 0.22s cubic-bezier(0.44, 1.5, 0.71, 1);
}
.modal-title {
  font-size: 19px;
  color: #222;
}
.modal-body {
  color: #555;
  font-size: 15px;
  margin-bottom: 8px;
}
.modal-close-btn {
  width: 100%;
  padding: 12px 0;
  background: #f77f00;
  color: #fff;
  font-size: 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
}
@keyframes modal-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes popin {
  0% {
    transform: scale(0.97);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 약간의 페이드/슬라이드 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.6, 0, 0, 1.4);
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(18px);
}
.slide-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.19s;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
