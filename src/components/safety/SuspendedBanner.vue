<template>
  <div v-if="message || offlineBan" class="fixed inset-x-0 top-0 z-toast pt-safe pointer-events-none" role="alert">
    <div class="mx-4 mt-2 rounded-xl bg-surface-2 border border-line-strong px-4 py-3 flex items-start gap-3 text-sm pointer-events-auto">
      <UiIcon name="fas fa-ban" class="text-danger mt-0.5" aria-hidden="true" />
      <span v-if="message" class="flex-1 text-fg">{{ message }}. 보기는 되지만 신청·메시지·경기 열기는 할 수 없어요
        <!-- 나이 확인 정지는 휴대폰 본인인증으로 바로 풀 수 있다 (안전·신뢰 H) -->
        <RouterLink v-if="message.includes('만 14세')" to="/verify" class="block mt-1 font-semibold underline underline-offset-2">휴대폰 본인인증으로 풀기</RouterLink>
      </span>
      <span v-else class="flex-1 text-fg">노쇼가 거듭 기록돼 {{ offlineBan }}까지 만나서 하는 경기를 열거나 신청할 수 없어요. 앱 게임은 그대로 돼요</span>
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

const message = ref(null)
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
