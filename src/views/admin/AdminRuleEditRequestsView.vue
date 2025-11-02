<template>
  <div class="min-h-screen bg-gray-50">
    <HeaderComp
      :has-referer="true"
      title="규칙 수정 요청 관리"
      :show-bell="false"
      :show-dm="false"
      custom-class="bg-white border-gray-200 shadow-sm"
      back-icon-class="fas fa-arrow-left"
    />

    <!-- 탭 필터 -->
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="selectTab(tab.value)"
          :class="[
            'flex-1 py-3 px-4 rounded-lg font-semibold transition',
            selectedTab === tab.value
              ? 'bg-orange-500 text-white'
              : 'text-gray-600 hover:bg-gray-100',
          ]"
        >
          {{ tab.label }}
          <span
            v-if="tab.count !== undefined"
            :class="[
              'ml-2 px-2 py-0.5 rounded-full text-xs',
              selectedTab === tab.value ? 'bg-white/20' : 'bg-gray-200',
            ]"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-3xl text-orange-500 mb-3"></i>
        <p class="text-gray-600">로딩 중...</p>
      </div>

      <!-- 빈 상태 -->
      <div
        v-else-if="requests.length === 0"
        class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
      >
        <i class="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">요청이 없습니다</p>
      </div>

      <!-- 요청 목록 -->
      <div v-else class="space-y-4">
        <div
          v-for="request in requests"
          :key="request.id"
          :class="[
            'bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition hover:shadow-md',
            highlightedRequestId === request.id
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-200',
          ]"
          @click="openComparisonModal(request)"
        >
          <!-- 헤더 -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-gray-900 mb-1 truncate">
                {{ request.ruleTitle || '제목 없음' }}
              </h3>
              <div class="flex items-center gap-3 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <i class="fas fa-user"></i>
                  {{ request.requestedBy?.nickname || '알 수 없음' }}
                </span>
                <span class="flex items-center gap-1">
                  <i class="fas fa-clock"></i>
                  {{ formatDate(request.createdAt) }}
                </span>
              </div>
            </div>
            <span
              :class="[
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap',
                getStatusClass(request.status),
              ]"
            >
              {{ getStatusText(request.status) }}
            </span>
          </div>

          <!-- 카테고리 -->
          <div class="flex gap-2 mb-4">
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
              {{ request.majorCategory || '-' }}
            </span>
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
              {{ request.minorCategory || '-' }}
            </span>
          </div>

          <!-- 거절 사유 (거절된 경우) -->
          <div
            v-if="request.status === 'REJECTED' && request.rejectionReason"
            class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
          >
            <p class="text-xs font-semibold text-red-700 mb-1">
              <i class="fas fa-exclamation-circle mr-1"></i>거절 사유
            </p>
            <p class="text-sm text-red-600">{{ request.rejectionReason }}</p>
          </div>

          <!-- 검토 정보 (승인/거절된 경우) -->
          <div
            v-if="request.status !== 'PENDING' && request.reviewedBy"
            class="flex items-center gap-2 text-xs text-gray-500"
          >
            <i class="fas fa-user-shield"></i>
            <span>{{ request.reviewedBy?.nickname || '관리자' }}</span>
            <span>·</span>
            <span>{{ formatDate(request.reviewedAt) }}</span>
          </div>

          <!-- 액션 버튼 (대기 중인 경우) -->
          <div v-if="request.status === 'PENDING'" class="flex gap-2 mt-4 pt-4 border-t">
            <button
              @click.stop="openApproveModal(request)"
              class="flex-1 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
            >
              <i class="fas fa-check mr-1"></i>승인
            </button>
            <button
              @click.stop="openRejectModal(request)"
              class="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
            >
              <i class="fas fa-times mr-1"></i>거절
            </button>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
        <button
          @click="loadPage(currentPage - 1)"
          :disabled="currentPage === 0"
          class="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="px-4 py-2 bg-white border border-gray-200 rounded-lg">
          {{ currentPage + 1 }} / {{ totalPages }}
        </span>
        <button
          @click="loadPage(currentPage + 1)"
          :disabled="currentPage >= totalPages - 1"
          class="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 비교 모달 -->
    <RuleComparisonModal
      v-if="selectedRequest"
      :request="selectedRequest"
      @close="closeComparisonModal"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <!-- 승인 확인 모달 -->
    <div
      v-if="showApproveModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeApproveModal"
    >
      <div class="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-gray-900 mb-3">수정 요청 승인</h3>
        <p class="text-gray-600 mb-6">
          이 수정 요청을 승인하시겠습니까?<br />
          승인 즉시 원본 규칙에 변경사항이 반영됩니다.
        </p>
        <div class="flex gap-3">
          <button
            @click="closeApproveModal"
            class="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            @click="confirmApprove"
            class="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition"
          >
            승인
          </button>
        </div>
      </div>
    </div>

    <!-- 거절 모달 -->
    <div
      v-if="showRejectModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="closeRejectModal"
    >
      <div class="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 class="text-xl font-bold text-gray-900 mb-3">수정 요청 거절</h3>
        <p class="text-gray-600 mb-4">거절 사유를 입력해주세요.</p>
        <textarea
          v-model="rejectionReason"
          class="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows="4"
          placeholder="예: 규칙 내용이 부적절합니다."
        ></textarea>
        <div class="flex gap-3 mt-4">
          <button
            @click="closeRejectModal"
            class="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            @click="confirmReject"
            :disabled="!rejectionReason.trim()"
            class="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            거절
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../api/api'
import HeaderComp from '../../components/HeaderComp.vue'
import RuleComparisonModal from '../../components/admin/RuleComparisonModal.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const selectedTab = ref('PENDING')
const requests = ref([])
const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)
const highlightedRequestId = ref(null)

