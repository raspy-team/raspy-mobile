<template>
  <div class="flex flex-col items-center text-center py-14 px-6">
    <!-- 오류만 아이콘으로 (빈 것과 헷갈리지 않게). 비었을 때는 매치 얼굴: 다음 할 일이 있으면 웃고, 없으면 담담하게 (11/3) -->
    <span v-if="isError" class="w-14 h-14 mb-5 rounded-2xl bg-surface-2 flex items-center justify-center text-fg-muted" aria-hidden="true">
      <UiIcon :name="icon" class="text-[26px]" />
    </span>
    <span v-else-if="mascot" class="mb-5 text-fg" aria-hidden="true"><MatchMascot :who="mascot" :size="64" :mood="$slots.default ? 'smile' : 'sad'" /></span>
    <span v-else class="mb-5 text-fg" aria-hidden="true"><BrandFace :size="56" :mood="$slots.default ? 'smile' : 'neutral'" /></span>
    <p class="t-heading">{{ title }}</p>
    <p v-if="description" class="t-caption mt-1.5 max-w-[30ch]">{{ description }}</p>
    <div v-if="$slots.default" class="mt-6"><slot /></div>
  </div>
</template>

<script setup>
// 비어 있을 때: 무엇이 없는지 + 다음에 할 일(버튼). 빈 화면은 브랜드가 말을 거는 자리라 얼굴을 쓴다.
// icon은 오류 표시(못 불러옴·연결 끊김·없는 사람)일 때만 그린다. 예전 face prop은 이제 기본이라 받기만 한다
import { computed, defineProps } from 'vue'
import BrandFace from '../BrandFace.vue'
import MatchMascot from '../mascot/MatchMascot.vue'
const props = defineProps({
  icon: { type: String, default: '' },
  face: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** 그 화면이 속한 곳의 캐릭터 (docs/mascots.md): dol 앱 게임, tong 응원·소식·모임, kok 처음·안내, bibi AI. 없으면 매치 얼굴 */
  mascot: { type: String, default: '' },
})
const ERROR_ICONS = ['triangle-exclamation', 'rotate-right', 'plug-circle-exclamation', 'user-slash', 'circle-xmark']
const isError = computed(() => ERROR_ICONS.some((e) => props.icon.includes(e)))
</script>
