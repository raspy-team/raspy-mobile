<template>
  <div>
    <h2 class="font-semibold mb-4 text-lg">받은 요청</h2>
    <div v-if="groups.length" class="space-y-6">
      <div v-for="group in groups" :key="group.gameId" class="border rounded p-4 bg-white shadow-sm">
        <div class="mb-2">
          <p class="font-bold">{{ group.title }}</p>
          <p class="text-sm text-gray-500">{{ group.matchLocation || '미정' }} / {{ group.matchDate }}</p>
        </div>
        <ul class="space-y-2">
          <li v-for="user in group.applicants" :key="user.applicantNickname" class="flex justify-between items-center">
            <div class="text-sm text-gray-700">
              {{ user.applicantNickname }} · {{ user.wins }}/{{ user.losses }}/{{ user.draws }} · {{ user.rating.toFixed(1) }}
            </div>
            <button v-if="!user.approved"
                    class="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600"
                    @click="approve(group.gameId, user.applicantNickname)">
              승인
            </button>
            <span v-else class="text-xs text-green-600 font-semibold">승인</span>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="text-center text-sm text-gray-400">받은 요청이 없습니다.</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api'

const groups = ref([])

onMounted(async () => {
  const res = await client.get('/api/inbox/received')
  const grouped = {}
  for (const row of res.data) {
    if (!grouped[row.gameId]) {
      grouped[row.gameId] = {
        gameId: row.gameId,
        title: row.title,
        matchDate: row.matchDate,
        matchLocation: row.matchLocation,
        applicants: []
      }
    }
    grouped[row.gameId].applicants.push(row)
  }
  groups.value = Object.values(grouped)
})

async function approve(gameId, nickname) {
  await client.post(`/api/games/approve`, { gameId, nickname })
  const group = groups.value.find(g => g.gameId === gameId)
  const user = group?.applicants?.find(a => a.applicantNickname === nickname)
  if (user) user.approved = true
}
</script>
