<template>
  <div class="min-h-dvh bg-canvas flex flex-col pt-safe pb-safe">
    <UiTopBar back />
    <main class="flex-1 w-full max-w-md mx-auto px-6 flex flex-col">
      <div class="flex-1 flex flex-col justify-center">
        <span class="text-fg face-wobble inline-block w-fit"><MatchMascot who="match" mood="wow" :size="80" /></span>
        <p class="t-mono mt-8">404</p>
        <h1 class="t-display mt-2">이 페이지는<br />없어요</h1>
        <p class="t-body text-fg-muted mt-4">주소가 바뀌었거나 지워졌어요.</p>
      </div>
      <div class="pb-6">
        <UiButton block size="lg" to="/">처음으로</UiButton>
      </div>
    </main>
  </div>
</template>

<script setup>
// 없는 주소. 매치 얼굴이 놀란 표정으로 살짝 흔들린다
import MatchMascot from '../components/mascot/MatchMascot.vue'
import { UiButton, UiTopBar } from '../components/ui'
</script>

<style>
.face-wobble { animation: face-wobble 1.6s ease-in-out 0.2s 2 both; transform-origin: 50% 90%; }
@keyframes face-wobble { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
@media (prefers-reduced-motion: reduce) { .face-wobble { animation: none; } }
</style>
