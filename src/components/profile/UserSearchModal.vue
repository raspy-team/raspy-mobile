<template>
  <div
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
    @click="emit('close')"
  >
    <div
      class=" bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-auto overflow-hidden border border-gray-700"
      @click.stop
    >
      <!-- 헤더 -->
      <div class="px-6 py-5 border-b border-gray-700/50 bg-gradient-to-r from-orange-500/10 to-transparent">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-xl text-white flex items-center gap-2">
            <UiIcon name="fas fa-search" class="text-orange-500" />
            유저 찾기
          </h3>
          <button
            class="w-9 h-9 rounded-full bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
            @click="emit('close')"
          >
            <UiIcon name="fas fa-times" />
          </button>
        </div>
      </div>

      <!-- 검색 입력 -->
      <div class="px-6 py-4">
        <div class="relative">
          <UiIcon name="fas fa-search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            v-model="userSearch"
            @input="onUserSearch"
            ref="userinput"
            type="text"
            class="w-full bg-gray-900/50 border border-gray-700 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            placeholder="이름 또는 유저네임 검색..."
          />
        </div>
      </div>

      <!-- 검색 결과 -->
      <div class="px-6 pb-6 max-h-[60vh] overflow-y-auto">
        <!-- 로딩 상태 -->
        <div v-if="userSearching" class="text-center py-12">
          <UiListSkeleton :rows="3" class="text-left" />
        </div>

        <!-- 검색 결과 없음 -->
        <div
          v-else-if="userSearchResult.length === 0 && userSearch.trim() !== ''"
          class="text-center py-12"
        >
          <UiIcon name="fas fa-user-slash" class="text-4xl text-gray-400 mb-3" />
          <p class="text-gray-400 text-base">찾는 사람이 없어요</p>
          <p class="text-gray-400 text-sm mt-1">다른 키워드로 시도해보세요</p>
        </div>

        <!-- 검색 결과 리스트 -->
        <div v-else-if="userSearchResult.length > 0" class="space-y-2">
          <button
            v-for="user in userSearchResult"
            :key="user.id"
            @click="goToUser(user.id)"
            class="w-full flex items-center gap-3 p-3 rounded-2xl bg-gray-900/30 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-transparent border border-transparent hover:border-orange-500/30 transition-all group"
          >
            <img
              :src="user.avatar ? user.avatar : Default"
              class="w-12 h-12 rounded-full border-2 border-gray-700 group-hover:border-orange-500 object-cover transition-all"
            />
            <div class="flex-1 text-left min-w-0">
              <div class="font-medium text-white text-sm truncate group-hover:text-orange-400 transition-colors">
                {{ user.nickname }}
              </div>
              <div class="text-xs text-gray-400 truncate">@{{ user.username }}</div>
              <div v-if="user.intro" class="text-xs text-gray-500 mt-0.5 truncate">
                {{ user.intro }}
              </div>
            </div>
            <UiIcon name="fas fa-chevron-right" class="text-gray-400 group-hover:text-orange-500 transition-colors" />
          </button>
        </div>

        <!-- 초기 상태 (검색 전) -->
        <div v-else class="text-center py-12">
          <UiIcon name="fas fa-search" class="text-4xl text-gray-200 mb-3" />
          <p class="text-gray-500 text-sm">검색어를 입력하세요</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UiListSkeleton } from '../ui'
// 닉네임·아이디로 유저를 찾는 모달. 입력을 멈추고 0.35초 뒤에 검색한다
import { ref, onMounted, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import Default from '../../assets/default.png'

const emit = defineEmits(['close'])
const router = useRouter()

const userSearch = ref('')
const userSearching = ref(false)
const userSearchResult = ref([])
const userinput = ref(null)
let searchTimeout

onMounted(() => userinput.value?.focus())

function onUserSearch() {
  clearTimeout(searchTimeout)
  if (!userSearch.value.trim()) {
    userSearchResult.value = []
    return
  }
  userSearching.value = true
  searchTimeout = setTimeout(async () => {
    const res = await api.get(`/api/user-profile/search?keyword=${encodeURIComponent(userSearch.value)}`)
    userSearchResult.value = res.data
    userSearching.value = false
  }, 350)
}

function goToUser(userId) {
  emit('close')
  router.push(`/profile/${userId}`)
}
</script>
