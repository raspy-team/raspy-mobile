<template>
  <UiTopBar title="본인인증" :back="back" />
  <main class="px-4 pt-6 pb-32 max-w-xl mx-auto">
    <UiListSkeleton v-if="!cfg" :rows="2" />
    <template v-else>
      <h1 class="t-title">{{ cfg.verified ? '본인인증을 했어요' : '만나서 하기 전에 한 번만' }}</h1>
      <div class="mt-4 space-y-2 t-body">
        <p>만나서 하는 경기는 휴대폰 본인인증을 한 사람끼리 해요. 처음 보는 사람과도 안심하고 만나게요.</p>
        <p class="t-caption">이름과 전화번호는 매치에 남지 않아요. 한 사람이 한 계정만 쓰는지 확인하는 값과 생년월일만 남아요. 앱 게임은 인증 없이 할 수 있어요.</p>
      </div>
      <p v-if="message" class="t-caption text-danger-fg mt-4">{{ message }}</p>

      <UiButton v-if="cfg.verified" block size="lg" class="mt-8" @click="router.replace(back)">돌아가기</UiButton>
      <UiButton v-else-if="cfg.available" block size="lg" class="mt-8" icon="shield-halved" :loading="busy" @click="start">휴대폰으로 본인인증</UiButton>
      <p v-else class="t-caption mt-8 rounded-xl bg-surface px-4 py-3">본인인증은 아직 준비 중이에요. 지금은 인증 없이 만나서 하는 경기를 할 수 있어요</p>
    </template>
  </main>
</template>

<script setup>
// 휴대폰 본인인증 (안전·신뢰 H). 포트원 창으로 인증하고, 받은 번호를 서버가 포트원에서 직접 확인한다.
// 휴대폰 브라우저는 인증 뒤 이 주소로 돌아온다 (?identityVerificationId=...). PC는 창이 끝나면 바로 결과가 온다
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET, POST } from '../../api/client'
import { UiButton, UiListSkeleton, UiTopBar } from '../../components/ui'

const route = useRoute()
const router = useRouter()
const back = String(route.query.back || '/')
const cfg = ref(null)
const busy = ref(false)
const message = ref('')

function loadSdk() {
  if (window.PortOne) return Promise.resolve(window.PortOne)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.portone.io/v2/browser-sdk.js'
    s.onload = () => resolve(window.PortOne)
    s.onerror = () => reject(new Error('본인인증 창을 열지 못했어요'))
    document.head.appendChild(s)
  })
}

async function confirm(id) {
  busy.value = true
  try {
    const { data } = await POST('/api/identity/verify', { body: { identityVerificationId: id } })
    if (!data.verified) { message.value = data.message || '인증하지 못했어요'; return }
    cfg.value = { ...cfg.value, verified: true }
    router.replace(back)
  } catch (e) {
    message.value = e?.response?.data?.message || '인증하지 못했어요. 다시 해 주세요'
  } finally {
    busy.value = false
  }
}

async function start() {
  busy.value = true
  message.value = ''
  try {
    const PortOne = await loadSdk()
    const res = await PortOne.requestIdentityVerification({
      storeId: cfg.value.storeId,
      channelKey: cfg.value.channelKey,
      identityVerificationId: cfg.value.verificationId,
      redirectUrl: `${window.location.origin}/verify?back=${encodeURIComponent(back)}`,
    })
    if (res?.code) { message.value = res.message || '인증을 마치지 않았어요'; return }
    await confirm(cfg.value.verificationId)
  } catch (e) {
    message.value = e?.message || '인증하지 못했어요'
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  cfg.value = (await GET('/api/identity').catch(() => ({ data: { available: false, verified: false } }))).data
  // 휴대폰에서 인증하고 돌아왔을 때
  const id = route.query.identityVerificationId
  if (id && !cfg.value.verified) {
    if (route.query.code) message.value = String(route.query.message || '인증을 마치지 않았어요')
    else await confirm(String(id))
  }
})
</script>
