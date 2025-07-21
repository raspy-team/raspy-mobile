<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]" style="min-height: calc(var(--real-vh, 1vh) * 100)">
    <div class="bg-white w-[90dvw] max-w-[400px] rounded-2xl shadow-lg flex flex-col items-center p-4">
      <!-- 헤더 -->
      <div class="flex items-center justify-between w-full mb-3">
        <span class="text-base font-semibold">경기 결과 저장</span>
        <button @click="$emit('close')" class="p-1 text-gray-600 hover:text-gray-800">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- 팔레트 -->
      <div class="flex gap-3 mb-4">
        <div v-for="(item, i) in palette" :key="i"
          :style="{background: item.color, border: boxColor === item.color ? '2.5px solid #ff7300':'2.5px solid #eee'}"
          class="w-8 h-8 rounded-full cursor-pointer ring-1 ring-white"
          @click="selectPalette(item.color)">
        </div>
      </div>
      <!-- 정사각형 미리보기 -->
      <div class="flex items-center justify-center mb-4">
        <canvas ref="finalCanvas"
          width="1080" height="1080"
          class="rounded-xl shadow border"
          style="width:320px; height:320px; background:#fff; display:block;"
        />
      </div>
      <!-- 저장 -->
      <div class="flex justify-center w-full">
        <button v-if="!saved" @click="downloadImage" :disabled="downloading || !imageReady"
          class="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600">
          <i class="fas fa-download"></i>
          <span class="font-bold">저장</span>
        </button>
        <button v-else disabled class="ml-3 flex items-center gap-1 text-sm text-green-500">
          <i class="fas fa-check font-extrabold"></i>
          <span class="font-extrabold">저장됨</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps } from 'vue'
import defaultAvatar from '../assets/default.png'

// 팔레트
const palette = [
  { color: "#ff7300", name: "오렌지" },
  { color: "#ffe066", name: "라이트옐로우" },
  { color: "#fa5252", name: "레드" },
  { color: "#339af0", name: "블루" },
  { color: "#dee2e6", name: "그레이" },
  { color: "#222222", name: "다크" },
  { color: "#ffffff", name: "화이트" },
]
const boxColor = ref(palette[0].color)

function getTextColor(bg) {
  // 밝기 따라 글자색 자동
  const hex = bg.replace('#','')
  const r = parseInt(hex.substr(0,2),16)
  const g = parseInt(hex.substr(2,2),16)
  const b = parseInt(hex.substr(4,2),16)
  const yiq = ((r*299)+(g*587)+(b*114))/1000
  return yiq >= 180 ? '#222' : '#fff'
}

const saved = ref(false)
const props = defineProps({ game: Object, me: Object })
defineEmits(['close'])
const finalCanvas = ref(null)
const imageReady = ref(false)
const downloading = ref(false)

function selectPalette(color) {
  boxColor.value = color
  drawFinalImage()
  saved.value = false
}

const SIZE = 1080

