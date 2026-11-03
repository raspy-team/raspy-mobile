<template>
  <div class="min-h-dvh bg-canvas flex flex-col">
    <!-- 단계 표시 (두 단계일 때만) -->
    <div class="pt-safe">
      <div class="max-w-md mx-auto px-4 h-14 flex items-center gap-1">
        <div v-if="steps.length > 1" class="flex-1 flex gap-1.5 px-2" aria-hidden="true">
          <span v-for="(s, i) in steps" :key="s" class="h-1 flex-1 rounded-full" :class="i <= steps.indexOf(step) ? 'bg-primary' : 'bg-line-strong'"></span>
        </div>
      </div>
    </div>

    <main v-if="loading" class="flex-1 max-w-md w-full mx-auto px-4 pt-8 space-y-4">
      <UiSkeleton class="h-8 w-2/3" />
      <UiSkeleton class="h-4 w-1/2" />
      <UiSkeleton class="h-32 w-full mt-8" />
    </main>

    <!-- 1. 약관 -->
    <main v-else-if="step === 'terms'" class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-32">
      <h1 class="t-title">{{ needProfile ? '반가워요!' : '약관을 확인해주세요' }}</h1>
      <p class="t-body text-fg-muted mt-2">
        {{ needProfile ? '시작하기 전에 약관에 동의해주세요.' : '그동안 동의를 기록하지 못했어요. 한 번만 확인해주세요.' }}
      </p>

      <UiCard :pad="false" class="mt-8">
        <button
          type="button"
          role="checkbox"
          :aria-checked="allAgreed"
          class="w-full flex items-center gap-3 px-4 h-14 text-left"
          @click="toggleAll"
        >
          <span class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" :class="allAgreed ? 'bg-primary text-primary-on' : 'border-2 border-line-strong'">
            <UiIcon name="fas fa-check" class="text-xs" v-if="allAgreed"  aria-hidden="true" />
          </span>
          <span class="t-heading">모두 동의</span>
        </button>
        <div class="border-t border-line">
          <div v-for="t in TERMS" :key="t.id" class="flex items-center pl-4 pr-1 h-12">
            <button type="button" role="checkbox" :aria-checked="agreed[t.id]" class="flex-1 flex items-center gap-3 h-full text-left" @click="agreed[t.id] = !agreed[t.id]">
              <UiIcon name="fas fa-check" class="w-6 text-center" :class="agreed[t.id] ? 'text-primary' : 'text-line-strong'" aria-hidden="true" />
              <span class="text-sm text-fg">{{ t.title }} <span class="text-fg-subtle">(필수)</span></span>
            </button>
            <UiButton variant="ghost" size="sm" @click="openTerm = t">보기</UiButton>
          </div>
        </div>
      </UiCard>
    </main>

    <!-- 3. 동네 (건너뛸 수 있다) -->
    <main v-else-if="step === 'neighborhood'" class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-32">
      <h1 class="t-title">어느 동네에서 겨룰까요?</h1>
      <p class="t-body text-fg-muted mt-2">만나서 하는 경기는 내 동네 근처 사람들과 해요. 앱 안 게임은 동네와 상관없이 바로 할 수 있어요.</p>
      <NeighborhoodVerify class="mt-4" @verified="onNeighborhood" />
    </main>

    <!-- 2. 닉네임 · 사진 -->
    <main v-else class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-32">
      <h1 class="t-title">어떻게 불러드릴까요?</h1>
      <p class="t-body text-fg-muted mt-2">경기 상대에게 보이는 정보예요.</p>

      <div class="mt-8 flex flex-col items-center gap-2">
        <button type="button" class="relative" aria-label="프로필 사진 고르기" @click="fileInput?.click()">
          <UiAvatar :src="preview" :name="nickname || '나'" size="xl" />
          <span class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-2 border border-line text-fg flex items-center justify-center text-sm">
            <UiIcon name="fas fa-camera" aria-hidden="true" />
          </span>
        </button>
        <UiButton v-if="preview" variant="ghost" size="sm" @click="clearPhoto">사진 빼기</UiButton>
        <span v-else class="t-micro">사진 (선택)</span>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPhoto" />
      </div>

      <div class="mt-6 space-y-5">
        <UiInput
          v-model="nickname"
          label="닉네임"
          :maxlength="NICKNAME_MAX"
          placeholder="예: 성수동 탁구왕"
          :hint="`실명 말고 부르기 쉬운 이름. ${NICKNAME_MAX}자까지`"
          :error="nicknameError"
          autocomplete="nickname"
        />
        <UiInput
          v-model="username"
          label="아이디"
          icon="fas fa-at"
          :maxlength="12"
          placeholder="영문 소문자·숫자"
          hint="친구가 나를 찾을 때 써요"
          :error="usernameError"
          autocomplete="username"
        />
      </div>
    </main>

    <!-- 하단 버튼 -->
    <div v-if="!loading" class="fixed bottom-0 inset-x-0 bg-canvas pb-safe">
      <div class="max-w-md mx-auto px-4 py-3">
        <UiButton v-if="step === 'terms'" block size="lg" :disabled="!allAgreed" :loading="saving" @click="submitTerms">
          동의하고 {{ needProfile ? '다음' : '계속하기' }}
        </UiButton>
        <UiButton v-else-if="step === 'neighborhood'" block size="lg" variant="ghost" @click="finish">나중에 할게요</UiButton>
        <UiButton v-else block size="lg" :disabled="!canFinish" :loading="saving" @click="submitProfile">다음</UiButton>
      </div>
    </div>

    <!-- 약관 원문 -->
    <UiSheet :model-value="!!openTerm" :title="openTerm?.title" @update:model-value="openTerm = null">
      <p class="t-caption whitespace-pre-line">{{ openTerm?.body.trim() }}</p>
      <template #footer>
        <UiButton block @click="agreeOne(openTerm.id)">동의</UiButton>
      </template>
    </UiSheet>
  </div>
