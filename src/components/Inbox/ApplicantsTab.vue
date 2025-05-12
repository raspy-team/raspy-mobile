<template>
  <div>
    <h2 class="font-semibold mb-2">내 게임에 신청한 유저</h2>
    <div v-if="applicants.length > 0">

        <ul class="space-y-2">
            <li v-for="applicant in applicants" :key="applicant.email" class="border p-3 rounded flex justify-between items-center">
            <div>
                <p class="font-bold">Game #{{ applicant.gameId }}</p>
                <p class="text-sm text-gray-500">{{ applicant.email }}</p>
            </div>
            <button class="bg-green-500 text-white px-3 py-1 rounded" @click="approve(applicant.gameId, applicant.email)">승인</button>
            </li>
        </ul>
    </div>
    <div v-else class="text-sm font-gray-500 text-center">
        <div>
            신청자가 없습니다.
        </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api' // 변경된 client import

const applicants = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-games/applicants')
  applicants.value = res.data
})

async function approve(gameId, email) {
  const participationId = await getParticipationId(gameId, email)
  await client.post(`/api/games/approve/${participationId}`)
  applicants.value = applicants.value.filter(([id, e]) => !(id === gameId && e === email))
}

async function getParticipationId(gameId, email) {
  const res = await client.get(`/api/games/${gameId}/participants/${email}`)

  return res.data
}
</script>