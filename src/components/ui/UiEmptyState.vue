<template>
  <div class="flex flex-col items-center text-center py-14 px-6">
    <!-- 오류·막힘만 아이콘으로 (빈 것과 헷갈리지 않게). 비었을 때는 그곳의 캐릭터: 다음 할 일이 있으면 웃고, 없으면 담담하게 (11/6 픽셀판) -->
    <span v-if="isError" class="w-14 h-14 mb-5 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-muted" aria-hidden="true">
      <UiIcon :name="icon" class="text-[26px]" />
    </span>
    <span v-else class="mb-4" aria-hidden="true"><MatchMascot :who="mascot || 'match'" :size="72" :mood="mood || ($slots.default ? 'smile' : 'sad')" /></span>
    <p class="t-heading">{{ title }}</p>
    <p v-if="description" class="t-caption mt-2 max-w-[30ch]">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6"><slot /></div>
  </div>
</template>

<script setup>
// 비어 있을 때: 무엇이 없는지 + 다음에 할 일(버튼). 빈 화면은 브랜드가 말을 거는 자리라 얼굴을 쓴다.
// icon은 오류·막힘 표시(못 불러옴·연결 끊김·없는 주소·비공개)일 때만 그린다. 예전 face prop은 이제 기본이라 받기만 한다
import { computed, defineProps } from 'vue'
import MatchMascot from '../mascot/MatchMascot.vue'
const props = defineProps({
  icon: { type: String, default: '' },
  face: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** 그 화면이 속한 곳의 캐릭터 (docs/mascots.md): dol 앱 게임·퍼즐, tong 소식·응원·모임·동호회·대회, kok 처음·안내·동네 설정, bibi AI·연습. 없으면 매치 */
  mascot: { type: String, default: '' },
  /** 표정을 정할 때만 (끝냈어요 같은 빈 화면은 smile, 만든 순간은 cheer). 없으면 버튼이 있으면 웃고 없으면 담담 */
  mood: { type: String, default: '' },
})
const ERROR_ICONS = ['triangle-exclamation', 'rotate-right', 'plug-circle-exclamation', 'user-slash', 'circle-xmark', 'circle-question', 'eye-slash']
const isError = computed(() => ERROR_ICONS.some((e) => props.icon.includes(e)))
</script>