</template>

<script setup>
// 첫 설정: ① 약관 동의 ② 닉네임·아이디(+사진) ③ 동네 인증(건너뛸 수 있다). 필요한 단계만 보여준다.
// 동네는 GPS로 인증하고, 예전 '활동 지역'(시·도 구)은 서버가 동네에서 채운다
// 나이·성별·소개·소속은 묻지 않는다 (프로필에서 나중에 채운다)
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { AGREEMENTS as TERMS } from '../../content/legal'
import { UiAvatar, UiButton, UiCard, UiInput, UiSheet, UiSkeleton } from '../../components/ui'
import NeighborhoodVerify from '../../components/neighborhood/NeighborhoodVerify.vue'
import { useToast } from '../../composable/useToast'
import { compressImage, dataUrlToFile } from '../../utils/gamePictureStorage'
import { containsProfanity } from '../../utils/profanity'
import { takeReturnTo } from '../../utils/authRedirect'
import { markOnboarded } from '../../router/onboardingGuard'

const NICKNAME_MAX = 10
const USERNAME_PATTERN = /^[a-z0-9_]{1,12}$/

const router = useRouter()
const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)
const needTerms = ref(true)
const needProfile = ref(true)
const step = ref('terms')
const steps = ref([]) // 처음에 보여 줄 단계들 (단계 표시용)

// 약관
const agreed = reactive(Object.fromEntries(TERMS.map((t) => [t.id, false])))
const allAgreed = computed(() => TERMS.every((t) => agreed[t.id]))
const openTerm = ref(null)
function toggleAll() {
  const next = !allAgreed.value
  TERMS.forEach((t) => (agreed[t.id] = next))
}
function agreeOne(id) {
  agreed[id] = true
  openTerm.value = null
}