function drawFinalImage() {
  const canvas = finalCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = SIZE
  canvas.height = SIZE
  ctx.clearRect(0, 0, SIZE, SIZE)

  // 박스 배경
  ctx.fillStyle = boxColor.value
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 텍스트 컬러
  const textColor = getTextColor(boxColor.value)
  const padX = SIZE * 0.07

  // 카테고리
  ctx.font = `${SIZE*0.038}px Pretendard, Arial`
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(props.game.rule.majorCategory || '', padX, padX)
  ctx.font = `bold ${SIZE*0.038}px Pretendard, Arial`
  ctx.fillText(props.game.rule.minorCategory || '', padX, padX + SIZE*0.07)

  // 날짜/시간
  ctx.textAlign = 'right'
  ctx.font = `${SIZE*0.036}px Pretendard, Arial`
  const date = new Date(props.game.date)
  const dateStr = `${date.getMonth()+1}.${date.getDate()}`
  const timeStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
  ctx.fillText(dateStr, SIZE - padX, padX + SIZE*0.01)
  ctx.fillText(timeStr, SIZE - padX, padX + SIZE*0.07)

  // 룰 타이틀
  ctx.textAlign = 'center'
  ctx.font = `bold ${SIZE*0.08}px Pretendard, Arial`
  ctx.fillText(props.game.rule.ruleTitle || '', SIZE/2, SIZE*0.23)

  // 장소
  ctx.font = ` ${SIZE*0.042}px Pretendard, Arial`
  ctx.fillText(props.game.location || '', SIZE/2, SIZE*0.33)

  // 점수
  ctx.font = `bold ${SIZE*0.115}px Pretendard, Arial`
  ctx.fillText(`${props.game.myScore} - ${props.game.opponentScore}`, SIZE/2, SIZE*0.52)

  // --- 아바타/닉네임
  const avatarSize = SIZE * 0.14
  const nicknameFontSize = SIZE * 0.037
  const nicknameFont = `bold ${nicknameFontSize}px Pretendard, Arial`
  const margin = SIZE * 0.018
  const groupHeight = avatarSize + margin + nicknameFontSize
  const groupCenterY = SIZE * 0.6 - 20
  const groupTopY = groupCenterY - groupHeight / 2

  // 내 아바타 (왼쪽)
  const meAvatarCenterX = padX + avatarSize / 2
  const meNicknameX = padX + avatarSize / 2
  const meImg = new window.Image()
  meImg.crossOrigin = "anonymous"
  meImg.onload = () => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(meAvatarCenterX, groupTopY + avatarSize/2, avatarSize/2, 0, Math.PI*2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(meImg, meAvatarCenterX - avatarSize/2, groupTopY, avatarSize, avatarSize)
    ctx.restore()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = avatarSize * 0.08
    ctx.beginPath()
    ctx.arc(meAvatarCenterX, groupTopY + avatarSize/2, avatarSize/2 + avatarSize*0.04, 0, Math.PI*2)
    ctx.stroke()

    // 닉네임
    ctx.font = nicknameFont
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText((props.me?.nickname || ''), meNicknameX, groupTopY*1.06  + avatarSize + margin)
  }
   meImg.src = props.me?.avatar || defaultAvatar

  // 상대 아바타 (오른쪽)
  const oppAvatarCenterX = SIZE - padX - avatarSize / 2
  const oppNicknameX = SIZE - padX - avatarSize / 2
  const oppImg = new window.Image()
  oppImg.crossOrigin = "anonymous"
  oppImg.onload = () => {
    ctx.save()
    ctx.beginPath()
    ctx.arc(oppAvatarCenterX, groupTopY + avatarSize/2, avatarSize/2, 0, Math.PI*2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(oppImg, oppAvatarCenterX - avatarSize/2, groupTopY, avatarSize, avatarSize)
    ctx.restore()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = avatarSize * 0.08
    ctx.beginPath()
    ctx.arc(oppAvatarCenterX, groupTopY + avatarSize/2, avatarSize/2 + avatarSize*0.04, 0, Math.PI*2)
    ctx.stroke()

    // 닉네임
    ctx.font = nicknameFont
    ctx.fillStyle = textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText((props.game.opponent?.nickname || ''), oppNicknameX, groupTopY*1.06 + avatarSize + margin)
  }
  oppImg.src = props.game.opponent?.avatar || defaultAvatar
 
  // --- RASPY (우하단)
  // 텍스트가 검은색 계열이면 'RASPY'는 항상 주황색, 아니면 텍스트컬러 유지
  ctx.font = `bold ${SIZE*0.05}px Pretendard, Arial`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = textColor === '#222' ? '#ff7300' : textColor
  ctx.fillText('Match', SIZE - padX*0.7, SIZE - padX*0.7)

  imageReady.value = true
}

function downloadImage() {
  if (!imageReady.value) return
  downloading.value = true
  saved.value = true
  const base64 = finalCanvas.value.toDataURL('image/png')
  
  // 안드로이드 네이티브 브릿지
  if (window.AndroidApp?.saveImageToGalleryWithBase64) {
    window.AndroidApp.saveImageToGalleryWithBase64(base64)
    setTimeout(() => downloading.value = false, 1000)
    return
  }
  // iOS WKWebView 네이티브 브릿지
  else if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.iosBridge
  ) {
    window.webkit.messageHandlers.iosBridge.postMessage({
      action: "saveImageToGalleryWithBase64",
      base64
    });
    setTimeout(() => downloading.value = false, 1000)
    return
  }

  // 데스크탑/모바일 웹(일반 다운로드)
  const link = document.createElement('a')
  link.href = base64
  link.download = 'story.png'
  link.click()
  downloading.value = false
}

import { onMounted } from 'vue'
onMounted(() => drawFinalImage())
</script>
