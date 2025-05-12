<template>
  <div>
    <h2 class="font-semibold mb-2">내가 신청한 게임</h2>
    <div v-if="games.length > 0">
        <ul class="space-y-2">
        <li v-for="game in games" :key="game.id" class="border p-3 rounded">
            <p class="font-bold">{{ game.title }}</p>
            <p class="text-sm text-gray-500">{{ game.matchLocation }}</p>
        </li>
        </ul>
    </div>
    <div v-else class="text-sm font-gray-500 text-center">
        <div>
            신청한 게임이 없습니다.
        </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import client from '../../api/api' // 변경된 client import

const games = ref([])

onMounted(async () => {
  const res = await client.get('/api/games/my-requests')
  games.value = res.data
})
</script>