// 프로필
const nickname = ref('')
const username = ref('')
const nicknameError = ref('')
const usernameError = ref('')

const fileInput = ref(null)
const photo = ref(null)
const preview = ref('')

const canFinish = computed(() => nickname.value.trim() && username.value.trim())
watch(nickname, () => (nicknameError.value = ''))
watch(username, (v) => {
  usernameError.value = ''
  const lower = v.toLowerCase()
  if (lower !== v) username.value = lower
})

async function onPhoto(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return showToast('10MB 이하 사진을 골라주세요')
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  }).catch(() => null)
  if (!dataUrl) return showToast('사진을 읽지 못했어요. 다른 사진을 골라주세요')
  preview.value = await compressImage(dataUrl)
  photo.value = dataUrlToFile(preview.value, file.name)
}
function clearPhoto() {
  photo.value = null
  preview.value = ''
}

async function submitTerms() {
  saving.value = true
  try {
    await api.post('/api/auth/terms')
    needTerms.value = false
    if (needProfile.value) step.value = 'profile'
    else finish()
  } catch {
    showToast('저장하지 못했어요. 잠시 뒤 다시 시도해주세요')
  } finally {
    saving.value = false
  }
}

async function submitProfile() {
  const nick = nickname.value.trim()
  const name = username.value.trim()
  if (containsProfanity(nick)) return (nicknameError.value = '쓰면 안 되는 말이 들어 있어요')
  if (!USERNAME_PATTERN.test(name)) return (usernameError.value = '영문 소문자·숫자·밑줄(_)로 12자까지 적어주세요')

  saving.value = true
  try {
    await api.post('/api/auth/complete', { username: name, nickname: nick })
  } catch (e) {
    saving.value = false
    if (e.response?.status === 409) usernameError.value = '이미 누가 쓰는 아이디예요. 다른 걸 적어주세요'
    else showToast(e.response?.data?.message || '저장하지 못했어요. 잠시 뒤 다시 시도해주세요')
    return
  }
  // 사진은 프로필 저장 API로. 실패해도 설정은 끝난 것으로 두고 알려만 준다
  if (photo.value) {
    try {
      const fd = new FormData()
      fd.append('profile_picture', photo.value)
      await api.patch('/api/user-profile/save', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    } catch {
      showToast('사진은 저장하지 못했어요. 내 정보에서 다시 넣어주세요')
    }
  }
  saving.value = false
  markOnboarded()
  step.value = 'neighborhood'
}

function onNeighborhood(data) {
  showToast(`${data.neighborhoods.find((n) => n.active)?.name ?? '동네'} 인증을 마쳤어요`)
  finish()
}

function finish() {
  markOnboarded()
  const back = takeReturnTo()
  router.replace(back || { path: '/', query: { welcome: '1' } })
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/auth/onboarding')
    needTerms.value = !data.termsAgreed
    needProfile.value = !data.onboarded
    if (!needTerms.value && !needProfile.value) return finish()
    step.value = needTerms.value ? 'terms' : 'profile'
    steps.value = [needTerms.value && 'terms', ...(needProfile.value ? ['profile', 'neighborhood'] : [])].filter(Boolean)
    // 자동으로 붙은 아이디(u_...)는 비워 두고, 사람이 정한 것만 채운다
    username.value = data.username?.startsWith('u_') ? '' : data.username || ''
    // 아이디로 막 가입했으면 그 아이디를 채워 둔다 (같은 걸 두 번 묻지 않게)
    if (!username.value) {
      let signupId = ''
      try {
        signupId = (sessionStorage.getItem('signup_id') || '').toLowerCase()
      } catch {
        // 저장소를 못 쓰면 빈칸으로 둔다
      }
      if (USERNAME_PATTERN.test(signupId)) username.value = signupId
    }
  } catch {
    // 401이면 api.js가 시작 화면으로 보낸다
  } finally {
    loading.value = false
  }
})
</script>
