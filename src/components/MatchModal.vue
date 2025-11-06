<template>
  <transition name="fade">
    <div
      class="fixed h-full top-0 inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-5 z-[100000]"
      style="margin-top: 0px"
      @click.self="close"
    >
      <div
        class="bg-gray-800 rounded-xl p-0 max-w-lg w-full top-0 relative z-[1000000000] flex flex-col border border-gray-700 shadow-2xl"
        style="max-height: 90vh"
        @click.stop
      >
        <!-- 상단 헤더 + 만든이 심플표시 -->
        <div class="px-4 pt-6 pb-3 border-b border-gray-600 flex justify-between items-start bg-gray-900 rounded-t-xl">
          <div class="min-w-0 flex items-center justify-start gap-2">
            <div>
              <img
                class="w-12 h-12 rounded-lg bg-gray-600 border border-gray-500 object-cover"
                :src="`/category-picture/${rule.minorCategory || '미분류'}.png`"
                alt="카테고리 이미지"
              />
            </div>
            <div>
              <div class="text-base font-extrabold text-white mb-1 truncate">
                {{ rule.ruleTitle }}
              </div>
              <div class="flex gap-1 items-center mt-1 text-xs text-orange-400 font-medium">
                {{ rule.majorCategory }}
                <span v-if="rule.minorCategory" class="mx-1 text-orange-400">&gt;</span>
                <span v-if="rule.minorCategory">{{ rule.minorCategory }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <!-- 만든이: 심플 버전 -->
            <div
              v-if="rule.createdBy"
              class="flex items-center gap-2 cursor-pointer"
              @click="goProfile(rule.createdBy.id)"
              title="만든이 프로필로 이동"
            >
              <img
                :src="rule.createdBy.profile?.profilePicture || defaultProfile"
                class="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-500 object-cover"
                alt="프로필"
                loading="lazy"
              />
              <span class="text-xs font-medium text-gray-300 max-w-[80px] truncate">
                {{ rule.createdBy.nickname }}
              </span>
            </div>
            <!-- 닫기 버튼 -->
            <button
              @click="close"
              class="text-gray-400 hover:text-white transition-colors duration-200 rounded-full hover:bg-gray-700 p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- 내용 (스크롤) -->
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-gray-900">
          <ModalSection label="1. 경기 목표" :value="rule.ruleGoal" />
          <ModalSection label="2. 점수 정의" :value="rule.ruleScoreDefinition" />
          <ModalSection label="3. 경기 준비물" :value="rule.rulePreparation" />
          <ModalSection label="4. 경기 순서" :value="rule.ruleOrder" />
          <ModalSection label="5. 판정 방식" :value="rule.ruleDecision" />
          <ModalSection label="6. 반칙" :value="rule.ruleFoul" />
          <ModalSection label="7. 기타" :value="rule.ruleExtraInfo" />

          <div class="pt-2 space-y-3 text-[15px] text-gray-300 border-t border-gray-600">
            <div class="flex justify-between items-center py-1">
              <span class="text-gray-400 font-medium">세트 승리 기준</span>
              <span class="text-white font-semibold">{{ rule.winBy === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달' }}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-gray-400 font-medium">한 세트 승리 점수</span>
              <span class="text-white font-semibold">{{ rule.pointsToWin === -1 ? '제한 없음' : rule.pointsToWin + '점' }}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-gray-400 font-medium">총 세트 수</span>
              <span class="text-white font-semibold">{{ rule.setsToWin }}세트</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-gray-400 font-medium">세트 제한 시간</span>
              <span class="text-white font-semibold">{{ formatDuration(rule.duration) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { h, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import defaultProfile from '@/assets/default.png' // 경로는 프로젝트에 맞게 조정

defineProps({
  rule: { type: Object, required: true },
})
const emit = defineEmits(['close'])
const router = useRouter()

function formatDuration(duration) {
  if (duration === -1) return '제한 없음'
  if (duration >= 60) return `${Math.floor(duration / 60)}분 ${duration % 60}초`
  return `${duration}초`
}
// ModalSection (setup 내에서 바로 선언)
const ModalSection = defineComponent({
  props: {
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      props.value && props.value.trim() !== ''
        ? h('div', [
            h('div', { class: 'text-xs text-orange-400 font-medium mb-1' }, props.label),
            h(
              'pre',
              {
                class:
                  'whitespace-pre-line text-sm text-gray-300 leading-relaxed bg-gray-800 rounded-xl p-3 border border-gray-600 mb-1 overflow-x-auto',
                style: 'max-height:180px',
              },
              props.value,
            ),
          ])
        : null
  },
})
function close() {
  emit('close')
}
function goProfile(userId) {
  if (!userId) return
  router.push(`/profile/${userId}`)
}
</script>

<style scoped>
.flex-1::-webkit-scrollbar {
  width: 7px;
}
.flex-1::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 6px;
}
.flex-1::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
