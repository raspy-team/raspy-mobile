<template>
  <div class="pt-20 pb-8 max-w-xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 text-center">게임 생성</h2>
    <form @submit.prevent="createGame" class="space-y-4">
      <input v-model="form.title" class="input" placeholder="제목 (1~50자)" required />
      <input v-model="form.description" class="input" placeholder="설명 (1~255자)" required />
      <textarea v-model="form.rulesDescription" class="input" placeholder="규칙 설명 (1~500자)" required />
      <input v-model="form.majorCategory" class="input" placeholder="대분류 (예: 운동)" required />
      <input v-model="form.minorCategory" class="input" placeholder="소분류 (예: 탁구)" required />
      <input v-model.number="form.pointsToWin" type="number" class="input" placeholder="승리 조건 점수 (-1은 무제한)" required />
      <input v-model.number="form.setsToWin" type="number" class="input" placeholder="세트 수 (최소 1)" required />
      <input v-model.number="form.duration" type="number" class="input" placeholder="경기 시간(초, -1은 무제한)" required />
      <select v-model="form.winBy" class="input">
        <option disabled value="">승리 조건 선택</option>
        <option value="SETS_HALF_WIN">세트 과반 승리</option>
        <option value="MOST_SETS_AND_POINTS">최다 세트 + 점수</option>
      </select>
      <input v-model="form.matchDate" type="datetime-local" class="input" />
      <input v-model="form.placeRoad" class="input" placeholder="도로명 주소 (선택)" />
      <input v-model="form.placeDetail" class="input" placeholder="상세 주소 (선택)" />

      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">게임 생성</button>
    </form>
    <CustomToast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import CustomToast from '../../components/CustomToast.vue'
import { useRouter } from 'vue-router'

const { showToast } = useToast()
const router = useRouter()

const form = ref({
  title: '',
  description: '',
  rulesDescription: '',
  majorCategory: '',
  minorCategory: '',
  pointsToWin: -1,
  setsToWin: 1,
  duration: -1,
  winBy: '',
  matchDate: '',
  placeRoad: '',
  placeDetail: ''
})

const createGame = async () => {
  try {
    const payload = { ...form.value, matchDate: form.value.matchDate || null }
    await api.post('/api/games/create', payload)
    showToast('게임이 생성되었습니다!')
    router.push('/game-list')
  } catch (err) {
    console.error('게임 생성 실패', err)
    showToast('게임 생성 실패. 입력값을 확인해주세요.')
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
