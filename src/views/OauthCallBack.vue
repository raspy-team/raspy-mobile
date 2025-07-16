<template>
  <div class="app-container">
    <!-- TopBar: 뒤로가기 -->
    <div class="top-bar-global">
      <button class="back-btn fas fa-arrow-left"
              :class="{ disabled: step === 0 }"
              @click="prev"></button>
    </div>
    <!-- Progress Bar -->
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </div>
    <div class="screen">
      <!-- Step 0: 환영 -->
      <div v-if="step === 0" class="screen-inner">
        <div class="content flex items-center w-full h-full justify-center text-center">
          <div class="question-box center w-full">
            <i class="fas fa-smile icon-large"></i>
            <h1 class="text-center text-2xl font-bold mb-3">환영합니다!</h1>
            <p class="text-center">시작하려면 간단한 설정이 필요해요.</p>
          </div>
        </div>
        <div class="footer">
          <button class="btn btn-primary" @click="next">시작하기</button>
        </div>
      </div>

      <!-- Step 1: 사용자 ID (건너뛰기 없음) -->
      <div v-else-if="step === 1" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">사용자 이름 생성</h1>
          <p class="subtext">영문 소문자+숫자 1~12자</p>
        </div>
        <div class="content center">
          <input type="text" v-model="username" @input="onUsernameInput"
            class="input-box" maxlength="12" placeholder="아이디 입력"/>
          <p class="error-text" v-if="dupError">{{ dupError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" :disabled="!canProceedUsername || validating" @click="onUsernameSubmit">
            {{ validating ? '검증 중...' : '다음' }}
          </button>
        </div>
      </div>

      <!-- Step 2: 닉네임 (건너뛰기 없음) -->
      <div v-else-if="step === 2" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">닉네임 설정</h1>
          <p class="subtext">최대 9자(한글 가능)</p>
        </div>
        <div class="content center">
          <input type="text" v-model="nickname" @input="onNicknameInput"
            class="input-box" maxlength="9" placeholder="닉네임 입력"/>
          <p class="error-text" v-if="nickError">{{ nickError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" :disabled="!canProceedNickname || nickValidating" @click="onNicknameSubmit">
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
          <input type="number" v-model.number="age" class="input-box" min="0" max="150" placeholder="나이 입력"/>
          <p class="error-text" v-if="ageError">{{ ageError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
          <button class="btn btn-outline" @click="onStepSkip">건너뛰기</button>
        </div>
      </div>

      <!-- Step 4: 성별 -->
      <div v-else-if="step === 4" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">성별을 선택해주세요</h1>
        </div>
        <div class="content center">
          <div class="flex-row gap">
            <button v-for="g in genders" :key="g" @click="gender = g"
                    :class="gender===g ? 'btn btn-primary flex-1' : 'btn btn-outline flex-1'">{{ g }}</button>
          </div>
          <p class="error-text" v-if="genderError">{{ genderError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
          <button class="btn btn-outline" @click="onStepSkip">건너뛰기</button>
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
          <select v-model="regionS" class="input-box" style="margin-top:12px;">
            <option disabled value="">시/군/구 선택</option>
            <option v-for="s in regionMap[regionP]" :key="s">{{ s }}</option>
          </select>
          <p class="error-text" v-if="regionError">{{ regionError }}</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
          <button class="btn btn-outline" @click="onStepSkip">건너뛰기</button>
        </div>
      </div>

      <!-- Step 6: 소개 -->
      <div v-else-if="step === 6" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">한 줄 소개</h1>
          <p class="subtext">최대 100자</p>
        </div>
        <div class="content center">
          <textarea v-model="bio" class="input-box" maxlength="100" rows="3" placeholder="최대 100자"></textarea>
          <p class="subtext">{{ bio.length }}/100</p>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
          <button class="btn btn-outline" @click="onStepSkip">건너뛰기</button>
        </div>
      </div>

      <!-- Step 7: 사진 -->
      <div v-else-if="step === 7" class="screen-inner">
        <div class="question-box">
          <h1 class="heading">프로필 사진</h1>
        </div>
        <div class="content center">
          <label class="image-label">
            <span class="upload-text">이미지 선택</span>
            <input type="file" accept="image/*" @change="onImageChange" class="input-image"/>
          </label>
          <div v-if="preview" class="img-preview-area">
            <img :src="preview" class="profile-preview"/>
            <button class="remove-img-btn" @click="removeImage" type="button">
              <span class="fas fa-times"></span>
            </button>
          </div>
        </div>
        <div class="footer-col">
          <button class="btn btn-primary mb-3" @click="onProfileNext" :disabled="profileValidating">
            {{ profileValidating ? '처리 중...' : '다음' }}
          </button>
          <button class="btn btn-outline" @click="onProfileNext">건너뛰기</button>
        </div>
      </div>

      <!-- Step 8: 완료 -->
      <div v-else-if="step === 8" class="screen-inner">
        <div class="content center">
          <i class="fas fa-circle-check icon-large"></i>
          <h1 class="text-center font-extrabold text-orange-500 mt-2 text-2xl">설정 완료!</h1>
          <div class="text-orange-500 mt-3 font-[300]">
            지금부터 Raspy를 이용하실 수 있습니다
          </div>
        </div>
        <div class="p-5 " >
          <button class="btn btn-primary" @click="toHome">홈으로 가기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'
import regionData from '../assets/regionMap.json'

const route = useRoute()
const router = useRouter()

onMounted(()=> {
    if(route.query.token)
        localStorage.setItem('raspy_access_token2', route.query.token)

    if(route.query.isNewUser=='false') {
        router.push("/")
    }


    if (window.AndroidApp && typeof window.AndroidApp.registerFcmToken === 'function') {
    window.AndroidApp.registerFcmToken(localStorage.getItem("raspy_access_token2"))
    }
})


const step = ref(0)
const username = ref(''), dupError = ref(''), dupTimer = ref(null), validating = ref(false)
const nickname = ref(decodeURIComponent(route.query.nickname || ''))
const nickError = ref(''), nickValidating = ref(false)
const age = ref(0), ageError = ref('')  
const gender = ref(''), genderError = ref('')
const regionP = ref(''), regionS = ref(''), regionError = ref('')
const bio = ref(''), avatar = ref(null), preview = ref('')
const profileValidating = ref(false)
const genders = ['남성', '여성', '기타']
const regionMap = regionData
const regionList = computed(() => Object.keys(regionMap).filter(k => k !== '전국'))
const totalSteps = 8

const progressWidth = computed(() => (step.value / totalSteps) * 100)
const next = () => { step.value++ }
const prev = () => { if (step.value > 0) step.value-- }
const canProceedUsername = computed(() => /^[a-z0-9]{1,12}$/.test(username.value) && !dupError.value)
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
function onNicknameInput() { nickError.value = '' }
async function onNicknameSubmit() {
  if (!canProceedNickname.value) {
    nickError.value = '닉네임을 입력해주세요'
    return
  }
  nickValidating.value = true
  try {
    const res = await api.post('/api/auth/complete', { username: username.value, nickname: nickname.value })
    if(res.data && res.data.token){
      localStorage.setItem('raspy_access_token2', res.data.token)
      window.AndroidApp?.registerFcmToken(res.data.token)
    }
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
// 각 프로필 단계 skip(값 초기화) - 3~7단계만 적용
function onStepSkip() {
  if(step.value === 3) age.value = 0
  if(step.value === 4) gender.value = ''
  if(step.value === 5) { regionP.value = ''; regionS.value = '' }
  if(step.value === 6) bio.value = ''
  if(step.value === 7) { avatar.value = null; preview.value = '' }
  step.value++
}
function validateProfileStep() {
  ageError.value = step.value === 3 && (!age.value || age.value < 0 || age.value > 150) ? '0~150 입력' : ''
  genderError.value = step.value === 4 && !gender.value ? '성별 선택' : ''
  regionError.value = step.value === 5 && (!regionP.value || !regionS.value) ? '지역 선택' : ''
  return !(ageError.value || genderError.value || regionError.value)
}
async function onProfileNext() {
  if(!validateProfileStep()) return
  profileValidating.value = true
  try {
    if(step.value === 7){
      const fd = new FormData()
      fd.append('age', age.value)
      fd.append('gender', gender.value == '남성' ? 'M' : gender.value == '여성' ? 'F' : 'O')
      fd.append('region', `${regionP.value} ${regionS.value}`)
      fd.append('bio', bio.value)
      if(avatar.value) fd.append('profile_picture', avatar.value)
      await api.patch('/api/user-profile/save', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    step.value++
  } catch {console.log("errr")}
  finally { profileValidating.value = false }
}
function onImageChange(e) {
  const file = e.target.files[0]
  if (file && file.size <= 1 * 1024 * 1024) {
    avatar.value = file
    const reader = new FileReader()
    reader.onload = () => (preview.value = reader.result)
    reader.readAsDataURL(file)
  } else {
    alert("파일은 1MB 이하여야합니다")
  }
}
function toHome() { router.push('/') }
</script>
<style scoped>
.app-container {
  background: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
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
.back-btn { font-size:22px; color:#333; background:none;border:none; padding: 12px; }
.back-btn.disabled { visibility:hidden; }
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
  transition: width .3s;
}
.screen { flex:1; display:flex; flex-direction:column; }
.screen-inner { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
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
.content { flex:1; padding:0 20px; display:flex; flex-direction:column; }
.heading { font-size:22px; padding-left:1rem; font-weight:bold; margin-bottom:8px; color:#333; text-align:left; }
.subtext { font-size:14px;  padding-left:1rem;  color:#888; text-align:left; margin-bottom:8px; }
.icon-large { font-size:48px; color:#f77f00; margin-bottom:10px; }
.input-box { width:100%; padding:14px; font-size:18px; margin-top:8px; border:1px solid #ddd; border-radius:8px; }
.error-text { margin-top:8px; font-size:14px; color:#e63946; }
.footer, .footer-col {
  padding:20px 16px 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.btn { width:100%; padding:14px; font-size:18px; border-radius:8px; border:none; }
.btn-primary { background:#f77f00; color:#fff; }
.btn-primary:disabled { background:#f1a663; }
.btn-outline { background:#fff; border:1px solid #f77f00; color:#f77f00; }
.mb-3 { margin-bottom:18px; }
.flex-row { display:flex; }
.gap { gap:12px; }
.profile-preview { width:96px; height:96px; border-radius:50%; margin-top:16px; object-fit:cover; box-shadow:0 0 0 3px #f77f0044; }
.image-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 8px;
  gap: 8px;
}
.input-image { display:none }
.upload-text { font-size:16px; color:#f77f00; border:1px solid #f77f00; border-radius:8px; padding:8px 18px; background:#fff; }
.img-preview-area { position:relative; display:flex; align-items:center; margin-top:10px; }
.remove-img-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px; height: 32px;
  background: #fff;
  border-radius: 50%;
  border: 1px solid #eee;
  color: #d33;
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 8px #0001;
  cursor:pointer;
  z-index: 10;
}
</style>
