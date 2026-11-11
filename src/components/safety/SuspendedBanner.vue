<template>
  <!-- 맨 위에 고정이라 위 막대(뒤로·제목)를 덮었다: 닫을 수 있게 하고, 다시 열면(앱을 새로 켜면) 다시 보인다 (경로 1 리뷰 N11) -->
  <div v-if="(message || offlineBan) && !dismissed" class="fixed inset-x-0 top-0 z-toast pt-safe pointer-events-none" role="alert">
    <div class="mx-4 mt-2 rounded-xl bg-surface-2 border border-line-strong px-4 py-3 flex items-start gap-3 text-sm pointer-events-auto">
      <UiIcon name="fas fa-ban" class="text-danger mt-0.5" aria-hidden="true" />
      <span v-if="message" class="flex-1 text-fg">{{ message }}. 보기는 되지만 신청·메시지·경기 열기는 할 수 없어요
        <!-- 나이 확인 정지는 휴대폰 본인인증으로 바로 풀 수 있다 (안전·신뢰 H). 본인인증이 열려 있을 때만: 준비 전엔 눌러 봐야 '준비 중'이었다 -->
        <RouterLink v-if="message.includes('만 14세') && identityOpen" to="/verify" class="block mt-1 font-semibold underline underline-offset-2">휴대폰 본인인증으로 풀기</RouterLink>
        <!-- 잘못 신고받아 정지됐다면 물을 곳이 있어야 한다 (11/11 다른 사람 전수표) -->
        <a v-else :href="contactMailto('이용 정지 문의')" class="block mt-1 underline underline-offset-2">잘못된 것 같으면 문의하기</a>
      </span>
      <span v-else class="flex-1 text-fg">노쇼가 거듭 기록돼 {{ offlineBan }}까지 만나서 하는 경기를 열거나 신청할 수 없어요. 앱 게임은 그대로 돼요
        <!-- 노쇼 기록마다 이의는 그 경기 화면에서 낸다. 여기서는 물을 곳을 -->
        <a :href="contactMailto('노쇼 기록 문의')" class="block mt-1 underline underline-offset-2">잘못된 것 같으면 문의하기</a>
      </span>
      <button type="button" class="-mr-1 -mt-1 w-8 h-8 flex items-center justify-center text-fg-muted flex-shrink-0" aria-label="닫기" @click="dismissed = true">
        <UiIcon name="xmark" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup>
// 이용 정지 안내 (안전·신뢰 A, 11/3). 정지 중이면 서버가 쓰기를 403으로 막고, 여기서는 왜 막혔는지 맨 위에 한 줄로 알린다.
// 로그인했을 때만 묻고, 변경 신호·앱으로 돌아올 때 다시 묻는다 (폴링 없음)
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '../../api/client'
import { refreshOnChange } from '../../websocket/userChannel'
import UiIcon from '../ui/UiIcon.vue'
import { contactMailto } from '../../config/contact'

const message = ref(null)
const dismissed = ref(false)
const identityOpen = ref(false)
// 노쇼 처벌로 만나서 하는 경기만 막혔을 때 (안전·신뢰 C). 그 화면들(홈·경기 만들기)에서만 띄운다
const offlineBanUntil = ref(null)
const offlineBan = computed(() => {
  if (!offlineBanUntil.value || !['/', '/create-game', '/game'].includes(route.path)) return null
  const d = new Date(offlineBanUntil.value)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
})
const route = useRoute()

async function load() {
  if (!localStorage.getItem('raspy_access_token2')) { message.value = null; offlineBanUntil.value = null; return }
  try {
    const { data } = await GET('/api/safety/me')
    message.value = data?.suspendedMessage || null
    if (message.value?.includes('만 14세')) identityOpen.value = !!(await GET('/api/identity').catch(() => ({ data: null }))).data?.available
    offlineBanUntil.value = data?.offlineBannedUntil || null
  } catch {
    // 서버가 안 될 때는 App의 '서버에 연결하지 못했어요'가 알린다
  }
}

let stop = null
onMounted(() => { load(); stop = refreshOnChange(load) })
onBeforeUnmount(() => stop?.())
// 로그인·로그아웃 뒤에도 맞게: 화면을 옮길 때 1분에 한 번까지만 다시 묻는다
let last = 0
watch(() => route.path, () => { if (Date.now() - last > 60_000) { last = Date.now(); load() } })
</script>
