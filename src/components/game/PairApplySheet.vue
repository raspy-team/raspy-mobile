<template>
  <UiSheet :model-value="!!game" title="친구와 둘이 신청" @update:model-value="(v) => !v && emit('close')">
    <p class="t-caption mb-3">같은 팀에 친구와 함께 신청해요. 주최자가 받으면 둘 다 들어가고, 친구에게도 알림이 가요</p>
    <UiListSkeleton v-if="loading" :rows="3" />
    <UiEmptyState v-else-if="loadFailed" mascot="match" title="친구 목록을 불러오지 못했어요" description="닫고 다시 열어 주세요" />
    <UiEmptyState v-else-if="!friends.length" mascot="match" title="아직 친구가 없어요" />
    <UiList v-else>
      <UiListItem v-for="f in friends" :key="f.id" :title="f.nickname" :subtitle="'@' + f.username" @click="pick(f)">
        <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" :user-id="f.id" size="sm" /></template>
      </UiListItem>
    </UiList>
  </UiSheet>
</template>

<script setup>
// 친구와 둘이 신청 (팀 경기). 두 자리가 남은 팀 중 자리가 더 많은 팀으로 함께 신청한다
import { ref, watch } from 'vue'
import api from '../../api/api'
import { useToast } from '../../composables/useToast'
import { UiAvatar, UiEmptyState, UiList, UiListItem, UiListSkeleton, UiSheet } from '../ui'

const props = defineProps({ game: { type: Object, default: null } })
const emit = defineEmits(['close', 'done'])
const { showToast } = useToast()
const friends = ref([])
const loading = ref(false)
// 실패를 '친구 없음'으로 보이지 않게 (목적 판정 8)
const loadFailed = ref(false)
let busy = false

watch(() => props.game, async (g) => {
  if (!g) return
  loading.value = true
  loadFailed.value = false
  try {
    friends.value = (await api.get('/api/friends/my')).data || []
  } catch {
    friends.value = []
    loadFailed.value = true
  } finally {
    loading.value = false
  }
})

async function pick(friend) {
  const g = props.game
  if (!g || busy) return
  const seats = g.teamSeatsLeft || []
  const team = seats.indexOf(Math.max(...seats))
  if (seats[team] < 2) {
    showToast('두 자리가 남은 팀이 없어요')
    return
  }
  busy = true
  try {
    await api.post(`/api/games/${g.id}/apply-pair`, null, { params: { team, partnerId: friend.id } })
    showToast(`${friend.nickname}님과 함께 신청했어요`)
    emit('done', g)
  } catch (e) {
    showToast(e.response?.data?.message || '신청하지 못했어요')
  } finally {
    busy = false
  }
}
</script>
