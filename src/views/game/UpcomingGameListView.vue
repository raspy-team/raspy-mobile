<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">진행 예정인 게임</h1>
    <div v-if="games.length > 0">

        <ul class="space-y-4">
        <li
            v-for="game in games"
            :key="game.id"
            class="p-4 border rounded flex justify-between items-center"
        >
            <div>
            <h2 class="text-xl font-semibold">{{ game.title }}</h2>
            <p class="text-gray-500 text-sm">{{ game.matchLocation }}</p>
            </div>
            <router-link
            :to="`/chat/${game.id}`"
            class="bg-blue-600 text-white px-4 py-2 rounded"
            >
            채팅
            </router-link>
        </li>
        </ul>
    </div>
    <div v-else>
        없다
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from '../../api/api' // or 'axios' based on your setup

const games = ref([])

onMounted(async () => {
  try {
    const res = await axios.get('/api/games/my-approved-games')
    games.value = res.data
  } catch (err) {
    console.error('진행 예정 게임 로드 실패', err)
  }
})
</script>
