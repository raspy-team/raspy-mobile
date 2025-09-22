<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <!-- 배경 오버레이 -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50" 
      @click="$emit('close')"
    ></div>
    
    <!-- 드로어 패널 -->
    <div 
      class="absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': isOpen, 'translate-x-full': !isOpen }"
    >
      <!-- 헤더 -->
      <div class="flex items-center justify-between p-4 border-b">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <button 
          @click="$emit('close')" 
          class="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>
      
      <!-- 컨텐츠 -->
      <div class="p-4 overflow-y-auto h-full">
        <slot :data="data"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '상세 정보'
  },
  data: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close'])
</script>

<style scoped>
/* 스크롤바 스타일링 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
