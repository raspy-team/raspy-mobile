<template>
  <div class="card-style group relative" @click.stop="showRuleDetail = true">
    <!-- 헤더 -->
    <div class="flex items-start justify-between mb-2">
      <div class="min-w-0 flex items-center gap-2">
        <div>
          <div>
            <img
              class="w-10"
              :src="`/category-picture/${rule.minorCategory || '미분류'}.png`"
              alt="카테고리 이미지"
            />
          </div>
        </div>
        <div>
          <span class="text-base font-extrabold text-gray-200 truncate block">
            {{ rule.ruleTitle }}
          </span>
          <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
            {{ rule.majorCategory }}
            <span v-if="rule.minorCategory" class="mx-1 text-orange-500">&gt;</span>
            <span v-if="rule.minorCategory">{{ rule.minorCategory }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-end min-w-0">
        <div class="flex items-center gap-2 justify-end">
          <img
            :src="rule.createdBy.profile?.profilePicture"
            class="w-7 h-7 rounded-full border border-gray-600 object-cover"
            :alt="rule.createdBy.nickname"
          />
          <span class="text-xs text-gray-400 font-medium max-w-[60px] truncate">
            {{ rule.createdBy.nickname }}
          </span>
        </div>
        <div class="text-[0.7rem] flex justify-end py-2 pl-2">
          <button @click.stop="onReportClick" class="text-red-500">신고하기</button>
        </div>
      </div>
    </div>

    <div class="mb-4 text-gray-400 text-sm">
      {{ rule.ruleGoal }}
    </div>

    <!-- CTA & Info -->
    <div class="flex justify-center items-center text-center mt-4 gap-4">
      <button class="game-cta text-center px-6" @click.stop="onGameCtaClick">
        <div class="text-center flex justify-center items-center font-semibold gap-2">생성</div>
      </button>
      <div class="flex flex-col items-start text-xs text-gray-400 font-semibold gap-1">
        <span>평점 : -</span>
        <span>플레이 수 : {{ rule.useCount }}회</span>
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

  <!-- 게임 생성 컨펌 모달 -->
  <transition name="fade">
    <div
      v-if="confirmVisible"
      class="fixed inset-0 z-[999999] bg-black/40 flex items-center justify-center"
      @click.self="confirmVisible = false"
      @click.stop
    >
      <div
        class="bg-gray-800 rounded-2xl shadow-lg px-6 py-8 w-full max-w-xs flex flex-col items-center"
        @click.stop
      >
        <div class="font-bold text-lg text-gray-200 mb-3">정말로 생성할까요?</div>
        <div class="text-sm text-gray-400 mb-6 text-center">
          아래 규칙으로<br />
          <b class="text-orange-500 text-base">{{ rule.ruleTitle }}</b
          ><br />
          게임을 생성하시겠습니까?
        </div>
        <div class="flex gap-3 w-full">
          <button
            @click="confirmVisible = false"
            class="flex-1 py-2 bg-gray-700 text-gray-300 rounded-xl font-bold text-base hover:bg-gray-600"
          >
            취소
          </button>
          <button
            @click="onGameCreateConfirm"
            class="flex-1 py-2 bg-orange-500 text-white rounded-xl font-bold text-base hover:bg-orange-600"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- 신고 모달 -->
  <transition name="fade">
    <div
      v-if="reportVisible"
      class="fixed inset-0 z-[9999999] bg-black/30 flex items-center justify-center"
      @click.self="closeReport"
      @click.stop
    >
      <div
        class="bg-white rounded-2xl shadow-lg px-6 py-7 w-full max-w-xs flex flex-col items-stretch"
        @click.stop
      >
        <div class="font-bold text-lg mb-2 text-gray-900">규칙 신고하기</div>
        <div class="text-gray-500 text-sm mb-3 leading-snug">
          신고는 <b>24시간 내에 처리</b>되며,<br />
          신고해주셔서 감사합니다.
        </div>
        <textarea
          v-model="reportReason"
          class="border rounded p-2 w-full mb-3 text-[15px]"
          rows="3"
          maxlength="100"
          placeholder="신고 사유를 입력해주세요"
          autofocus
          @keydown.enter.exact.prevent="submitReport"
          @click.stop
        />
        <button
          @click.stop="submitReport"
          :disabled="!reportReason.trim() || reportLoading"
          class="w-full bg-red-500 text-white py-2 rounded-xl font-bold mt-1 disabled:bg-gray-300"
        >
          {{ reportLoading ? '신고 중...' : '신고하기' }}
        </button>
        <button @click.stop="closeReport" class="w-full mt-2 text-gray-400 text-sm">취소</button>
        <p v-if="reportError" class="text-red-500 mt-2 text-sm text-center">{{ reportError }}</p>
        <p v-if="reportSuccess" class="text-green-600 mt-2 text-sm text-center">
          {{ reportSuccess }}
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import { useRouter } from 'vue-router'
import MatchRuleModal from './MatchModal.vue'
import api from '../api/api'

const props = defineProps(['rule', 'search', 'copiedId', 'expanded'])
defineEmits(['toggleExpand', 'copyDescription', 'selectedForGame'])
const router = useRouter()
const showRuleDetail = ref(false)

// --- 게임 생성 컨펌 모달 제어
const confirmVisible = ref(false)
function onGameCtaClick(e) {
  e.stopPropagation()
  confirmVisible.value = true
}
function onGameCreateConfirm() {
  confirmVisible.value = false
  router.push({ path: '/create-game', query: { ruleId: props.rule.id } })
}

// --- 신고 모달 관련
const reportVisible = ref(false)
const reportReason = ref('')
const reportLoading = ref(false)
const reportError = ref('')
const reportSuccess = ref('')

function onReportClick(e) {
  e.stopPropagation()
  reportVisible.value = true
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
}
function closeReport() {
  reportVisible.value = false
  reportReason.value = ''
  reportError.value = ''
  reportSuccess.value = ''
}
async function submitReport() {
  if (!reportReason.value.trim()) return
  reportLoading.value = true
  reportError.value = ''
  reportSuccess.value = ''
  try {
    await api.post('/api/reports', {
      targetId: props.rule.id,
      targetType: 'RULE',
      reason: reportReason.value.trim(),
    })
    reportSuccess.value = '신고가 접수되었습니다.'
    setTimeout(closeReport, 1300)
  } catch (e) {
    const msg = e?.response?.data?.message || '신고 처리 중 오류가 발생했습니다.'
    reportError.value = msg
  }
  reportLoading.value = false
}
</script>

<style scoped>
.card-style {
  background: #374151;
  border-radius: 1.3rem;
  box-shadow:
    0 2px 14px 0 rgba(31, 41, 55, 0.04),
    0 2px 8px 0 rgba(251, 146, 60, 0.06);
  padding: 1.45rem 1.15rem 1.4rem 1.15rem;
  margin-bottom: 1.05rem;
  border: 1.2px solid #4b5563;
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
.desc-block {
  background: #f8fafc;
  border-radius: 0.75em;
  min-height: 2.3em;
  position: relative;
  padding: 1.08em 0em 2.05em 0em;
  margin-bottom: 0.15em;
  transition: background 0.16s;
}
.desc-text {
  font-size: 15px;
  color: #363636;
  letter-spacing: -0.008em;
  line-height: 1.65;
  transition: color 0.12s;
  margin-bottom: 0;
  word-break: break-word;
}
.desc-text-expanded {
  color: #ce7a1c;
  font-weight: 500;
}
.desc-mini-btn {
  background: #f3f4f6;
  color: #f59e42;
  border-radius: 2rem;
  font-size: 12px;
  border: 1px solid #ffe4bb;
  font-weight: 500;
  padding: 0.2rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.22rem;
  cursor: pointer;
  transition:
    background 0.12s,
    border 0.12s,
    color 0.1s;
}
.desc-mini-btn:hover,
.desc-mini-btn.copied {
  background: #ffe7c7;
  color: #f97316;
  border-color: #f97316;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.game-cta {
  background: linear-gradient(to right, #fb923c, #f59e42 85%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 0.83rem 1.1rem;
  text-align: center;
  border-radius: 15px;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(251, 146, 60, 0.08);
  transition:
    background 0.16s,
    transform 0.13s;
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}
.game-cta:hover {
  background: linear-gradient(to right, #f59e42 80%, #fb923c 120%);
  transform: translateY(-1.5px) scale(1.025);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.19s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
mark {
  background: #fff7ed;
  color: #f97316;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
