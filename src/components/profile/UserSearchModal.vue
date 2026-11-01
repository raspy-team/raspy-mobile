<template>
  <UiSheet :model-value="true" title="사람 찾기" @update:model-value="emit('close')">
    <UiInput ref="userinput" v-model="userSearch" icon="search" placeholder="닉네임이나 아이디" @update:model-value="onUserSearch" />

    <div class="mt-4 min-h-[40vh]">
      <UiListSkeleton v-if="userSearching" :rows="3" />

      <UiEmptyState v-else-if="!userSearchResult.length && userSearch.trim()" icon="user-slash" title="찾는 사람이 없어요" description="다른 이름으로 찾아보세요" />

      <UiList v-else-if="userSearchResult.length">
        <UiListItem
          v-for="user in userSearchResult"
          :key="user.id"
          :title="user.nickname"
          :subtitle="['@' + user.username, user.intro].filter(Boolean).join(' · ')"
          chevron
          @click="goToUser(user.id)"
        >
          <template #leading><UiAvatar :src="user.avatar" :name="user.nickname" size="md" /></template>
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
