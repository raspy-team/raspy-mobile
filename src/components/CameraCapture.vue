<template>
  <div v-if="isVisible" class="fixed inset-0 bg-black z-[99999] flex flex-col">
    <!-- 헤더 -->
    <div class="absolute top-0 left-0 right-0 z-10 pt-safe">
      <div class="px-5 py-4 bg-gradient-to-b from-black/60 to-transparent">
        <h2 class="text-white text-lg font-bold text-center">
          {{ title || '경기 시작 인증샷' }}
        </h2>
        <p class="text-white/80 text-sm text-center mt-1">
          {{ subtitle || '피드에 표시될 사진을 촬영해주세요' }}
        </p>
      </div>
    </div>

    <!-- 카메라 뷰 / 프리뷰 -->
    <div class="flex-1 relative overflow-hidden">
      <!-- 카메라 스트림 -->
      <video
        v-show="!capturedImage"
        ref="videoElement"
        autoplay
        playsinline
        class="w-full h-full object-cover"
      ></video>

      <!-- 촬영된 이미지 프리뷰 -->
      <img
        v-if="capturedImage"
        :src="capturedImage"
        class="w-full h-full object-cover"
        alt="Captured"
      />

      <!-- 가이드 오버레이 -->
      <div v-if="!capturedImage" class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 border-4 border-white/20 m-8 rounded-3xl"></div>
      </div>
    </div>

    <!-- 하단 컨트롤 -->
    <div class="absolute bottom-0 left-0 right-0 pb-safe">
      <div class="px-5 py-6 bg-gradient-to-t from-black/70 to-transparent">
        <!-- 촬영 전 -->
        <div v-if="!capturedImage" class="flex justify-center items-center gap-8">
          <button
            @click="$emit('cancel')"
            class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <i class="fas fa-times text-white text-xl"></i>
          </button>

          <button
            @click="capturePhoto"
            class="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-lg active:scale-95 transition-transform"
          >
            <div
              class="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-orange-600"
            ></div>
          </button>

          <button
            @click="switchCamera"
            class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <i class="fas fa-sync-alt text-white text-xl"></i>
          </button>
        </div>

        <!-- 촬영 후 -->
        <div v-else class="flex justify-center items-center gap-4">
          <button
            @click="retake"
            class="flex-1 py-3 px-6 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold active:scale-95 transition-transform"
          >
            <i class="fas fa-redo mr-2"></i>재촬영
          </button>
          <button
            @click="confirm"
            class="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg active:scale-95 transition-transform"
          >
            <i class="fas fa-check mr-2"></i>사용하기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue'

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
})

const emit = defineEmits(['capture', 'cancel'])

const videoElement = ref(null)
const capturedImage = ref(null)
const stream = ref(null)
const currentFacingMode = ref('environment') // 'user' or 'environment'

// 카메라 시작
const startCamera = async () => {
  try {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => track.stop())
    }

    const constraints = {
      video: {
        facingMode: currentFacingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoElement.value) {
      videoElement.value.srcObject = stream.value
    }
  } catch (error) {
    console.error('Camera access error:', error)
    alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.')
    emit('cancel')
  }
}

// 카메라 전환
const switchCamera = async () => {
  currentFacingMode.value = currentFacingMode.value === 'user' ? 'environment' : 'user'
  await startCamera()
}

// 사진 촬영
const capturePhoto = () => {
  if (!videoElement.value) return

  const canvas = document.createElement('canvas')
  canvas.width = videoElement.value.videoWidth
  canvas.height = videoElement.value.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height)

  capturedImage.value = canvas.toDataURL('image/jpeg', 0.9)
}

// 재촬영
const retake = () => {
  capturedImage.value = null
}

// 확인
const confirm = () => {
  if (!capturedImage.value) return

  // base64를 Blob으로 변환
  fetch(capturedImage.value)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], 'game-start-photo.jpg', { type: 'image/jpeg' })
      emit('capture', file)
    })
}

// 카메라 정리
const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }
}

// isVisible 변경 감지
watch(
  () => props.isVisible,
  (newVal) => {
    if (newVal) {
      capturedImage.value = null
      startCamera()
    } else {
      stopCamera()
    }
  },
)

onMounted(() => {
  if (props.isVisible) {
    startCamera()
  }
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.pt-safe {
  padding-top: env(safe-area-inset-top);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
