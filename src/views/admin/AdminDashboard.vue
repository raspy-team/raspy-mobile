<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="fas fa-shield-halved text-orange-500 text-2xl"></i>
          <h1 class="text-xl font-bold text-gray-900">관리자 대시보드</h1>
        </div>
        <button
          @click="$router.push('/game')"
          class="text-sm text-gray-600 hover:text-orange-500 font-medium"
        >
          <i class="fas fa-arrow-left mr-1"></i>
          메인으로
        </button>
      </div>
    </div>

    <!-- 통계 카드 -->
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- 대기 중인 수정 요청 -->
        <div
          @click="$router.push('/admin/rule-edit-requests?status=PENDING')"
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">승인 대기 중</p>
              <p class="text-3xl font-bold text-orange-500">{{ stats.pending }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <i class="fas fa-clock text-orange-500 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- 승인된 요청 -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
          @click="$router.push('/admin/rule-edit-requests?status=APPROVED')"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">승인 완료</p>
              <p class="text-3xl font-bold text-green-500">{{ stats.approved }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="fas fa-check text-green-500 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- 거절된 요청 -->
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
          @click="$router.push('/admin/rule-edit-requests?status=REJECTED')"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">거절됨</p>
              <p class="text-3xl font-bold text-red-500">{{ stats.rejected }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <i class="fas fa-times text-red-500 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 빠른 액션 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">빠른 작업</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            @click="$router.push('/admin/rule-edit-requests')"
            class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition"
          >
            <i class="fas fa-list text-orange-500 text-xl"></i>
            <div class="text-left">
              <p class="font-semibold text-gray-900">수정 요청 관리</p>
              <p class="text-xs text-gray-500">규칙 수정 요청 확인 및 처리</p>
            </div>
          </button>

          <button
            @click="$router.push('/rules')"
            class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
          >
            <i class="fas fa-book text-blue-500 text-xl"></i>
            <div class="text-left">
              <p class="font-semibold text-gray-900">전체 규칙 보기</p>
              <p class="text-xs text-gray-500">모든 규칙 목록 확인</p>
            </div>
          </button>
        </div>
      </div>

      <!-- 최근 활동 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">최근 수정 요청</h2>
        <div v-if="loading" class="text-center py-8 text-gray-400">
          <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
          <p>로딩 중...</p>
        </div>
        <div v-else-if="recentRequests.length === 0" class="text-center py-8 text-gray-400">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>최근 요청이 없습니다</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="request in recentRequests"
            :key="request.id"
            @click="viewRequest(request)"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          >
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">
                {{ request.ruleTitle || '제목 없음' }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ request.requestedBy?.nickname || '알 수 없음' }} · {{ formatDate(request.createdAt) }}
              </p>
            </div>
            <div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  getStatusClass(request.status),
                ]"
              >
                {{ getStatusText(request.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'

const router = useRouter()
const loading = ref(true)
const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0,
})
const recentRequests = ref([])

async function fetchStats() {
  try {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      api.get('/api/admin/rules/edit-requests', { params: { status: 'PENDING' } }),
      api.get('/api/admin/rules/edit-requests', { params: { status: 'APPROVED' } }),
      api.get('/api/admin/rules/edit-requests', { params: { status: 'REJECTED' } }),
    ])

    // API 응답이 배열 형태로 옴
    const pendingData = Array.isArray(pendingRes.data) ? pendingRes.data : []
    const approvedData = Array.isArray(approvedRes.data) ? approvedRes.data : []
    const rejectedData = Array.isArray(rejectedRes.data) ? rejectedRes.data : []

    stats.value.pending = pendingData.length
    stats.value.approved = approvedData.length
    stats.value.rejected = rejectedData.length

    // 최근 5개만 표시
    recentRequests.value = pendingData.slice(0, 5)
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  } finally {
    loading.value = false
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700'
    case 'APPROVED':
      return 'bg-green-100 text-green-700'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'PENDING':
      return '대기 중'
    case 'APPROVED':
      return '승인됨'
    case 'REJECTED':
      return '거절됨'
    default:
      return '알 수 없음'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR')
}

function viewRequest(request) {
  router.push(`/admin/rule-edit-requests?highlight=${request.id}`)
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
</style>
