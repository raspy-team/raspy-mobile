<template>
  <div class="bg-gray-950 min-h-screen">
    <HeaderComp
      :has-referer="true"
      title="메시지"
      :show-bell="false"
      :show-dm="false"
      custom-class="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 backdrop-blur-xl border-b border-white/10"
    />
    <div class="w-full px-10 mx-auto pt-14 pb-24">
      <!-- 로딩 상태 -->
      <div v-if="loading" class="flex justify-center items-center py-40">
        <div class="relative">
          <div class="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
          <i class="fas fa-spinner fa-spin text-4xl text-orange-500 relative"></i>
        </div>
      </div>

      <!-- DM 없음 상태 -->
      <div v-else-if="dmList.length === 0" class="flex flex-col items-center justify-center py-32">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-orange-500/20 rounded-full blur-2xl"></div>
          <div
            class="relative bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-full border border-white/10 shadow-2xl"
          >
            <i class="fas fa-comment-dots text-5xl text-orange-400"></i>
          </div>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">메시지가 없습니다</h3>
        <p class="text-sm text-gray-400">새로운 대화를 시작해보세요</p>
      </div>

      <!-- DM 리스트 -->
      <div v-else class="mt-6 -mx-4 w-full">
        <div
          v-for="(dm, index) in dmList"
          :key="dm.targetUserId"
          @click="goToChat(dm.targetUserId)"
          class="relative w-full active:bg-white/5 transition-colors duration-150"
        >
          <!-- 메인 콘텐츠 -->
          <div class="flex w-full items-center py-4 gap-4 px-4">
            <!-- 프로필 이미지 -->
            <div class="relative flex-shrink-0">
              <img
                :src="dm.targetUserProfileUrl || defaultProfileUrl"
                class="w-14 h-14 rounded-full object-cover"
                :alt="dm.targetUserNickname"
              />
              <!-- 온라인 상태 표시 -->
              <div
                class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-gray-950 rounded-full"
              ></div>
            </div>

            <!-- 메시지 정보 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between mb-1">
                <h3 class="font-semibold text-white text-base truncate">
                  {{ dm.targetUserNickname }}
                </h3>
                <span class="text-xs text-gray-500 ml-3 flex-shrink-0">
                  {{ relativeTime(dm.lastMessageTimestamp) }}
                </span>
              </div>
              <p v-if="dm.lastMessageContent" class="text-sm text-gray-400 truncate">
                {{ dm.lastMessageContent }}
              </p>
              <p v-else class="text-sm text-gray-600 italic">메시지를 보내보세요</p>
            </div>

            <!-- 화살표 표시 (옵션) -->
            <i class="fas fa-chevron-right text-gray-600 text-sm flex-shrink-0"></i>
          </div>

          <!-- 구분선 (마지막 아이템 제외) -->
          <div
            v-if="index < dmList.length - 1"
            class="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent ml-[72px] mr-4"
          ></div>
        </div>
      </div>
    </div>

    <!-- 에러 토스트 -->
    <transition name="slide-down">
      <div v-if="showError" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto">
        <div
          class="bg-gradient-to-br from-red-600 to-red-700 text-white px-6 py-3 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-xl"
        >
          <div class="flex items-center gap-3">
            <i class="fas fa-exclamation-circle text-xl"></i>
            <span class="font-semibold">{{ errorMessage }}</span>
          </div>
        </div>
      </div>
    </transition>
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

const showError = ref(false)
const errorMessage = ref('')

async function fetchDmList() {
  loading.value = true
  try {
    const res = await api.get('/api/chat-room/my-dm-rooms')
    dmList.value = res.data
  } catch (e) {
    dmList.value = []
    errorMessage.value = 'DM 목록을 불러올 수 없습니다'
    showError.value = true
    setTimeout(() => {
      showError.value = false
    }, 3000)
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
/* 커스텀 스크롤바 - 다크모드 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 토스트 애니메이션 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 버튼 활성화 효과 */
.active\:scale-98:active {
  transform: scale(0.98);
}

/* 부드러운 스크롤 */
* {
  scroll-behavior: smooth;
}
</style>
