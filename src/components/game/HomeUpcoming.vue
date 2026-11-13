<template>
  <!-- 홈 맨 위: 잡힌 만나서 하는 경기 (11/13 실제 기기 한 바퀴: 신청이 받아들여져도 홈엔 종 점 하나뿐이라, 내 경기가 잡혔는지 몰랐다).
       누르면 내 경기의 그 카드로 (거기서 메시지·점수판·결과) -->
  <UiSection v-if="items.length" title="잡힌 경기" class="mb-6">
    <UiList>
      <UiListItem
        v-for="g in items"
        :key="g.id"
        :title="g.title"
        :subtitle="g.sub"
        chevron
        @click="router.push({ path: '/game', query: { id: String(g.id) } })"
      >
        <template #leading><RuleThumb :rule="g.rule" :size="36" bare /></template>
      </UiListItem>
    </UiList>
  </UiSection>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import RuleThumb from '../rule/RuleThumb.vue'
import { UiList, UiListItem, UiSection } from '../ui'
import { matchTime } from '../../utils/format'
import { refreshOnChange } from '../../websocket/userChannel'

const router = useRouter()
const items = ref([])

async function load() {
  try {
    const [mine, sent] = await Promise.all([api.get('/api/games/my-games'), api.get('/api/games/my-requests')])
    const rows = [
      // 내가 연 경기: 확정(상대가 정해짐). 하는 중인 경기는 아래 '경기가 진행 중이에요' 띠가 이미 말한다 (같은 말 두 번)
      ...(mine.data || [])
        .filter((g) => g.status === 'SCHEDULED')
        .map((g) => ({ g, who: g.opponentNickname })),
      // 신청한 경기: 받아들여진 것만
      ...(sent.data || [])
        .filter((g) => g.status === 'APPROVED' && g.gameStatus === 'SCHEDULED')
        .map((g) => ({ g, who: g.ownerNickname })),
    ]
    items.value = rows
      // 가까운 시간 순 (시간 없는 것은 맨 뒤)
      .sort((a, b) => new Date(a.g.matchDate || 8e15) - new Date(b.g.matchDate || 8e15))
      .slice(0, 3)
      .map(({ g, who }) => ({
        id: g.id,
        rule: g.rule || {},
        title: `${who ? `${who}님과 ` : ''}${g.rule?.ruleTitle || '경기'}`,
        sub: g.matchDate ? matchTime(g.matchDate) : '시간을 정해야 해요',
      }))
  } catch {
    items.value = [] // 못 불러와도 홈은 그대로 (내 경기 탭에서 다시 본다)
  }
}

let stop = null
onMounted(() => {
  load()
  stop = refreshOnChange(load)
})
onBeforeUnmount(() => stop?.())
</script>
