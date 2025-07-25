<template>
  <div>
    <div class="mb-3 text-base font-bold">{{ label }}</div>
    <!-- 기존 스포츠 카테고리일 때만 규칙 토글 노출 -->
    <div v-if="canShowPreset" class="flex flex-col gap-3 mb-3">
      <label
        class="flex items-center gap-3 bg-gray-100 p-3 rounded-lg shadow-sm cursor-pointer transition hover:bg-orange-50"
      >
        <input type="checkbox" v-model="checkedPreset" class="accent-orange-500 w-5 h-5" />
        <span class="text-base font-semibold text-gray-700">기존 스포츠 규칙을 따릅니다.</span>
      </label>
    </div>
    <!-- 직접입력 (항상 노출) -->
    <textarea
      :placeholder="inputPlaceholder"
      class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
      v-model="localInput"
      :maxlength="inputMax"
      :rows="textarea ? 5 : 3"
      @input="emitValue"
    />
    <div class="flex justify-end text-xs text-gray-400">{{ localInput.length }}/{{ inputMax }}</div>
  </div>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  label: String,
  major: String,
  inputPlaceholder: String,
  inputMax: Number,
  value: String,
  textarea: Boolean,
})

const emit = defineEmits(['update-input'])

const checkedPreset = ref(false)
const localInput = ref('')

// value로 부터 checkedPreset, localInput 세팅
const canShowPreset = computed(() => props.major === '기존 스포츠')

// value 파싱 (초기값)
watch(
  () => props.value,
  (v) => {
    if (canShowPreset.value && v && v.startsWith('기존 스포츠 규칙을 따릅니다.')) {
      checkedPreset.value = true
      localInput.value = v.replace(/^기존 스포츠 규칙을 따릅니다\.\n?/, '')
    } else {
      checkedPreset.value = false
      localInput.value = v || ''
    }
  },
  { immediate: true },
)

// major 바뀌면 preset 초기화
watch(
  () => props.major,
  () => {
    checkedPreset.value = false
    localInput.value = ''
    emitValue()
  },
)

// value 조합 후 emit
function emitValue() {
  let val = ''
  if (canShowPreset.value && checkedPreset.value) {
    val = '기존 스포츠 규칙을 따릅니다.'
    if (localInput.value.trim().length > 0) {
      val += '\n' + localInput.value
    }
  } else {
    val = localInput.value
  }
  emit('update-input', val)
}

// 토글 변경 시도 emit
watch(checkedPreset, emitValue)
</script>
