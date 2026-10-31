<template>
  <div class="min-h-dvh bg-canvas flex flex-col">
    <!-- 단계 표시 (두 단계일 때만) -->
    <div class="pt-safe">
      <div class="max-w-md mx-auto px-4 h-14 flex items-center gap-1">
        <div v-if="twoSteps" class="flex-1 flex gap-1.5 px-2" aria-hidden="true">
          <span class="h-1 flex-1 rounded-full bg-primary"></span>
          <span class="h-1 flex-1 rounded-full" :class="step === 'profile' ? 'bg-primary' : 'bg-line-strong'"></span>
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
            <i v-if="allAgreed" class="fas fa-check text-xs" aria-hidden="true"></i>
          </span>
          <span class="t-heading">모두 동의</span>
        </button>
        <div class="border-t border-line">
          <div v-for="t in TERMS" :key="t.id" class="flex items-center pl-4 pr-1 h-12">
            <button type="button" role="checkbox" :aria-checked="agreed[t.id]" class="flex-1 flex items-center gap-3 h-full text-left" @click="agreed[t.id] = !agreed[t.id]">
              <i class="fas fa-check w-6 text-center" :class="agreed[t.id] ? 'text-primary' : 'text-line-strong'" aria-hidden="true"></i>
              <span class="text-sm text-fg">{{ t.title }} <span class="text-fg-subtle">(필수)</span></span>
            </button>
            <UiButton variant="ghost" size="sm" @click="openTerm = t">보기</UiButton>
          </div>
        </div>
      </UiCard>
    </main>

    <!-- 2. 닉네임 · 지역 · 사진 -->
    <main v-else class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-32">
      <h1 class="t-title">어떻게 불러드릴까요?</h1>
      <p class="t-body text-fg-muted mt-2">경기 상대에게 보이는 정보예요.</p>

      <div class="mt-8 flex flex-col items-center gap-2">
        <button type="button" class="relative" aria-label="프로필 사진 고르기" @click="fileInput?.click()">
          <UiAvatar :src="preview" :name="nickname || '나'" size="xl" />
          <span class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-2 border border-line text-fg flex items-center justify-center text-sm">
            <i class="fas fa-camera" aria-hidden="true"></i>
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
        <UiField label="활동 지역" hint="가까운 경기를 먼저 보여드려요">
          <div class="grid grid-cols-2 gap-2">
            <UiSelect v-model="region1" :options="region1Options" placeholder="시·도" />
            <UiSelect v-model="region2" :options="region2Options" placeholder="구·시·군" :disabled="!region1" />
          </div>
        </UiField>
      </div>
    </main>

    <!-- 하단 버튼 -->
    <div v-if="!loading" class="fixed bottom-0 inset-x-0 bg-canvas pb-safe">
      <div class="max-w-md mx-auto px-4 py-3">
        <UiButton v-if="step === 'terms'" block size="lg" :disabled="!allAgreed" :loading="saving" @click="submitTerms">
          동의하고 {{ needProfile ? '다음' : '계속하기' }}
        </UiButton>
        <UiButton v-else block size="lg" :disabled="!canFinish" :loading="saving" @click="submitProfile">시작하기</UiButton>
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
// 첫 설정: ① 약관 동의 ② 닉네임·아이디·지역(+사진). 필요한 단계만 보여준다
// 나이·성별·소개·소속은 묻지 않는다 (프로필에서 나중에 채운다)
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import regionMap from '../../assets/regionMap.json'
import { AGREEMENTS as TERMS } from '../../content/legal'
import { UiAvatar, UiButton, UiCard, UiField, UiInput, UiSelect, UiSheet, UiSkeleton } from '../../components/ui'
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
const twoSteps = ref(false) // 처음에 두 단계였는지 (단계 표시용)

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
const region1 = ref('')
const region2 = ref('')
const region1Options = Object.keys(regionMap).filter((r) => r !== '전국')
const region2Options = computed(() => regionMap[region1.value] || [])
watch(region1, () => (region2.value = ''))

const fileInput = ref(null)
const photo = ref(null)
const preview = ref('')

const canFinish = computed(() => nickname.value.trim() && username.value.trim() && region1.value && region2.value)
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
  // 지역·사진은 프로필 저장 API로. 실패해도 설정은 끝난 것으로 두고 알려만 준다
  try {
    const fd = new FormData()
    fd.append('region', `${region1.value} ${region2.value}`)
    if (photo.value) fd.append('profile_picture', photo.value)
    await api.patch('/api/user-profile/save', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  } catch {
    showToast('지역·사진은 저장하지 못했어요. 내 정보에서 다시 넣어주세요')
  }
  saving.value = false
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
    twoSteps.value = needTerms.value && needProfile.value
    // 자동으로 붙은 아이디(u_...)는 비워 두고, 사람이 정한 것만 채운다
    username.value = data.username?.startsWith('u_') ? '' : data.username || ''
  } catch {
    // 401이면 api.js가 시작 화면으로 보낸다
  } finally {
    loading.value = false
  }
})
</script>
