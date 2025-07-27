<template>
  <div class="flex flex-col items-center justify-center pt-7 min-h-full px-3 bg-neutral-50">
    <div
      class="w-full max-w-md bg-white rounded-2xl border border-orange-200 px-6 py-8"
      style="max-height: 75%"
    >
      <div class="mb-5 text-orange-600 text-[17px] font-semibold tracking-tight">
        ✓ 규칙 생성 완료
      </div>
      <div class="min-w-0 flex items-center gap-2 mb-5">
        <div>
          <div>
            <img
              class="w-10"
              :src="`/category-picture/${result.minorCategory || '미분류'}.png`"
              alt="카테고리 이미지"
            />
          </div>
        </div>
        <div>
          <span class="text-base font-extrabold text-gray-900 truncate block">
            {{ result.ruleTitle }}
          </span>
          <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
            {{ result.majorCategory }}
            <span v-if="result.minorCategory" class="mx-1 text-orange-500">&gt;</span>
            <span v-if="result.minorCategory">{{ result.minorCategory }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 overflow-auto" style="max-height: 56dvh">
        <div v-for="item in ruleList" :key="item.label" class="py-1 px-2">
          <div class="text-[13px] text-gray-400 font-medium mb-0.5">{{ item.label }}</div>
          <div class="text-[15px] text-gray-900 leading-snug font-normal whitespace-pre-line">
            {{ item.value }}
          </div>
        </div>
      </div>
      <div class="mt-5 mb-2 text-xs text-gray-400 text-center leading-tight">
        다음 단계에서 경기 정보(플레이어, 장소, 시간 등)를 입력합니다.
      </div>
      <button
        @click="$emit('next')"
        class="w-full py-3 mt-2 bg-orange-500 hover:bg-orange-600 text-white text-base font-bold rounded-xl transition"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'
const props = defineProps(['result'])

const ruleList = computed(() => [
  { label: '1. 목표', value: props.result.ruleGoal },
  { label: '2. 점수 정의', value: props.result.ruleScoreDefinition },
  { label: '3. 준비', value: props.result.rulePreparation },
  { label: '4. 순서', value: props.result.ruleOrder },
  { label: '5. 판정', value: props.result.ruleDecision },
  { label: '6. 반칙', value: props.result.ruleFoul },
  { label: '7. 기타', value: props.result.ruleExtraInfo || '-' },
])
</script>
