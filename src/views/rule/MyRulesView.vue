<template>
  <!-- 헤더 -->
  <div
    class="fixed top-0 left-0 w-full z-[5000] bg-gray-900 border-b border-gray-700 h-14 flex items-center px-4"
  >
    <button
      @click="$router.push('/rules')"
      class="text-white text-lg px-2 py-1 rounded hover:bg-gray-700 transition"
      aria-label="뒤로가기"
    >
      <i class="fas fa-chevron-left"></i>
    </button>
    <h1 class="ml-3 text-lg font-bold text-white">내 규칙</h1>
  </div>

  <!-- 필터 탭 -->
  <div class="mt-14 pt-4 px-4 bg-gray-900 sticky top-14 z-40 border-b border-gray-700">
    <div class="flex gap-2 pb-3">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="selectedTab = tab.value"
        :class="[
          'px-4 py-2 rounded-lg font-semibold text-sm transition',
          selectedTab === tab.value
            ? 'bg-orange-500 text-white shadow'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
        ]"
      >
        {{ tab.label }}
        <span v-if="getCo(tab.value) > 0" class="ml-1 text-xs">
          ({{ getCount(tab.value) }})
        </span>
      </button>
    </div>
  </div>

  <!-- 규칙 목록 -->
  <div class="max-w-2xl mx-auto px-5 pt-6 pb-20 bg-gray-900 min-h-screen">
    <div v-if="loading" class="py-32 text-center text-orange-500">
      <i class="fas fa-spinner fa-spin text-3xl"></i>
      <div class="mt-4 text-base">로딩 중입니다…</div>
    </div>

    <template v-else-if="filteredRules.length > 0">
      <MyRuleCard
        v-for="rule in filteredRules"
        :key="rule.id"
        :rule="rule"
        @edit-rule="onEditRule"
        @create-game="onCreateGame"
        @cancel-edit-request="onCancelEditRequest"
      />
    </template>

    <div v-else class="py-32 text-center text-gray-500">
      <i class="fas fa-inbox text-4xl mb-3"></i>
      <div class="text-base">{{ getEmptyMessage() }}</div>
    </div>
  </div>

  <!-- 수정 요청 취소 확인 모달 -->
  <div
    v-if="showCancelModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100000]"
  >
    <div class="bg-gray-800 p-6 m-5 rounded-2xl w-full max-w-sm shadow-2xl">
      <div class="text-center mb-4">
        <i class="fas fa-question-circle text-orange-500 text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-white mb-2">수정 요청 취소</h3>
        <p class="text-sm text-gray-300">정말로 수정 요청을 취소하시겠습니까?</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="showCancelModal = false"
          class="flex-1 bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-600 transition"
        >
          아니오
        </button>
        <button
          @click="confirmCancelEditRequest"
          class="flex-1 bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition shadow"
        >
          취소하기
        </button>
      </div>
    </div>
  </div>

  <CustomToast />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import MyRuleCard from '../../components/MyRuleCard.vue'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'

const router = useRouter()
const { showToast } = useToast()

const loading = ref(false)
const rules = ref([])
const selectedTab = ref('all')
const showCancelModal = ref(false)
const ruleToCancel = ref(null)

const tabs = [
  { label: '전체', value: 'all' },
  { label: '수정 대기', value: 'pending' },
  { label: '수정 거절', value: 'rejected' },
]

const filteredRules = computed(() => {
  if (selectedTab.value === 'all') return rules.value
  if (selectedTab.value === 'pending') {
    return rules.value.filter((r) => r.editRequestStatus === 'PENDING')
  }
  if (selectedTab.value === 'rejected') {
    return rules.value.filter((r) => r.editRequestStatus === 'REJECTED')
  }
  return rules.value
})

function getCount(tabValue) {
  if (tabValue === 'all') return rules.value.length
  if (tabValue === 'pending') {
    return rules.value.filter((r) => r.editRequestStatus === 'PENDING').length
  }
  if (tabValue === 'rejected') {
    return rules.value.filter((r) => r.editRequestStatus === 'REJECTED').length
  }
  return 0
}

function getCo(tabValue) {
  return getCount(tabValue)
}

function getEmptyMessage() {
  switch (selectedTab.value) {
    case 'pending':
      return '수정 대기 중인 규칙이 없습니다'
    case 'rejected':
      return '수정이 거절된 규칙이 없습니다'
    default:
      return '생성한 규칙이 없습니다'
  }
}

async function fetchMyRules() {
  loading.value = true
  try {
    const res = await api.get('/api/rules/my-rules')
    rules.value = res.data
  } catch (e) {
    console.error('Failed to fetch my rules:', e)
    showToast('규칙 목록을 불러오는데 실패했습니다')
  } finally {
    loading.value = false
  }
}

function onEditRule(rule) {
  router.push(`/rules/edit/${rule.id}`)
}

function onCreateGame(rule) {
  router.push({ path: '/create-game', query: { ruleId: rule.id } })
}

function onCancelEditRequest(rule) {
  ruleToCancel.value = rule
  showCancelModal.value = true
}

async function confirmCancelEditRequest() {
  if (!ruleToCancel.value) return

  try {
    await api.post(`/api/rules/edit-requests/${ruleToCancel.value.editRequestId}/cancel`)
    showToast('수정 요청이 취소되었습니다')

    // 목록에서 상태 업데이트
    const rule = rules.value.find((r) => r.id === ruleToCancel.value.id)
    if (rule) {
      rule.editRequestStatus = null
      rule.editRequestId = null
      rule.rejectionReason = null
    }

    showCancelModal.value = false
    ruleToCancel.value = null
  } catch (e) {
    console.error('Failed to cancel edit request:', e)
    showToast('수정 요청 취소에 실패했습니다')
  }
}

onMounted(() => {
  fetchMyRules()
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
</style>
