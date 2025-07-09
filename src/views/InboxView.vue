<template>
  <Header :has-referer="true" title="인박스" />
  <div class="min-h-screen w-screen flex flex-col mt-[4rem]">
    <div class="flex justify-center sticky top-0 bg-white z-10 py-3">
      <button
        @click="setTab('sent')"
        class="flex-1 py-2 text-sm font-semibold"
        :class="activeTab === 'sent' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'"
      >
        보낸 요청
      </button>
      <button
        @click="setTab('received')"
        class="flex-1 py-2 text-sm font-semibold"
        :class="activeTab === 'received' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'"
      >
        받은 요청
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <MyRequestsTab v-if="activeTab === 'sent'" :scroll-to-id="scrollToId" />
      <ApplicantsTab v-else :scroll-to-id="scrollToId" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Header from "../components/HeaderComp.vue"
import MyRequestsTab from '../components/Inbox/MyRequestsTab.vue'
import ApplicantsTab from '../components/Inbox/ApplicantsTab.vue'

const route = useRoute()
const router = useRouter()
const activeTab = ref('sent')
const scrollToId = ref(null)

// 쿼리에서 active/id 가져오기 (최초 및 쿼리 변경 시)
function initTabFromQuery() {
  const active = route.query.active
  const id = route.query.id
  if (active === 'received' || active === 'sent') {
    activeTab.value = active
  }
  if (id) {
    scrollToId.value = id
  } else {
    scrollToId.value = null
  }
}

// 탭 클릭 시 쿼리도 변경
function setTab(tab) {
  if (activeTab.value === tab) return
  activeTab.value = tab
  router.replace({
    query: { ...route.query, active: tab, id: undefined }, // 탭 바꿀 때 id는 없앰
  })
  scrollToId.value = null
}

onMounted(() => {
  initTabFromQuery()
})
watch(() => route.query, () => {
  initTabFromQuery()
})
</script>
