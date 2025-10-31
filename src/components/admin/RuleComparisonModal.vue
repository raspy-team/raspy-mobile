<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">규칙 수정 내용 비교</h2>
            <p class="text-sm text-gray-600 mt-1">
              <i class="fas fa-user mr-1"></i>
              {{ request.requestedBy?.nickname || '알 수 없음' }} · {{ formatDate(request.createdAt) }}
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <i class="fas fa-times text-xl text-gray-600"></i>
          </button>
        </div>
      </div>

      <!-- 내용 -->
      <div class="p-6 space-y-6">
        <!-- 로딩 상태 -->
        <div v-if="loading" class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-3xl text-orange-500 mb-3"></i>
          <p class="text-gray-600">원본 규칙 로딩 중...</p>
        </div>

        <!-- 상태 배지 -->
        <div v-else class="flex items-center justify-between">
          <span
            :class="[
              'px-4 py-2 rounded-full text-sm font-semibold',
              getStatusClass(request.status),
            ]"
          >
            {{ getStatusText(request.status) }}
          </span>
          <div class="flex gap-2">
            <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
              {{ request.majorCategory || '-' }}
            </span>
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
              {{ request.minorCategory || '-' }}
            </span>
          </div>
        </div>

        <!-- 거절 사유 (거절된 경우) -->
        <div
          v-if="request.status === 'REJECTED' && request.rejectionReason"
          class="bg-red-50 border-2 border-red-200 rounded-xl p-4"
        >
          <p class="text-sm font-semibold text-red-700 mb-2">
            <i class="fas fa-exclamation-circle mr-1"></i>거절 사유
          </p>
          <p class="text-sm text-red-600">{{ request.rejectionReason }}</p>
        </div>

        <!-- 필드별 비교 -->
        <div class="space-y-4">
          <!-- 규칙 제목 -->
          <ComparisonField
            label="규칙 제목"
            icon="fa-heading"
            :original="originalRule.ruleTitle"
            :modified="request.ruleTitle"
          />

          <!-- 카테고리 -->
          <ComparisonField
            label="메인 카테고리"
            icon="fa-folder"
            :original="originalRule.majorCategory"
            :modified="request.majorCategory"
          />

          <ComparisonField
            label="서브 카테고리"
            icon="fa-folder-open"
            :original="originalRule.minorCategory"
            :modified="request.minorCategory"
          />

          <!-- 규칙 목표 -->
          <ComparisonField
            label="규칙 목표"
            icon="fa-bullseye"
            :original="originalRule.ruleGoal"
            :modified="request.ruleGoal"
            multiline
          />

          <!-- 점수 정의 -->
          <ComparisonField
            label="점수 정의"
            icon="fa-chart-line"
            :original="originalRule.ruleScoreDefinition"
            :modified="request.ruleScoreDefinition"
            multiline
          />

          <!-- 준비 사항 -->
          <ComparisonField
            label="준비 사항"
            icon="fa-clipboard-check"
            :original="originalRule.rulePreparation"
            :modified="request.rulePreparation"
            multiline
          />

          <!-- 진행 순서 -->
          <ComparisonField
            label="진행 순서"
            icon="fa-list-ol"
            :original="originalRule.ruleOrder"
            :modified="request.ruleOrder"
            multiline
          />

          <!-- 승부 판정 -->
          <ComparisonField
            label="승부 판정"
            icon="fa-gavel"
            :original="originalRule.ruleDecision"
            :modified="request.ruleDecision"
            multiline
          />

          <!-- 반칙 -->
          <ComparisonField
            label="반칙"
            icon="fa-hand"
            :original="originalRule.ruleFoul"
            :modified="request.ruleFoul"
            multiline
          />

          <!-- 추가 정보 -->
          <ComparisonField
            label="추가 정보"
            icon="fa-info-circle"
            :original="originalRule.ruleExtraInfo"
            :modified="request.ruleExtraInfo"
            multiline
          />

          <!-- 승리 점수 -->
          <ComparisonField
            label="승리 점수"
            icon="fa-trophy"
            :original="formatNumber(originalRule.pointsToWin)"
            :modified="formatNumber(request.pointsToWin)"
          />

          <!-- 경기 시간 -->
          <ComparisonField
            label="경기 시간 (분)"
            icon="fa-clock"
            :original="formatNumber(originalRule.duration)"
            :modified="formatNumber(request.duration)"
          />

          <!-- 세트 수 -->
          <ComparisonField
            label="승리 세트 수"
            icon="fa-dice"
            :original="formatNumber(originalRule.setsToWin)"
            :modified="formatNumber(request.setsToWin)"
          />

          <!-- 점수차 -->
          <ComparisonField
            label="필요 점수차"
            icon="fa-chart-bar"
            :original="originalRule.winBy"
            :modified="request.winBy"
          />
        </div>
      </div>

      <!-- 액션 버튼 (대기 중인 경우) -->
      <div
        v-if="!loading && request.status === 'PENDING'"
        class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl"
      >
        <button
          @click="$emit('close')"
          class="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
        >
          닫기
        </button>
        <button
          @click="openRejectModal"
          class="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition"
        >
          <i class="fas fa-times mr-1"></i>거절
        </button>
        <button
          @click="openApproveModal"
          class="flex-1 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition"
        >
          <i class="fas fa-check mr-1"></i>승인
        </button>
      </div>

      <!-- 닫기 버튼 (승인/거절된 경우 또는 로딩 완료) -->
      <div v-if="!loading && request.status !== 'PENDING'" class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <button
          @click="$emit('close')"
          class="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
        >
          닫기
        </button>
      </div>
    </div>

    <!-- 승인 확인 모달 -->
    <div
      v-if="showApproveModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
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
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
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
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import api from '../../api/api'
import ComparisonField from './ComparisonField.vue'

const props = defineProps(['request'])
const emit = defineEmits(['close', 'approve', 'reject'])

const showApproveModal = ref(false)
const showRejectModal = ref(false)
const rejectionReason = ref('')
const originalRule = ref({})
const loading = ref(true)

// 원본 규칙 데이터 가져오기
onMounted(async () => {
  if (props.request.originalRuleId) {
    try {
      const { data } = await api.get(`/api/rules/${props.request.originalRuleId}`)
      originalRule.value = data
    } catch (e) {
      console.error('Failed to load original rule:', e)
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
})

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
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatNumber(value) {
  if (value === null || value === undefined || value === -1) return '없음'
  return String(value)
}

function openApproveModal() {
  showApproveModal.value = true
}

function closeApproveModal() {
  showApproveModal.value = false
}

function openRejectModal() {
  rejectionReason.value = ''
  showRejectModal.value = true
}

function closeRejectModal() {
  showRejectModal.value = false
  rejectionReason.value = ''
}

function confirmApprove() {
  emit('approve', props.request.id)
  closeApproveModal()
}

function confirmReject() {
  if (!rejectionReason.value.trim()) return
  emit('reject', props.request.id, rejectionReason.value)
  closeRejectModal()
}
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
</style>
