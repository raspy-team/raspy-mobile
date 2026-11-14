<template>
  <!-- 홈 아래 소식 몇 줄 (11/13 앱 기능 좁히기: 소식 탭을 홈에 합쳤다). 소식이 없으면 칸째 숨긴다 -->
  <section v-if="items.length" class="mt-10" aria-label="소식">
    <div class="flex items-center justify-between mb-2">
      <h2 class="t-heading">소식</h2>
      <UiButton size="sm" variant="ghost" class="-mr-2" to="/feed">모두 보기</UiButton>
    </div>
    <UiList>
      <UiListItem
        v-for="p in items"
        :key="p.id"
        :title="line(p)"
        :subtitle="sub(p)"
        chevron
        @click="router.push({ path: '/feed', query: { gameId: String(p.id) } })"
      >
        <template #leading>
          <RuleThumb :rule="{ ruleTitle: p.rule?.ruleTitle, minorCategory: p.rule?.minorCategory, appGameKey: p.rule?.appGameKey }" :size="36" bare />
        </template>
      </UiListItem>
    </UiList>
  </section>
</template>

<script setup lang="ts">
// 홈 아래 소식: 내 동네 소식 셋. 한 줄은 그 판의 이야기 첫 줄(있으면), 없으면 누가 무엇을 했나. 누르면 소식에서 그 판으로
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import type { components } from '@/api/schema'
import RuleThumb from '../rule/RuleThumb.vue'
import { UiButton, UiList, UiListItem } from '../ui'
import { timeAgo } from '../../utils/format'

type Item = components['schemas']['FeedItemResponse']
const router = useRouter()
const items = ref<Item[]>([])

const names = (p: Item) => (p.players ?? []).map((x) => x.name).filter(Boolean).join(' · ')
// 이야기 첫 줄이 없으면 누가 이겼는지라도 (11/13 실제 기기 한 바퀴: '러닝 · A · B'만으로는 무슨 일인지 몰랐다)
const outcome = (p: Item) => {
  const w = p.result?.winner
  if (w) return `${w}님이 이겼어요`
  if (p.result && p.isCompleted) return `${names(p)} 비겼어요`
  return p.isCompleted ? names(p) : `${names(p)} 하는 중` // 결과 없이 이름만 있으면 무슨 일인지 몰랐다
}
const line = (p: Item) => p.story?.beats?.[0]?.text || outcome(p)
const sub = (p: Item) => [p.rule?.ruleTitle, p.story?.beats?.[0]?.text ? '' : (p.result?.winner ? names(p) : ''), p.date ? timeAgo(p.date) : ''].filter(Boolean).join(' · ')

onMounted(async () => {
  try {
    const { data } = await api.get('/api/feed', { params: { page: 0, size: 3, scope: 'near' } })
    items.value = (data?.items ?? []).slice(0, 3)
  } catch {
    items.value = [] // 소식을 못 받아도 홈은 그대로
  }
})
</script>
