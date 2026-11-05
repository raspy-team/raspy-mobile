<template>
  <header class="fixed top-0 inset-x-0 z-header bg-canvas pt-safe">
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
import { defineProps } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: [Boolean, String], default: false }, // true면 이전 화면, 문자열이면 그 주소로
  // back이 true일 때: 앞 화면이 없으면(링크로 바로 들어옴) 갈 곳. 문자열 back은 늘 그 주소로 '새로' 가서,
  // 그 주소의 뒤로(=이전 화면)가 다시 여기로 와 둘 사이에 갇혔다 (동호회 ↔ 동호회 목록, 11/5)
  fallback: { type: String, default: '' },
})
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  // 앱 안에서 온 앞 화면이 있으면 그리로 (vue-router가 history.state.back에 적는다)
  else if (window.history.state?.back) router.back()
  else if (props.fallback) router.replace(props.fallback)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
