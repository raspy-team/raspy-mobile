<template>
  <div class="fixed top-12 p-5 left-0 w-full text-white text-sm z-50">
    <div class="max-w-4xl mx-auto px-4 py-5 rounded-xl flex justify-between items-center bg-green-600" style="opacity: 0.8">
      <span>
        🟢 진행 중인 게임:<br>
        {{ activeGame.myNickname }} vs {{ activeGame.opponentNickname }}
        · {{ activeGame.endsAt ? `종료까지 ${countdown}` : '제한 없음' }}
      </span>
      <router-link
        :to="`/games/${activeGame.id}/play`"
        class="bg-white text-green-700 px-2 py-2 rounded hover:bg-gray-100 text-xs"
      >
        게임방 이동
      </router-link>
    </div>
  </div>
</template>
<script setup>
import {defineProps} from 'vue'
defineProps(['activeGame', 'countdown'])
</script>
