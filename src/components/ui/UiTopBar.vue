<template>
  <header class="fixed top-0 inset-x-0 z-header bg-canvas border-b border-line pt-safe">
    <div class="max-w-4xl mx-auto h-14 px-2 flex items-center gap-1">
      <button v-if="back" type="button" class="w-11 h-11 flex items-center justify-center text-fg" aria-label="뒤로" @click="goBack">
        <i class="fas fa-chevron-left text-lg" aria-hidden="true"></i>
      </button>
      <h1 v-if="title" class="flex-1 min-w-0 truncate" :class="back ? 't-body font-bold' : 't-title px-2'">{{ title }}</h1>
      <div v-else class="flex-1"></div>
      <div class="flex items-center"><slot name="right" /></div>
    </div>
  </header>
  <!-- 고정된 바 높이만큼 내용을 밀어낸다 -->
  <div class="h-14 pt-safe" aria-hidden="true"></div>
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
})
const router = useRouter()
function goBack() {
  if (typeof props.back === 'string') router.push(props.back)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>
