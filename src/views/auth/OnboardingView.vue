<template>
  <div class="min-h-dvh bg-canvas flex flex-col">
    <!-- 한 화면이라 단계 막대가 없다 (목적 판정 11/11 부분 1 다시 훑기: 약관·닉네임·동네 세 화면 → 한 화면) -->
    <div class="pt-safe h-6"></div>

    <main v-if="loading" class="flex-1 max-w-md w-full mx-auto px-4 pt-8 space-y-4">
      <UiSkeleton class="h-8 w-2/3" />
      <UiSkeleton class="h-4 w-1/2" />
      <UiSkeleton class="h-32 w-full mt-8" />
    </main>

    <!-- 약관만 남은 사람(예전 가입자) -->
    <main v-else-if="step === 'terms'" class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-32">
      <!-- 가입 길잡이 콕이 (docs/mascots.md) -->
      <MatchMascot who="kok" mood="smile" :size="56" class="mb-3" />
      <h1 class="t-title">약관을 확인해 주세요</h1>
      <p class="t-body text-fg-muted mt-2">
        그동안 동의를 기록하지 못했어요. 한 번만 확인해 주세요.
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
          <div v-for="t in CHECKS" :key="t.id" class="flex items-center pl-4 pr-1 h-12">
            <button type="button" role="checkbox" :aria-checked="agreed[t.id]" class="flex-1 flex items-center gap-3 h-full text-left" @click="agreed[t.id] = !agreed[t.id]">
              <UiIcon name="fas fa-check" class="w-6 text-center" :class="agreed[t.id] ? 'text-primary' : 'text-line-strong'" aria-hidden="true" />
              <span class="text-sm text-fg">{{ t.title }} <span class="text-fg-subtle">(필수)</span></span>
            </button>
            <UiButton v-if="t.body" variant="ghost" size="sm" @click="openTerm = t">보기</UiButton>
          </div>
        </div>
      </UiCard>
    </main>

    <!-- 닉네임 + (처음이면) 약관 한 줄. 아이디는 자동으로 지어 접어 둔다 -->
    <main v-else class="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-40">
      <h1 class="t-title">어떻게 불러드릴까요?</h1>
      <p class="t-body text-fg-muted mt-2">상대에게 보이는 이름이에요.</p>

      <!-- 사진은 묻지 않는다. 등급을 남기러 온 사람이 이 순간 고를 이유가 없고, 큰 동그라미가 '해야 하나' 멈추게 했다. 내 정보 편집에 있다 (목적 판정 11/11 부분 1) -->
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
        <!-- 아이디는 접어 둔다: 가입 때 적은 아이디, 소셜 가입이면 서버가 지어 둔 아이디(u_…). 영문 아이디를 지어내야 '다음'이 눌리던 것을 없앴다 (목적 판정 11/11 부분 1) -->
        <p v-if="username && !editingUsername" class="t-caption">
          친구가 찾는 아이디 <b class="text-fg">@{{ username }}</b>
          <button type="button" class="underline underline-offset-2 ml-1" @click="editingUsername = true">바꾸기</button>
        </p>
        <UiInput
          v-else
          v-model="username"
          label="아이디"
          icon="fas fa-at"
          :maxlength="12"
          placeholder="영문 소문자·숫자·밑줄(_)"
          hint="친구가 나를 찾을 때 써요"
          :error="usernameError"
          autocomplete="username"
        />
      </div>

      <!-- 처음 가입이면 약관을 같은 화면에 한 줄로. '동의하고 다음'을 한 번 더 누르지 않게 -->
      <div v-if="needTerms" class="mt-8">
        <button type="button" role="checkbox" :aria-checked="allAgreed" class="w-full flex items-center gap-3 min-h-[48px] text-left" @click="toggleAll">
          <span class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" :class="allAgreed ? 'bg-primary text-primary-on' : 'border-2 border-line-strong'">
            <UiIcon name="fas fa-check" class="text-xs" v-if="allAgreed" aria-hidden="true" />
          </span>
          <span class="text-sm text-fg">모두 동의 <span class="text-fg-subtle">(이용약관·개인정보·만 14세 이상)</span></span>
        </button>
        <p class="t-micro mt-1 pl-9">
          <template v-for="(t, i) in CHECKS.filter((c) => c.body)" :key="t.id"><span v-if="i"> · </span><button type="button" class="underline underline-offset-2 min-h-[32px]" @click="openTerm = t">{{ t.title }} 보기</button></template>
        </p>
      </div>
    </main>

    <!-- 하단 버튼 -->
    <div v-if="!loading" class="fixed bottom-0 inset-x-0 bg-canvas pb-safe">
      <div class="max-w-md mx-auto px-4 py-3">
        <UiButton v-if="step === 'terms'" block size="lg" :disabled="!allAgreed" :loading="saving" @click="submitTerms">동의하고 계속하기</UiButton>
        <UiButton v-else block size="lg" :disabled="!canFinish" :loading="saving" @click="submitProfile">시작하기</UiButton>
        <!-- 잘못 들어온 계정이면 빠져나갈 길 (목적 판정 11/11 부분 1) -->
        <button type="button" class="block mx-auto mt-1 t-micro underline underline-offset-2 min-h-[36px]" @click="otherAccount">다른 계정으로 시작</button>
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
// 첫 설정: 한 화면에 닉네임 + 약관 한 줄. 아이디는 지어 둔 것을 접어 둔다.
// 동네는 묻지 않는다: 경기를 열거나 신청할 때 서버가 428을 주면 api.js가 /neighborhood로 보내고 하던 화면으로 돌려보낸다 (목적 판정 11/11 부분 1)
// 사진·나이·성별·소개·소속도 묻지 않는다 (프로필에서 나중에 채운다)
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { AGREEMENTS as TERMS } from '../../content/legal'
import { UiButton, UiCard, UiInput, UiSheet, UiSkeleton } from '../../components/ui'
import MatchMascot from '../../components/mascot/MatchMascot.vue'
import { useToast } from '../../composables/useToast'
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

