<template>
  <div class="card-style group relative" @click.stop="showRuleDetail = true">
    <!-- 헤더 -->
    <div class="flex items-start justify-between mb-2">
      <div class="min-w-0 flex items-center gap-2">
        <div>
          <img
            class="w-10"
            :src="`/category-picture/${rule.minorCategory || '미분류'}.png`"
            alt="카테고리 이미지"
          />
        </div>
        <div>
          <span class="text-base font-extrabold text-gray-900 truncate block">
            {{ rule.ruleTitle }}
          </span>
          <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
            {{ rule.majorCategory }}
            <span v-if="rule.minorCategory" class="mx-1 text-orange-500">&gt;</span>
            <span v-if="rule.minorCategory">{{ rule.minorCategory }}</span>
          </div>
        </div>
      </div>

      <!-- 수정 요청 상태 뱃지 -->
      <div v-if="rule.editRequestStatus" class="flex flex-col items-end gap-1">
        <span
          :class="[
            'text-xs font-bold px-2 py-1 rounded-full',
            getStatusBadgeClass(rule.editRequestStatus),
          ]"
        >
          {{ getStatusBadgeText(rule.editRequestStatus) }}
        </span>
        <button
          v-if="rule.editRequestStatus === 'PENDING'"
          @click.stop="$emit('cancelEditRequest', rule)"
          class="text-xs text-red-500 hover:text-red-600 font-medium"
        >
          취소
        </button>
      </div>
    </div>

    <div class="mb-4 text-gray-600 text-sm">
      {{ rule.ruleGoal }}
    </div>

    <!-- 거절 사유 표시 -->
    <div
      v-if="rule.editRequestStatus === 'REJECTED' && rule.rejectionReason"
      class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <i class="fas fa-exclamation-circle text-red-500 mt-0.5"></i>
        <div class="flex-1">
          <p class="text-xs font-bold text-red-700 mb-1">거절 사유</p>
          <p class="text-xs text-red-600">{{ rule.rejectionReason }}</p>
        </div>
      </div>
    </div>

    <!-- 통계 & 액션 -->
    <div class="flex justify-between items-center mt-4 gap-4">
      <div class="flex flex-col text-xs text-gray-600 gap-1.5">
        <div class="flex items-center gap-1.5">
          <i class="fas fa-star text-yellow-500"></i>
          <span class="font-semibold">평점: {{ rule.rating ? rule.rating.toFixed(1) : '-' }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <i class="fas fa-gamepad text-orange-500"></i>
          <span class="font-semibold">플레이: {{ rule.playCount || 0 }}회</span>
        </div>
        <div class="flex items-center gap-1.5">
          <i class="fas fa-clock text-blue-500"></i>
          <span class="font-semibold text-gray-500">
            {{ rule.lastPlayedAt ? formatDate(rule.lastPlayedAt) : '플레이 기록 없음' }}
          </span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          v-if="!rule.editRequestStatus || rule.editRequestStatus === 'REJECTED'"
          @click.stop="$emit('editRule', rule)"
          class="px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm flex items-center gap-1.5"
        >
          <i class="fas fa-edit text-sm"></i>
          <span>수정</span>
        </button>
        <button
          @click.stop="$emit('createGame', rule)"
          class="px-4 py-2.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition shadow-sm flex items-center gap-1.5"
        >
          <i class="fas fa-play text-sm"></i>
          <span>생성</span>
        </button>
      </div>
    </div>
  </div>

  <!-- 룰 상세 모달 -->
  <transition name="fade">
    <MatchRuleModal
      v-if="showRuleDetail"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5 z-[10000000]"
      :rule="rule"
      @close="showRuleDetail = false"
      @click.stop
    />
  </transition>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import MatchRuleModal from './MatchModal.vue'

defineProps(['rule'])
defineEmits(['editRule', 'createGame', 'cancelEditRequest'])

const showRuleDetail = ref(false)

function getStatusBadgeClass(status) {
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

function getStatusBadgeText(status) {
  switch (status) {
    case 'PENDING':
      return '수정 대기'
    case 'APPROVED':
      return '수정 완료'
    case 'REJECTED':
      return '수정 거절'
    default:
      return '알 수 없음'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  if (days < 365) return `${Math.floor(days / 30)}개월 전`
  return `${Math.floor(days / 365)}년 전`
}
</script>

<style scoped>
.card-style {
  background: #fafafb;
  border-radius: 1.3rem;
  box-shadow:
    0 2px 14px 0 rgba(31, 41, 55, 0.04),
    0 2px 8px 0 rgba(251, 146, 60, 0.06);
  padding: 1.45rem 1.15rem 1.4rem 1.15rem;
  margin-bottom: 1.05rem;
  border: 1.2px solid #f6f6f6;
  transition:
    box-shadow 0.2s,
    border 0.15s;
  position: relative;
}

.card-style:hover {
  box-shadow:
    0 8px 36px 0 rgba(251, 146, 60, 0.1),
    0 2px 8px 0 rgba(0, 0, 0, 0.05);
  border-color: #fed7aa;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.19s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
