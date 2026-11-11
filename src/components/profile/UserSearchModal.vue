<template>
  <UiSheet :model-value="true" title="사람 찾기" @update:model-value="emit('close')">
    <UiInput ref="userinput" v-model="userSearch" icon="search" placeholder="닉네임이나 아이디" @update:model-value="onUserSearch" />

    <div class="mt-4 min-h-[40vh]">
      <UiListSkeleton v-if="userSearching" :rows="3" />

      <!-- 실패하면 회색 줄이 끝없이 돌았다: 찾는 중인지 망가졌는지 알 수 없었다 (목적 판정 6) -->
      <UiEmptyState v-else-if="searchFailed" icon="fas fa-wifi" title="찾지 못했어요. 다시 해 주세요" />
      <UiEmptyState v-else-if="!userSearchResult.length && userSearch.trim()" mascot="match" title="찾는 사람이 없어요" />

      <UiList v-else-if="userSearchResult.length">
        <UiListItem
          v-for="user in userSearchResult"
          :key="user.id"
          :title="user.nickname"
          :subtitle="[user.isBot ? 'AI 주민' : '', '@' + user.username, user.intro].filter(Boolean).join(' · ')"
          chevron
          @click="goToUser(user.id)"
        >
          <template #leading><UiAvatar :src="user.avatar" :name="user.nickname" :user-id="user.id" size="md" /></template>
        </UiListItem>
      </UiList>

      <p v-else class="t-caption text-center pt-10">함께 경기한 사람이나 친구를 찾아보세요</p>
    </div>
  </UiSheet>
</template>

<script setup>
import { UiAvatar, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton, UiSheet } from '../ui'
// 닉네임·아이디로 유저를 찾는 모달. 입력을 멈추고 0.35초 뒤에 검색한다
import { ref, onMounted, defineEmits } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

const emit = defineEmits(['close'])
const router = useRouter()

const userSearch = ref('')
const userSearching = ref(false)
const userSearchResult = ref([])
const userinput = ref(null)
let searchTimeout

onMounted(() => userinput.value?.focus())

const searchFailed = ref(false)
function onUserSearch() {
  clearTimeout(searchTimeout)
  if (!userSearch.value.trim()) {
    userSearchResult.value = []
    return
  }
  userSearching.value = true
  searchFailed.value = false
  searchTimeout = setTimeout(async () => {
    try {
      const res = await api.get(`/api/user-profile/search?keyword=${encodeURIComponent(userSearch.value)}`)
      userSearchResult.value = res.data
    } catch {
      userSearchResult.value = []
      searchFailed.value = true
    } finally {
      userSearching.value = false
    }
  }, 350)
}

function goToUser(userId) {
  emit('close')
  router.push(`/profile/${userId}`)
}
</script>
