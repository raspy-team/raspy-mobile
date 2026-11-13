<template>
  <!-- 아이폰은 키보드가 열리면 화면을 위로 밀어 올려, 고정 바가 시계·노치 밑으로 들어갔다 (11/13 실제 기기 한 바퀴).
       보이는 화면(visualViewport)의 맨 위를 따라가게 한다 -->
  <header class="fixed top-0 inset-x-0 z-header bg-canvas pt-safe" :style="shift ? { transform: `translateY(${shift}px)` } : undefined">
    <div class="max-w-4xl mx-auto h-14 px-2 flex items-center gap-1">
      <button v-if="back" type="button" class="w-11 h-11 flex items-center justify-center text-fg" aria-label="뒤로" @click="goBack">
        <UiIcon name="chevron-left" class="text-[22px]" />
      </button>
      <h1 v-if="title" class="flex-1 min-w-0 truncate" :class="back ? 'text-base font-semibold tracking-[-0.02em]' : 't-title px-2'">{{ title }}</h1>
      <div v-else class="flex-1"></div>
      <div class="flex items-center"><slot name="right" /></div>
    </div>
  </header>
  <!-- 고정된 바 높이만큼 내용을 밀어낸다. box-content: 노치 여백을 h-14 안이 아니라 위에 더한다
       (border-box면 홈 화면 앱에서 노치 높이만큼 내용이 바 밑에 가려진다) -->
  <div class="h-14 pt-safe box-content" aria-hidden="true"></div>
</template>

<script setup>
// 화면 맨 위 바.
// - 탭 화면(경기·피드·내 경기·내 정보): 왼쪽에 큰 제목
// - 들어간 화면: 뒤로 버튼 + 제목
// 오른쪽 아이콘 버튼은 #right 슬롯에 UiIconButton으로
import { defineProps, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { takePendingOverlay } from '../../composables/useOverlay'

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: [Boolean, String], default: false }, // true면 이전 화면. 문자열은 앱 안에서 온 곳이 없을 때(링크로 바로 열었을 때) 갈 주소
})
const router = useRouter()

// 키보드가 화면을 밀어 올린 만큼 바를 내린다 (iOS: 고정 요소가 밀린 화면을 따라 위로 사라진다)
const shift = ref(0)
const vv = typeof window !== 'undefined' ? window.visualViewport : null
const follow = () => { shift.value = vv && vv.offsetTop > 0 ? Math.round(vv.offsetTop) : 0 }
onMounted(() => { vv?.addEventListener('scroll', follow); vv?.addEventListener('resize', follow) })
onBeforeUnmount(() => { vv?.removeEventListener('scroll', follow); vv?.removeEventListener('resize', follow) })

// 뒤로는 늘 온 곳으로 (목적 판정 11/11 8번). 예전엔 주소를 정해 둔 25곳이 그 주소로 '앞으로' 가서
// 규칙 고르다 홈으로, 차단 뒤 내 프로필로, 교류전에서 동호회 목록으로 떨어졌다.
// 앱 안에서 온 기록은 vue-router가 history.state.back에 적어 둔다(시트가 쌓는 칸도 이 값을 이어받는다).
// history.length는 앞으로 칸까지 세서 공유 링크로 연 첫 화면에서 눌러도 아무 일이 없었다
function goBack() {
  // 방금 닫힌 시트의 칸이 아직 남아 있으면 그것까지 함께 걷는다 (한 번은 아무 일이 없던 것, 경로 8 2절)
  const extra = takePendingOverlay()
  if (window.history.state?.back) router.go(-1 - extra)
  else router.push(typeof props.back === 'string' ? props.back : '/')
}
</script>
