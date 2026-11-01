<template>
  <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
    <div class="flex items-center gap-2 mb-3">
      <UiIcon :name="'fas ' + icon" class="text-fg-muted" />
      <h3 class="font-bold text-gray-900">{{ label }}</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- 원본 -->
      <div>
        <p class="text-xs font-medium text-gray-500 mb-2">원본</p>
        <div
          :class="[
            'bg-white border-2 rounded-lg p-3',
            hasChanged ? 'border-red-200' : 'border-gray-200',
          ]"
        >
          <p
            :class="[
              'text-sm',
              multiline ? 'whitespace-pre-wrap' : 'truncate',
              hasChanged ? 'text-red-600 line-through' : 'text-gray-700',
            ]"
          >
            {{ original || '없음' }}
          </p>
        </div>
      </div>

      <!-- 수정본 -->
      <div>
        <p class="text-xs font-medium text-gray-500 mb-2">수정본</p>
        <div
          :class="[
            'bg-white border-2 rounded-lg p-3',
            hasChanged ? 'border-green-200 bg-green-50' : 'border-gray-200',
          ]"
        >
          <p
            :class="[
              'text-sm font-medium',
              multiline ? 'whitespace-pre-wrap' : 'truncate',
              hasChanged ? 'text-green-700' : 'text-gray-700',
            ]"
          >
            {{ modified || '없음' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 변경 사항 표시 -->
    <div v-if="hasChanged" class="mt-2 flex items-center gap-2 text-xs text-orange-600">
      <UiIcon name="fas fa-arrow-right" />
      <span class="font-semibold">변경됨</span>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  label: String,
  icon: String,
  original: [String, Number],
  modified: [String, Number],
  multiline: Boolean,
})

const hasChanged = computed(() => {
  const orig = props.original || ''
  const mod = props.modified || ''
  return String(orig) !== String(mod)
})
</script>
