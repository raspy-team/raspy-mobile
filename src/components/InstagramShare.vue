<template>
  <div class="flex flex-col items-center gap-4">
    <input
      ref="cameraInput"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="onImageSelected"
    />

    <button @click="triggerCamera" class="px-5 py-3 rounded bg-blue-500 text-white font-semibold">
      카메라로 촬영
    </button>

    <div v-if="photoPreview" class="relative w-48 h-80 rounded overflow-hidden border shadow">
      <img :src="photoPreview" alt="preview" class="w-full h-full object-cover" />
      <button
        @click="resetPhoto"
        class="absolute right-2 top-2 px-2 py-1 bg-white/80 text-xs rounded"
      >다시 찍기</button>
      <button
        v-if="!imageReady"
        @click="drawFinalImage"
        class="absolute left-2 bottom-2 px-3 py-1 bg-orange-500 text-white rounded"
      >합성하기</button>
    </div>

    <canvas
      ref="finalCanvas"
      width="1080"
      height="1920"
      class="my-2 rounded shadow border max-w-[300px] hidden"
    ></canvas>

    <div v-if="imageReady" class="flex gap-3 mt-2">
      <button @click="downloadImage" :disabled="downloading" class="px-5 py-3 rounded bg-green-500 text-white font-semibold flex items-center">
        <span v-if="!downloading">이미지 저장</span>
        <span v-else class="animate-spin ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
      </button>
      <button @click="goToInstagram" :disabled="loading" class="px-5 py-3 rounded bg-pink-500 text-white font-semibold flex items-center">
        <span v-if="!loading">인스타 스토리 올리기</span>
        <span v-else class="animate-spin ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cameraInput = ref(null)
const finalCanvas = ref(null)
const photoPreview = ref(null)
const imageReady = ref(false)
const loading = ref(false)
const downloading = ref(false)

const selectedFile = ref(null)

// 1. 카메라 촬영 트리거
const triggerCamera = () => {
  cameraInput.value?.click()
}

// 2. 촬영한 이미지 미리보기
const onImageSelected = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = () => {
    photoPreview.value = reader.result
    imageReady.value = false
    // canvas 숨김
    finalCanvas.value?.classList.add('hidden')
  }
  reader.readAsDataURL(file)
}

// 3. 다시 찍기
const resetPhoto = () => {
  photoPreview.value = null
  imageReady.value = false
  selectedFile.value = null
  finalCanvas.value?.classList.add('hidden')
}

// 4. 합성(캔버스 생성)
const drawFinalImage = () => {
  if (!photoPreview.value) return
  const canvas = finalCanvas.value
  const ctx = canvas.getContext('2d')
  const img = new window.Image()
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 상단 오렌지 배경
    ctx.fillStyle = '#f97316'
    ctx.fillRect(0, 0, canvas.width, 300)

    // 합성 텍스트
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 72px Pretendard, Arial'
    ctx.textBaseline = 'top'
    ctx.fillText('내가 원하는 문구', 60, 100)

    // 하단 워터마크/날짜 등도 추가 가능
    ctx.font = 'bold 36px Pretendard, Arial'
    ctx.fillText('Design by Raspy', 60, canvas.height - 80)

    imageReady.value = true
    canvas.classList.remove('hidden')
  }
  img.src = photoPreview.value
}

// 5. 로컬 저장
const downloadImage = () => {
  if (!imageReady.value) return
  downloading.value = true
  const base64 = finalCanvas.value.toDataURL('image/png')

  // 안드로이드 웹뷰(네이티브)라면 네이티브로 전달
  if (window.AndroidApp?.saveImageToGalleryWithBase64) {
    window.AndroidApp.saveImageToGalleryWithBase64(base64)
    setTimeout(() => { downloading.value = false }, 1000) // 네이티브에서 별도 콜백 구현시 대체
    return
  }

  // 브라우저라면 그냥 다운로드
  const link = document.createElement('a')
  link.href = base64
  link.download = 'story.png'
  link.click()
  downloading.value = false
}

// 6. 인스타그램으로 보내기 (WebView에서만 동작)
const goToInstagram = () => {
  if (!imageReady.value) return
  loading.value = true
  const base64 = finalCanvas.value.toDataURL('image/png')
  if (window.AndroidApp?.shareToInstagramStoryWithBase64) {
    window.AndroidApp.shareToInstagramStoryWithBase64(base64)
  } else if (window.webkit?.messageHandlers?.instagram) {
    window.webkit.messageHandlers.instagram.postMessage(base64)
  } else {
    window.location.href = 'instagram://story-camera'
  }
  setTimeout(() => { loading.value = false }, 3000)
}
</script>
