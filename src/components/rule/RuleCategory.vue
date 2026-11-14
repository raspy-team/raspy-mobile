<template>
  <section class="py-6 border-b border-line">
    <h2 class="t-heading">이런 게임이에요</h2>

    <!-- ② 잘하려면 필요한 것 (그대로 능력치가 된다) -->
    <p class="t-caption mt-4">잘하려면</p>
    <div class="flex flex-wrap gap-2 mt-2">
      <span v-for="a in category.abilities" :key="a.key" class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-surface-2 text-sm font-medium">
        {{ a.label }}<span class="t-micro">{{ GROUP[a.group ?? ""] }}</span>
      </span>
    </div>

    <!-- 찾기 상황 네 가지 + 운 -->
    <dl class="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3">
      <template v-for="row in rows" :key="row.label">
        <dt class="t-caption">{{ row.label }}</dt>
        <dd class="t-body">{{ row.value }}</dd>
      </template>
    </dl>

    <!-- 성질 (해당할 때만). 위험은 따로 눈에 띄게 -->
    <div v-if="badges.length" class="flex flex-wrap gap-1.5 mt-5">
      <UiBadge v-for="b in badges" :key="b.key" :tone="b.key === 'DANGER' ? 'danger' : 'neutral'" :icon="TRAIT_ICON[b.key]">{{ b.label }}</UiBadge>
    </div>
    <p v-if="danger" class="t-caption text-danger-fg mt-2">다칠 수 있는 게임이에요. 무리하지 마세요</p>
  </section>
</template>

<script setup lang="ts">
// 규칙 상세의 카테고리 (docs/direction.md '카테고리'). ① 맞닿는 방식은 고르는 사람에게 보이지 않으므로 빼고,
// ② 능력 · 찾기 상황 · ③ 운 · 성질만 보여 준다
import { computed } from 'vue'
import { UiBadge } from '../ui'
import type { CategoryView } from '@/utils/category'

const props = defineProps<{ category: CategoryView }>()

const GROUP: Record<string, string> = { BODY: '몸', MIND: '머리', HEART: '마음' }
const TRAIT_ICON: Record<string, string> = {
  HIDDEN_INFO: 'fas fa-eye-slash',
  ASYMMETRIC: 'fas fa-user-group',
  PREP: 'fas fa-layer-group',
  MONEY: 'coins',
  DANGER: 'fas fa-triangle-exclamation',
}

const labels = (xs: { label: string }[]) => xs.map((x) => x.label).join(' · ')
const rows = computed(() => {
  const c = props.category
  return [
    { label: '어디서', value: labels(c.places) },
    { label: '몇 명', value: labels(c.parties) },
    { label: '얼마나', value: c.length.label },
    { label: '준비물', value: labels(c.gears) },
    { label: '운', value: c.luck.key === 'NONE' ? '없음 (실력만)' : c.luck.label },
  ]
})
const badges = computed(() => props.category.traits)
const danger = computed(() => props.category.traits.some((t) => t.key === 'DANGER'))
</script>