// 약관 + 만 14세 이상 (당근처럼 가입 때 필수로 체크만 받는다. 본인인증은 만나서 하는 경기에서)
const CHECKS = [...TERMS, { id: 'age14', title: '만 14세 이상이에요' }]
const agreed = reactive(Object.fromEntries(CHECKS.map((t) => [t.id, false])))
const allAgreed = computed(() => CHECKS.every((t) => agreed[t.id]))
const openTerm = ref(null)
function toggleAll() {
  const next = !allAgreed.value
  CHECKS.forEach((t) => (agreed[t.id] = next))
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
// 아이디 칸은 접어 둔다. 이미 쓰는 아이디라 막히면 다시 편다
const editingUsername = ref(false)
watch(usernameError, (e) => e && (editingUsername.value = true))

const canFinish = computed(() => nickname.value.trim() && username.value.trim() && (!needTerms.value || allAgreed.value))
watch(nickname, () => (nicknameError.value = ''))
watch(username, (v) => {
  usernameError.value = ''
  const lower = v.toLowerCase()
  if (lower !== v) username.value = lower
})

async function submitTerms() {
  saving.value = true
  try {
    await api.post('/api/auth/terms')
    needTerms.value = false
    finish()
  } catch {
    showToast('저장하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    saving.value = false
  }
}

async function submitProfile() {
  const nick = nickname.value.trim()
  const name = username.value.trim()
  if (containsProfanity(nick)) return (nicknameError.value = '쓰면 안 되는 말이 들어 있어요')
  if (!USERNAME_PATTERN.test(name)) return (usernameError.value = '영문 소문자·숫자·밑줄(_)로 12자까지 적어 주세요')

  saving.value = true
  try {
    if (needTerms.value) {
      await api.post('/api/auth/terms')
      needTerms.value = false
    }
    await api.post('/api/auth/complete', { username: name, nickname: nick })
  } catch (e) {
    saving.value = false
    if (e.response?.status === 409) usernameError.value = '이미 누가 쓰는 아이디예요. 다른 걸 적어 주세요'
    else showToast(e.response?.data?.message || '저장하지 못했어요. 잠시 뒤 다시 해 주세요')
    return
  }
  saving.value = false
  finish()
}

function otherAccount() {
  try { localStorage.removeItem('raspy_access_token2') } catch { /* 없음 */ }
  window.location.replace('/init')
}

function finish() {
  markOnboarded()
  const back = takeReturnTo()
  router.replace(back || '/')
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/auth/onboarding')
    needTerms.value = !data.termsAgreed
    needProfile.value = !data.onboarded
    if (!needTerms.value && !needProfile.value) return finish()
    step.value = needProfile.value ? 'profile' : 'terms'
    username.value = data.username || ''
    // 아이디로 막 가입했으면 그 아이디를 채워 둔다 (같은 걸 두 번 묻지 않게)
    if (!username.value || username.value.startsWith('u_')) {
      let signupId = ''
      try {
        signupId = (sessionStorage.getItem('signup_id') || '').toLowerCase()
      } catch {
        // 저장소를 못 쓰면 빈칸으로 둔다
      }
      if (USERNAME_PATTERN.test(signupId)) {
        username.value = signupId
      }
    }
  } catch {
    // 401이면 api.js가 시작 화면으로 보낸다
  } finally {
    loading.value = false
  }
})
</script>
