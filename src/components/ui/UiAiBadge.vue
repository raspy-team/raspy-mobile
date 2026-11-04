<template>
  <!-- AI 주민 표시 (docs/ai-residents.md). 사람 이름이 나오는 곳이면 이름 바로 뒤에 둔다: <span>{{ name }}</span><UiAiBadge v-if="p.isBot" /> -->
  <span
    class="inline-flex items-center align-middle shrink-0 ml-1 px-1.5 h-[1.125rem] rounded-sm bg-surface-3 text-fg-muted text-[0.6875rem] font-semibold leading-none tracking-normal"
    title="AI 주민 · 매치가 만든 연습 상대예요"
    aria-label="AI 주민"
  >AI</span>
</template>
