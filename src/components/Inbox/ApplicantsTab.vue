<template>
  <div>
    <h2 class="font-semibold mb-4 text-lg">받은 요청</h2>
    <div v-if="groups.length" class="space-y-6">
      <div v-for="group in groups" :key="group.gameId" class="border rounded p-4 bg-white shadow-sm">
        <div class="mb-2">
          <p class="text-sm text-gray-500">장소-{{ group.matchLocation || '미정' }} / 일시-{{ formatDate(group.matchDate) }}</p>

          <div class="my-3 bg-gray-100 p-4">
            <p class="font-bold">{{ group.title }} · <span class="text-[0.8rem] font-[400] text-gray-700">{{ group.majorCategory }} > {{ group.minorCategory }}</span></p>
            <p class="mt-1 text-sm text-gray-600">{{ group.description }}</p>
          </div>
        </div>

        <ul class="space-y-2 border-t-[2px] pt-4">
          <div class="font-semibold text-gray-700">신청자</div>
          <li v-for="user in group.applicants" :key="user.userId" class="flex justify-between items-center">
            <div class="text-sm text-gray-700">
              {{ user.applicantNickname }} · {{ user.wins }}승 {{ user.draws }}무 {{ user.losses }}패 · 승률 {{ user.rating }}%
            </div>

            <template v-if="user.approved">
              <button
                class="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                @click="cancelApproval(group.gameId, user.userId)">
                참여 취소
              </button>
            </template>

            <template v-else>
              <button
                class="text-xs px-3 py-1 rounded text-white bg-green-500 hover:bg-green-600"
                :class="{ 'opacity-40 cursor-not-allowed hover:bg-green-500': approvedExists(group.applicants) }"
                :disabled="approvedExists(group.applicants)"
                @click="approve(group.gameId, user.userId)">
                승인
              </button>
            </template>
          </li>
        </ul>
      </div>
    </div>
    <div v-else class="text-center text-sm text-gray-400">받은 요청이 없습니다.</div>
  </div>

  <CustomToast />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
const { showToast } = useToast()

const groups = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-games/applicants')
  const grouped = {}
  for (const row of res.data) {
    if (!grouped[row.gameId]) {
      grouped[row.gameId] = {
        gameId: row.gameId,
        title: row.title,
        description: row.description,
        majorCategory: row.majorCategory,
        minorCategory: row.minorCategory,
        matchDate: row.matchDate,
        matchLocation: row.matchLocation,
        applicants: []
      }
    }

    for (const applicant of row.applicants) {
      grouped[row.gameId].applicants.push({
        userId: applicant.userId,
        applicantNickname: applicant.applicantNickname,
        wins: applicant.wins,
        losses: applicant.losses,
        draws: applicant.draws,
        rating: applicant.rating,
        approved: applicant.approved
      })
    }
  }

  groups.value = Object.values(grouped)
})

function approvedExists(applicants) {
  return applicants.some(user => user.approved)
}

async function approve(gameId, userId) {
  await client.post(`/api/games/approve`, { gameId, userId })
  const group = groups.value.find(g => g.gameId === gameId)
  const user = group?.applicants?.find(a => a.userId === userId)
  if (user) user.approved = true

  showToast(`${user.applicantNickname}님을 승인했습니다!`)
}

async function cancelApproval(gameId, userId) {
  await client.post(`/api/games/cancel-approve`, { gameId, userId })
  const group = groups.value.find(g => g.gameId === gameId)
  const user = group?.applicants?.find(a => a.userId === userId)
  if (user) user.approved = false

    showToast(`${user.applicantNickname}님의 참여를 취소했습니다!`)

}

function formatDate(dateStr) {
  if (!dateStr) return '미정'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}
</script>

