<template>
  <div class="fixed inset-0 z-[60]">
    <div class="absolute inset-0 bg-black/90" @click="emit('close')"></div>

    <div
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col max-h-[85vh]"
    >
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <span class="font-bold text-lg text-white">{{ title }}</span>
        <button
          @click="emit('close')"
          class="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 flex items-center justify-center"
          aria-label="닫기"
        >
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>

      <div class="flex-1 p-5 overflow-y-auto">
        <textarea
          :value="modelValue"
          @input="emit('update:modelValue', $event.target.value)"
          class="w-full h-full min-h-[300px] text-base text-white focus:outline-none resize-none bg-transparent placeholder-gray-500"
          :placeholder="placeholder"
          autofocus
        ></textarea>
      </div>

      <div class="px-5 py-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
        <span>{{ modelValue?.length || 0 }}자</span>
        <button @click="emit('close')" class="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium">완료</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 경기 결과에서 상대 리뷰·규칙 의견을 길게 쓰는 창. 쓴 내용은 v-model로 부모에 남는다
import { defineProps, defineEmits } from 'vue'
defineProps({
  modelValue: { type: String, default: '' },
  title: { type: String, required: true },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'close'])
</script>
