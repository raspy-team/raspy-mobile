<template>
  <transition name="fade">
    <div
      class="fixed h-full inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5 z-[10000000]"
      @click.self="close"
    >
      <div
        class="bg-white rounded-xl p-0 max-w-lg w-full relative z-[1000000000] flex flex-col"
        style="max-height: 90vh"
        @click.stop
      >
        <!-- 상단 헤더 + 만든이 심플표시 -->
        <div class="px-6 pt-6 pb-3 border-b flex justify-between items-start">
          <div class="min-w-0">
            <div class="font-bold text-lg text-gray-900 mb-1 truncate">
              {{ rule.ruleTitle }}
            </div>
            <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
              {{ rule.majorCategory }}
              <span class="mx-1 text-orange-500">&gt;</span>
              {{ rule.minorCategory }}
            </div>
          </div>
          <!-- 만든이: 심플 버전 -->
          <div
            v-if="rule.createdBy"
            class="flex items-center gap-1 ml-4 cursor-pointer mt-4"
            @click="goProfile(rule.createdBy.id)"
            title="만든이 프로필로 이동"
          >
            <span class="text-[11px] text-gray-400 font-semibold mr-1">규칙 만든이</span>
            <img
              :src="rule.createdBy.profile?.profilePicture || defaultProfile"
              class="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 object-cover"
              alt="프로필"
              loading="lazy"
            />
            <span class="ml-1 text-xs font-semibold text-gray-700 max-w-[70px] truncate">
              {{ rule.createdBy.nickname }}
            </span>
          </div>
        </div>

        <!-- 내용 (스크롤) -->
        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <ModalSection label="1. 경기 목표" :value="rule.ruleGoal" />
          <ModalSection label="2. 점수 정의" :value="rule.ruleScoreDefinition" />
          <ModalSection label="3. 경기 준비물" :value="rule.rulePreparation" />
          <ModalSection label="4. 경기 순서" :value="rule.ruleOrder" />
          <ModalSection label="5. 판정 방식" :value="rule.ruleDecision" />
          <ModalSection label="6. 반칙" :value="rule.ruleFoul" />
          <ModalSection label="7. 기타" :value="rule.ruleExtraInfo" />

          <div class="pt-1 space-y-2 text-[15px] text-gray-700 border-t">
            <div class="flex justify-between">
              <span class="text-gray-500">세트 승리 기준</span>
              <span>{{ rule.winBy === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">한 세트 승리 점수</span>
              <span>{{ rule.pointsToWin === -1 ? '제한 없음' : rule.pointsToWin + '점' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">총 세트 수</span>
              <span>{{ rule.setsToWin }}세트</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">세트 제한 시간</span>
              <span>{{ formatDuration(rule.duration) }}</span>
            </div>
          </div>
        </div>

        <!-- 닫기 버튼 -->
        <button
          @click="close"
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10"
          aria-label="Close"
        >
          ✕
        </button>
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
            h('div', { class: 'font-bold text-sm text-gray-800 mb-1' }, props.label),
            h(
              'pre',
              {
                class:
                  'whitespace-pre-line text-[15px] text-gray-700 leading-snug bg-orange-50/60 rounded-lg p-3 border border-orange-50 mb-1 overflow-x-auto',
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
  background: #e8e8e8;
  border-radius: 6px;
}
</style>