const selectedRequest = ref(null)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const requestToProcess = ref(null)
const rejectionReason = ref('')

const tabs = computed(() => [
  { label: '대기 중', value: 'PENDING', count: selectedTab.value === 'PENDING' ? totalElements.value : undefined },
  { label: '승인됨', value: 'APPROVED', count: selectedTab.value === 'APPROVED' ? totalElements.value : undefined },
  { label: '거절됨', value: 'REJECTED', count: selectedTab.value === 'REJECTED' ? totalElements.value : undefined },
])

async function loadRequests() {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/rules/edit-requests', {
      params: {
        status: selectedTab.value,
      },
    })

    // API 응답이 배열 형태로 옴
    const allRequests = Array.isArray(data) ? data : []
    totalElements.value = allRequests.length

    // 클라이언트 사이드 페이지네이션
    const pageSize = 10
    totalPages.value = Math.ceil(allRequests.length / pageSize)
    const startIdx = currentPage.value * pageSize
    const endIdx = startIdx + pageSize
    requests.value = allRequests.slice(startIdx, endIdx)
  } catch (e) {
    console.error('Failed to load requests:', e)
    // 관리자 권한이 없거나 에러 발생 시 메인으로 이동
    alert('관리자 권한이 필요합니다.')
    router.push('/admin')
  } finally {
    loading.value = false
  }
}

function selectTab(tab) {
  selectedTab.value = tab
  currentPage.value = 0
  highlightedRequestId.value = null
  loadRequests()
}

function loadPage(page) {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
    loadRequests()
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

function openComparisonModal(request) {
  console.log('Opening comparison modal for request:', request)
  selectedRequest.value = request
  console.log('selectedRequest set to:', selectedRequest.value)
}

function closeComparisonModal() {
  selectedRequest.value = null
}

function openApproveModal(request) {
  requestToProcess.value = request
  showApproveModal.value = true
}

function closeApproveModal() {
  showApproveModal.value = false
  requestToProcess.value = null
}

function openRejectModal(request) {
  requestToProcess.value = request
  rejectionReason.value = ''
  showRejectModal.value = true
}

function closeRejectModal() {
  showRejectModal.value = false
  requestToProcess.value = null
  rejectionReason.value = ''
}

async function confirmApprove() {
  if (!requestToProcess.value) return
  await handleApprove(requestToProcess.value.id)
  closeApproveModal()
}

async function confirmReject() {
  if (!requestToProcess.value || !rejectionReason.value.trim()) return
  await handleReject(requestToProcess.value.id, rejectionReason.value)
  closeRejectModal()
}

async function handleApprove(requestId) {
  try {
    await api.post(`/api/admin/rules/edit-requests/${requestId}/approve`)
    alert('수정 요청이 승인되었습니다.')
    closeComparisonModal()
    loadRequests()
  } catch (e) {
    console.error('Failed to approve request:', e)
    alert('승인에 실패했습니다: ' + (e.response?.data?.message ?? e.message))
  }
}

async function handleReject(requestId, reason) {
  try {
    await api.post(`/api/admin/rules/edit-requests/${requestId}/reject`, {
      rejectionReason: reason,
    })
    alert('수정 요청이 거절되었습니다.')
    closeComparisonModal()
    loadRequests()
  } catch (e) {
    console.error('Failed to reject request:', e)
    alert('거절에 실패했습니다: ' + (e.response?.data?.message ?? e.message))
  }
}

onMounted(() => {
  // URL 쿼리 파라미터에서 상태와 하이라이트 ID 가져오기
  const statusParam = route.query.status
  const highlightParam = route.query.highlight

  if (statusParam && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
    selectedTab.value = statusParam
  }

  if (highlightParam) {
    highlightedRequestId.value = parseInt(highlightParam)
  }

  loadRequests()
})

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.highlight) {
      highlightedRequestId.value = parseInt(newQuery.highlight)
    }
  },
)
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
</style>
