<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <!-- 배경 오버레이 -->
    <div 
      class="absolute inset-0 bg-black bg-opacity-50" 
      @click="$emit('close')"
    ></div>
    
    <!-- 모달 패널 -->
    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <!-- 헤더 -->
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        </div>
        
        <!-- 컨텐츠 -->
        <div class="p-6">
          <p class="text-sm text-gray-600 mb-4">{{ message }}</p>
          
          <!-- 추가 입력 필드 (필요한 경우) -->
          <div v-if="showReasonInput" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">사유</label>
            <textarea 
              v-model="reason" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="정지 사유를 입력하세요"
            ></textarea>
          </div>
          
          <div v-if="showRoleSelect" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">역할</label>
            <select 
              v-model="selectedRole" 
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ROLE_USER">ROLE_USER</option>
              <option value="ROLE_ADMIN">ROLE_ADMIN</option>
            </select>
          </div>
        </div>
        
        <!-- 푸터 -->
        <div class="p-6 border-t flex justify-end gap-3">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            취소
          </button>
          <button 
            @click="handleConfirm" 
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            :class="confirmButtonClass"
          >
            {{ loading ? '처리중...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '확인'
  },
  message: {
    type: String,
    default: '정말로 이 작업을 수행하시겠습니까?'
  },
  confirmText: {
    type: String,
    default: '확인'
  },
  confirmButtonClass: {
    type: String,
    default: 'bg-blue-600 hover:bg-blue-700'
  },
  showReasonInput: {
    type: Boolean,
    default: false
  },
  showRoleSelect: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const reason = ref('')
const selectedRole = ref('ROLE_USER')

function handleConfirm() {
  const data = {}
  if (props.showReasonInput) {
    data.reason = reason.value
  }
  if (props.showRoleSelect) {
    data.role = selectedRole.value
  }
  emit('confirm', data)
}

// 모달이 열릴 때마다 입력값 초기화
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    reason.value = ''
    selectedRole.value = 'ROLE_USER'
  }
})
</script>
