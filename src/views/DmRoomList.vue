<template>
  <HeaderComp
    :has-referer="true"
    title="DM"
    :show-bell="false"
    :show-dm="false"
    custom-class="bg-gray-800"
  />
  <div class="bg-gray-900 pb-24 min-h-screen">
    <div class="max-w-lg mx-auto pt-20 px-3">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="flex justify-center items-center py-40">
        <i class="fas fa-spinner fa-spin text-3xl text-orange-400"></i>
      </div>
      <!-- DM 없음 상태 -->
      <div
        v-else-if="dmList.length === 0"
        class="flex flex-col items-center justify-center text-gray-400 py-32"
      >
        <i class="fas fa-comment-dots text-5xl mb-4 text-orange-200"></i>
        <span class="text-base font-medium text-gray-300">아직 DM 채팅방이 없습니다.</span>
      </div>
      <!-- DM 리스트 -->
      <div v-else class="flex flex-col gap-1">
        <button
          v-for="dm in dmList"
          :key="dm.targetUserId"
          @click="goToChat(dm.targetUserId)"
          class="group flex items-center px-4 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border-b border-[#2C2C2C] hover:shadow transition-all duration-150 text-left"
        >
          <img
            :src="dm.targetUserProfileUrl || defaultProfileUrl"
            class="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
            :alt="dm.targetUserNickname"
          />
          <div class="flex-1 min-w-0 ml-4 flex flex-col">
            <span class="font-semibold text-white text-[17px] truncate">{{
              dm.targetUserNickname
            }}</span>
            <div class="flex items-center mt-1 gap-2">
              <span class="text-sm text-gray-300 truncate" v-if="dm.lastMessageContent">{{
                dm.lastMessageContent
              }}</span>
              <span v-else class="text-sm text-gray-500 italic">아직 메시지 없음</span>
              <span class="text-xs text-gray-500 ml-2 whitespace-nowrap">{{
                relativeTime(dm.lastMessageTimestamp)
              }}</span>
            </div>
          </div>
          <i
            class="fas fa-chevron-right text-gray-500 group-hover:text-orange-400 ml-3 text-base"
          ></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/api'
import HeaderComp from '@/components/HeaderComp.vue'
import DefaultProfile from '@/assets/default.png'

const router = useRouter()
const dmList = ref([])
const loading = ref(true)
const defaultProfileUrl = DefaultProfile

async function fetchDmList() {
  loading.value = true
  try {
    const res = await api.get('/api/chat-room/my-dm-rooms')
    dmList.value = res.data
  } catch (e) {
    dmList.value = []
    alert('DM 목록을 불러오지 못했습니다.')
  }
  loading.value = false
}

function goToChat(userId) {
  router.push(`/chat/${userId}`)
}

function relativeTime(date) {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  const diff = (now - target) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  return target.toLocaleDateString('ko-KR')
}

onMounted(fetchDmList)
</script>

<style scoped>
::-webkit-scrollbar {
  display: none;
}
</style>
