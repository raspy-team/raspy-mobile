<template>
  <UiTopBar title="비밀번호 찾기" back="/group/login" />
  <main class="px-4 pt-6 pb-32 max-w-xl mx-auto">
    <UiListSkeleton v-if="!cfg" :rows="2" />
    <template v-else-if="done">
      <h1 class="t-title">비밀번호를 바꿨어요</h1>
      <p class="t-body mt-2">새 비밀번호로 로그인해 주세요.</p>
      <UiButton block size="lg" class="mt-8" to="/group/login">로그인</UiButton>
    </template>
    <template v-else-if="!verifiedId">
      <h1 class="t-title">휴대폰 본인인증으로 찾아요</h1>
      <div class="mt-4 space-y-2 t-body">
        <p>만나서 하는 경기 전에 본인인증을 했던 아이디 계정이면, 같은 사람인지 확인하고 새 비밀번호를 정해요.</p>
        <p class="t-caption">본인인증을 한 적이 없으면 <a class="hit underline underline-offset-2" :href="mail">{{ CONTACT_EMAIL }}</a>로 아이디를 적어 보내 주세요. 카카오·구글로 시작했다면 그 버튼으로 들어오면 돼요.</p>
      </div>
      <p v-if="message" class="t-caption text-danger-fg mt-4" role="alert">{{ message }}</p>
      <UiButton v-if="cfg.available" block size="lg" class="mt-8" icon="shield-halved" :loading="busy" @click="start">휴대폰으로 본인인증</UiButton>
      <!-- 설정을 못 불러온 것과 준비 중을 가른다: 연결이 끊겨도 '준비 중'이라고 했다 (가로 훑기 10절과 같은 종류) -->
      <div v-else-if="cfgFailed" class="mt-8 text-center">
        <p class="t-caption">본인인증 정보를 불러오지 못했어요</p>
        <UiButton class="mt-3" size="sm" variant="secondary" @click="loadCfg">다시 시도</UiButton>
      </div>
      <!-- 본인인증이 준비 전이면 막다른 길 대신 문의 메일로 (고병연 11/11) -->
      <p v-else class="t-caption mt-8 rounded-xl bg-surface px-4 py-3">본인인증은 아직 준비 중이에요. <a class="hit underline underline-offset-2" :href="mail">{{ CONTACT_EMAIL }}</a>로 아이디를 적어 보내 주세요</p>
    </template>
    <!-- 인증을 먼저 하고 그다음에 적는다: 휴대폰은 인증 창이 이 주소로 돌아오며 적던 것이 사라진다 (비밀번호는 주소에 싣지 않는다) -->
    <form v-else class="space-y-4" @submit.prevent="submit">
      <h1 class="t-title">새 비밀번호를 정해요</h1>
      <UiInput v-model="loginId" label="아이디" autocomplete="username" placeholder="로그인할 때 쓰던 아이디" />
      <UiInput v-model="newPassword" label="새 비밀번호" type="password" autocomplete="new-password" hint="8~20자" :maxlength="20" />
      <p v-if="message" class="t-caption text-danger-fg" role="alert">{{ message }}</p>
      <UiButton type="submit" block size="lg" :loading="busy" :disabled="!loginId.trim() || newPassword.length < 8">바꾸기</UiButton>
    </form>
  </main>
</template>

<script setup lang="ts">
// 아이디 계정 비밀번호 찾기 (11/5). 서버는 방금 한 본인인증이 그 계정에 전에 저장된 본인인증과 같은 사람일 때만 바꾼다 (PasswordResetService)
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import { UiButton, UiInput, UiListSkeleton, UiTopBar } from '../../components/ui'
import { CONTACT_EMAIL, contactMailto } from '../../config/contact'

const route = useRoute()
const router = useRouter()
const cfg = ref<{ available: boolean; storeId?: string | null; channelKey?: string | null; verificationId: string } | null>(null)
const verifiedId = ref('')
const loginId = ref('')
const newPassword = ref('')
const busy = ref(false)
const done = ref(false)
const message = ref('')
const mail = contactMailto('비밀번호를 잊었어요')
const cfgFailed = ref(false)
// 본인인증 창(포트원)이 영어 오류를 그대로 주면 한국어로 (가로 훑기 6절)
const korean = (m: string | undefined, fallback: string) => (m && /[가-힣]/.test(m) ? m : fallback)

function loadSdk(): Promise<{ requestIdentityVerification: (o: object) => Promise<{ code?: string; message?: string } | undefined> }> {
  const w = window as unknown as { PortOne?: never }
  if (w.PortOne) return Promise.resolve(w.PortOne)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    s.onload = () => resolve((window as unknown as { PortOne: never }).PortOne)
    s.onerror = () => reject(new Error('본인인증 창을 열지 못했어요'))
    document.head.appendChild(s)
  })
}

async function start() {
  if (!cfg.value) return
  busy.value = true
  message.value = ''
  try {
    const PortOne = await loadSdk()
    const res = await PortOne.requestIdentityVerification({
      storeId: cfg.value.storeId,
      channelKey: cfg.value.channelKey,
      identityVerificationId: cfg.value.verificationId,
      redirectUrl: `${window.location.origin}/password-reset`,
    })
    if (res?.code) { message.value = korean(res.message, '인증을 마치지 않았어요'); return }
    verifiedId.value = cfg.value.verificationId
  } catch (e) {
    message.value = korean((e as Error)?.message, '인증하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function submit() {
  busy.value = true
  message.value = ''
  try {
    await POST('/api/auth/password-reset', { body: { loginId: loginId.value.trim(), identityVerificationId: verifiedId.value, newPassword: newPassword.value } })
    done.value = true
  } catch (e) {
    message.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '바꾸지 못했어요. 다시 해 주세요'
    // 서버는 인증 한 번에 시도 한 번만 받는다 (비밀번호 길이만 먼저 본다). 그 밖의 실패는 인증부터 다시: 전에는 아이디를 고쳐 다시 눌러도
    // '이미 쓴 인증'만 나오고 인증 버튼으로 돌아갈 길이 없었다. 주소의 인증 번호도 지워 새로고침해도 다시 붙지 않게 (11/5 ux-7a)
    if (!/비밀번호는/.test(message.value)) {
      verifiedId.value = ''
      router.replace({ query: {} })
    }
  } finally {
    busy.value = false
  }
}

async function loadCfg() {
  cfgFailed.value = false
  cfg.value = null
  try {
    cfg.value = (await GET('/api/auth/password-reset/config')).data
  } catch {
    cfgFailed.value = true
    cfg.value = { available: false, verificationId: '' }
  }
}

onMounted(async () => {
  await loadCfg()
  // 휴대폰에서 인증하고 돌아왔을 때
  const id = route.query.identityVerificationId
  if (id) {
    if (route.query.code) message.value = korean(route.query.message ? String(route.query.message) : undefined, '인증을 마치지 않았어요')
    else verifiedId.value = String(id)
  }
})
</script>
