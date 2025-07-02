<template>
  <div class="text-center">
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImageSelected" />

    <button @click="triggerCamera" class="p-2 bg-blue-500 text-white rounded">카메라 촬영</button>

    <canvas ref="finalCanvas" width="1080" height="1920" class="my-4 hidden"></canvas>

    <button v-if="imageReady" @click="downloadImage" class="p-2 bg-green-500 text-white rounded">이미지 다운로드</button>
    <button v-if="imageReady" @click="goToInstagram" class="p-2 bg-pink-500 text-white rounded">인스타 스토리 올리기</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const cameraInput = ref(null)
const finalCanvas = ref(null)
const imageReady = ref(false)

const triggerCamera = () => {
  cameraInput.value?.click()
}

const onImageSelected = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => drawFinalImage(img)
    img.src = reader.result
  }
  reader.readAsDataURL(file)
}

const drawFinalImage = (photo) => {
  const canvas = finalCanvas.value
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#f97316'
  ctx.fillRect(0, 0, canvas.width, 300)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 48px Arial'
  ctx.fillText('합성된 텍스트', 50, 150)

  imageReady.value = true
  canvas.classList.remove('hidden')
}

const downloadImage = () => {
  const base64 = finalCanvas.value.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = base64
  link.download = 'story.png'
  link.click()
}

const goToInstagram = () => {
  if (window.webkit?.messageHandlers?.instagram) {
    // 추후 WebView Shell에서 Native 호출
    window.webkit.messageHandlers.instagram.postMessage(null)
  } else if (window.AndroidInterface?.shareToInstagram) {
    window.AndroidInterface.shareToInstagram()
  } else {
    // 웹 환경 인스타 스토리 화면 이동
    window.location.href = 'instagram://story-camera'
  }
}
</script>
