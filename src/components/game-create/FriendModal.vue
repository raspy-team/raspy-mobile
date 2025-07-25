<template>
  <div class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
    <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl relative">
      <button @click="$emit('close')" class="absolute top-3 right-4 text-2xl text-gray-400">
        ×
      </button>
      <div class="text-lg font-bold mb-4 text-gray-900">내 친구 선택</div>
      <ul v-if="friends.length">
        <li v-for="f in friends" :key="f.id" class="flex items-center gap-3 py-3 border-b">
          <img :src="f.avatar" class="w-10 h-10 rounded-full bg-gray-100" v-if="f.avatar" />
          <div class="flex-1">
            <div class="text-base font-semibold">{{ f.nickname }}</div>
            <div class="text-xs text-gray-400">{{ f.intro }}</div>
          </div>
          <button @click="$emit('select', f)" class="px-4 py-2 bg-orange-500 text-white rounded-lg">
            선택
          </button>
        </li>
      </ul>
      <div v-else class="text-gray-400 py-12 text-center">친구가 없습니다</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'
const friends = ref([])
onMounted(async () => {
  const res = await api.get('/api/friends/my')
  friends.value = res.data
})
</script>
