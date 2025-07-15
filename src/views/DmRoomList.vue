<template>
  <Header :has-referer="true" title="DM" />
  <div class="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] pb-24">
    <div class="max-w-lg mx-auto pt-20 px-4">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="flex justify-center items-center py-40">
        <i class="fas fa-spinner fa-spin text-3xl text-orange-400"></i>
      </div>
      <!-- DM 없음 상태 -->
      <div v-else-if="dmList.length === 0" class="flex flex-col items-center justify-center text-gray-400 py-32">
        <i class="fas fa-comment-slash text-4xl mb-4 text-orange-200"></i>
        <span class="text-base font-medium">아직 DM 채팅방이 없습니다.</span>
      </div>
      <!-- DM 리스트 -->
      <div v-else class="flex flex-col gap-4">
        <button
          v-for="dm in dmList"
          :key="dm.targetUserId"
          @click="goToChat(dm.targetUserId)"
          class="group flex items-center px-5 py-4 rounded-2xl bg-white hover:bg-orange-50 shadow-lg border border-[#f1f5f9] hover:border-orange-200 transition-all duration-200"
        >
          <img
            :src="dm.targetUserProfileUrl || defaultProfileUrl"
            class="w-14 h-14 rounded-full object-cover border-2 border-orange-100 shadow-md"
            :alt="dm.targetUserNickname"
          />
          <div class="flex-1 min-w-0 ml-5 flex flex-col">
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-900 text-lg tracking-tight truncate">{{ dm.targetUserNickname }}</span>
            </div>
            <div class="flex items-center mt-2 gap-2">
              <span class="text-sm text-gray-700 truncate font-medium"
                    v-if="dm.lastMessageContent">{{ dm.lastMessageContent }}</span>
              <span v-else class="text-sm text-gray-400 italic">아직 메시지 없음</span>
              <span class="text-xs text-gray-400 ml-2">{{ relativeTime(dm.lastMessageTimestamp) }}</span>
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-300 group-hover:text-orange-400 ml-4 text-lg"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import api from "@/api/api"
import DefaultProfile from "@/assets/default.png"
import Header from "../components/HeaderComp.vue"

const router = useRouter()
const dmList = ref([])
const loading = ref(true)
const defaultProfileUrl = DefaultProfile

async function fetchDmList() {
  loading.value = true
  try {
    const res = await api.get("/api/chat-room/my-dm-rooms")
    dmList.value = res.data
  } catch (e) {
    dmList.value = []
    alert("DM 목록을 불러오지 못했습니다.")
  }
  loading.value = false
}

function goToChat(userId) {
  router.push(`/chat/${userId}`)
}

function relativeTime(date) {
  if (!date) return ""
  const now = new Date()
  const target = new Date(date)
  const diff = (now - target) / 1000
  if (diff < 60) return "방금 전"
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  return target.toLocaleDateString("ko-KR")
}

onMounted(fetchDmList)
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
::-webkit-scrollbar { display: none; }
</style>
