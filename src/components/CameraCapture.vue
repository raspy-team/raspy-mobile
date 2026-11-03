<template>
  <!-- 할 일이라 아래에서 올라오는 시트 (가운데 창은 알림에만, 애플 HIG 11/3). 닫기는 시트의 X·바깥·뒤로가기 -->
  <UiSheet :model-value="isVisible" :title="title || '경기 시작 사진'" @update:model-value="(v) => !v && $emit('cancel')">
    <p class="t-caption">{{ subtitle || '소식 맨 앞에 보이고, 실제로 경기했다는 표시가 돼요' }}</p>
    <img v-if="capturedImage" :src="capturedImage" class="mt-4 w-full aspect-[4/3] object-cover rounded-xl bg-surface-2" alt="찍은 사진" />
    <button
      v-else
      type="button"
      class="mt-4 w-full aspect-[4/3] rounded-xl border border-dashed border-line-strong flex flex-col items-center justify-center gap-3 text-fg-muted active:bg-surface-2 transition-colors"
      @click.stop="triggerCamera"
    >
      <UiIcon name="camera" class="text-[32px]" />
      <span class="t-caption">두 사람이 함께 나오면 좋아요</span>
    </button>
    <template #footer>
      <div class="space-y-2">
        <UiButton v-if="!capturedImage" block size="lg" icon="camera" @click.stop="triggerCamera">사진 찍기</UiButton>
        <div v-else class="grid grid-cols-2 gap-2">
          <UiButton variant="secondary" icon="rotate-left" @click="retake">다시 찍기</UiButton>
          <UiButton icon="check" @click="confirm">{{ allowSkip ? '이 사진으로 시작' : '이 사진 쓰기' }}</UiButton>
        </div>
        <UiButton v-if="allowSkip && !capturedImage" block variant="ghost" @click="$emit('skip')">사진 없이 시작</UiButton>
      </div>
    </template>
  </UiSheet>

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
import { UiButton, UiIcon, UiSheet } from './ui'

const props = defineProps({
  // 인증샷 없이도 진행할 수 있으면 '사진 없이 시작'을 보여준다
  allowSkip: { type: Boolean, default: false },
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

const emit = defineEmits(['capture', 'cancel', 'skip'])

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
      window.AndroidApp.openCamera()
      // 콜백은 window.onCameraResult로 받음
    } catch (error) {
      console.error('Failed to call Android camera:', error)
      // 실패 시 fallback to web input
      cameraInputRef.value?.click()
    }
  } else if (isIOSWebView()) {
    try {
      cameraInputRef.value.click()

      // window.webkit.messageHandlers.iosBridge.postMessage({
      //   action: 'openCamera',
      //   type: 'photo',
      // })
      // 콜백은 window.onCameraResult로 받음
    } catch (error) {
      console.error('Failed to call iOS camera:', error)
      // 실패 시 fallback to web input
      cameraInputRef.value?.click()
    }
  } else {
    // PC 또는 일반 웹에서는 파일 입력 사용
    if (cameraInputRef.value) {
      try {
        cameraInputRef.value.click()
      } catch (error) {
        console.error('Failed to trigger camera:', error)
      }
    } else {
      console.warn('Camera input ref is not available')
    }
  }
}

// 네이티브 카메라 콜백 등록 (onMounted에서 처리)
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.onCameraResult = async (base64Image) => {
      try {
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
