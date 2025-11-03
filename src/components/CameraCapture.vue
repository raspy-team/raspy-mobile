<template>
  <!-- 모달 UI -->
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center"
  >
    <div class="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
      <!-- 헤더 -->
      <div class="px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-600">
        <h2 class="text-white text-xl font-bold text-center">
          {{ title || '경기 시작 인증샷' }}
        </h2>
        <p class="text-white/90 text-sm text-center mt-2">
          {{ subtitle || '피드에 표시될 사진을 선택해주세요' }}
        </p>
      </div>

      <!-- 이미지 프리뷰 -->
      <div v-if="capturedImage" class="p-4">
        <img
          :src="capturedImage"
          class="w-full aspect-square object-cover rounded-xl border-2 border-gray-200"
          alt="Selected"
        />
      </div>

      <!-- 설명 -->
      <div v-else class="p-8">
        <div class="flex flex-col items-center justify-center gap-4 text-center">
          <div class="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">
            <i class="fas fa-camera text-orange-500 text-4xl"></i>
          </div>
          <div class="space-y-2">
            <p class="text-gray-700 font-semibold">사진을 촬영하세요</p>
            <p class="text-gray-500 text-sm">
              촬영한 사진은 피드의 첫 화면에 노출되며<br />실제로 경기를 진행했음을 증명해요
            </p>
          </div>
        </div>
      </div>

      <!-- 버튼 영역 -->
      <div class="px-4 pb-4 space-y-3">
        <button
          v-if="!capturedImage"
          @click.stop="triggerCamera"
          class="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <i class="fas fa-camera text-2xl"></i>
          <span class="text-lg">사진 촬영하기</span>
        </button>

        <div v-else class="grid grid-cols-2 gap-3">
          <button
            @click="retake"
            class="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold active:scale-95 transition-all"
          >
            <i class="fas fa-redo mr-2"></i>다시 촬영
          </button>
          <button
            @click="confirm"
            class="py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg active:scale-95 transition-all"
          >
            <i class="fas fa-check mr-2"></i>사용하기
          </button>
        </div>

        <button
          @click="$emit('cancel')"
          class="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold active:scale-95 transition-all"
        >
          취소
        </button>
      </div>
    </div>
  </div>

  <!-- 숨겨진 파일 입력 (모달 외부에 배치 - 안드로이드 웹뷰 호환성) -->
  <input
    ref="cameraInputRef"
    type="file"
    accept="image/*"
    capture="environment"
    @change="onImageChange"
    class="hidden"
  />
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'
import { compressImage, dataUrlToFile } from '../utils/gamePictureStorage'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  autoOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['capture', 'cancel'])

const cameraInputRef = ref(null)
const capturedImage = ref(null)
const selectedFile = ref(null)

// 안드로이드 웹뷰 감지
const isAndroidWebView = () => {
  return window.AndroidApp !== undefined
}

// iOS 웹뷰 감지
const isIOSWebView = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    userAgent.includes('raspy-ios') ||
    (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iosBridge)
  )
}

// 카메라 트리거
const triggerCamera = () => {
  // 안드로이드 웹뷰에서는 네이티브 카메라 사용
  if (isAndroidWebView()) {
    try {
      console.log('Calling Android native camera...')
      window.AndroidApp.openCamera()
      // 콜백은 window.onCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android camera:', error)
      // 실패 시 fallback to web input
      cameraInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      console.log('Calling iOS native camera...')
      window.webkit.messageHandlers.iosBridge.postMessage({
        action: 'openCamera',
        type: 'photo',
      })
      // 콜백은 window.onCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS camera:', error)
      // 실패 시 fallback to web input
      cameraInputRef.value?.click()
    }
  } else if (cameraInputRef.value) {
    // 일반 웹에서는 기존 방식 사용
    try {
      console.log('Triggering camera input...')
      cameraInputRef.value.click()
    } catch (error) {
      console.error('Failed to trigger camera:', error)
    }
  } else {
    console.warn('Camera input ref is not available')
  }
}

// 네이티브 카메라 콜백 등록 (onMounted에서 처리)
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.onCameraResult = async (base64Image) => {
      try {
        console.log('Received image from native camera (CameraCapture)')
        // base64 이미지를 받아서 처리
        const compressedDataUrl = await compressImage(base64Image)
        capturedImage.value = compressedDataUrl
        selectedFile.value = dataUrlToFile(compressedDataUrl, 'camera_image.jpg')
      } catch (error) {
        console.error('Failed to process camera image:', error)
      }
    }
  }
})

// 네이티브 카메라 콜백 정리
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.onCameraResult = null
  }
})

// 이미지 선택
const onImageChange = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        // 이미지 압축 (화질 30%)
        const compressedDataUrl = await compressImage(reader.result)
        capturedImage.value = compressedDataUrl
        // 압축된 이미지를 File 객체로 변환
        selectedFile.value = dataUrlToFile(compressedDataUrl, file.name)
      } catch (error) {
        console.error('이미지 압축 실패:', error)
        // 압축 실패 시 원본 사용
        selectedFile.value = file
        capturedImage.value = URL.createObjectURL(file)
      }
    }
    reader.readAsDataURL(file)
  }
  // input 초기화 (같은 파일 재선택 가능하도록)
  e.target.value = ''
}

// 재촬영
const retake = () => {
  capturedImage.value = null
  selectedFile.value = null
}

// 확인
const confirm = () => {
  if (!selectedFile.value) return
  emit('capture', selectedFile.value)
  capturedImage.value = null
  selectedFile.value = null
}

// isVisible 변경 감지 - 닫힐 때 초기화, 열릴 때 autoOpen이면 자동 실행
watch(
  () => props.isVisible,
  (newVal) => {
    if (!newVal) {
      capturedImage.value = null
      selectedFile.value = null
    } else if (newVal && props.autoOpen) {
      // 모달이 열릴 때 autoOpen이 true면 자동으로 카메라 실행
      // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 실행
      setTimeout(() => {
        triggerCamera()
      }, 150)
    }
  },
)
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
