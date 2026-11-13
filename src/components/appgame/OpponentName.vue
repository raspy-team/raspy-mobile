<template>
  <!-- 판 위의 상대 이름: 이름 뒤에 AI 표시 (docs/ai-residents.md 'AI 표시'). 좁은 화면(320)에서는 이름만 줄인다 -->
  <span class="inline-flex items-center min-w-0 max-w-full align-middle">
    <span class="truncate">{{ player?.isBot ? 'AI' : player?.nickname || '상대' }}</span>
  </span>
</template>

<script setup lang="ts">
// 서버가 이미 주는 상대(AppPlayer)의 이름과 isBot만 쓴다

defineProps<{ player?: { nickname: string; isBot?: boolean } | null }>()
</script>
