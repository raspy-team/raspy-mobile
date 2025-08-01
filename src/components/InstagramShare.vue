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
      <!-- 이미지 팔레트 -->
<div class="flex flex-col gap-2 mb-4">
  <div
    v-for="rowIdx in Math.ceil(palette.length / 5)"
    :key="rowIdx"
    class="flex gap-3"
  >
    <div
      v-for="(item) in palette.slice((rowIdx - 1) * 5, rowIdx * 5)"
      :key="item.image"
      @click="selectPalette(item.image)"
      :class="[
        'w-12 h-12 rounded-xl cursor-pointer border-2 overflow-hidden flex items-center justify-center',
        selectedImage === item.image ? 'border-orange-500' : 'border-gray-200'
      ]"
    >
      <img :src="item.image" class="object-cover w-full h-full" />
    </div>
  </div>
</div>

      <!-- 정사각형 미리보기 -->
      <div class="flex items-center justify-center mb-4">
        <canvas ref="finalCanvas"
          width="1080" height="1080"
          class="rounded-xl "
          style="width:320px; height:320px; display:block;"
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
import { ref, defineEmits, defineProps, onMounted } from 'vue'
import defaultAvatar from '../assets/default.png'
import winnerCrown from '../assets/winner-crown.png'
import winnerCrownBlack from '../assets/winner-crown-black.png'
import matchLogo from '../assets/Match.png'

const palette = [
  { image: require('../assets/result-cards/1.png') },
  { image: require('../assets/result-cards/2.png') },
  { image: require('../assets/result-cards/3.png') },
  { image: require('../assets/result-cards/4.png') },
  { image: require('../assets/result-cards/5.png') },
  { image: require('../assets/result-cards/6.png') },
  { image: require('../assets/result-cards/7.png') },
  { image: require('../assets/result-cards/8.png') },
  { image: require('../assets/result-cards/9.png') },
]
const selectedImage = ref(palette[0].image)

const saved = ref(false)
const props = defineProps({ game: Object, me: Object })
defineEmits(['close'])
const finalCanvas = ref(null)
const imageReady = ref(false)
const downloading = ref(false)

function selectPalette(imgUrl) {
  selectedImage.value = imgUrl
  drawFinalImage()
  saved.value = false
}

const SIZE = 1024

function getTextColor(imgUrl) {
  const idx = palette.findIndex(p => p.image === imgUrl)
  return idx <= 4 ? '#fff' : '#222'
}
function getCrownImg(imgUrl) {
  return getTextColor(imgUrl) === '#222' ? winnerCrownBlack : winnerCrown
}

function drawFinalImage() {
  const canvas = finalCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = SIZE
  canvas.height = SIZE
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = "#000"

  const bgImg = new window.Image()
  bgImg.crossOrigin = "anonymous"
  bgImg.onload = () => {
    ctx.drawImage(bgImg, 0, 0, SIZE, SIZE)

    const textColor = getTextColor(selectedImage.value)
    const padX = SIZE * 0.1

    // ---- [카테고리 아이콘 그리기] ----
    const minorCategoryName = props.game.rule.minorCategory || '미분류'
    const isBright = textColor === '#222'
    const categoryIconPath =
      isBright
        ? `/category-picture-black/${encodeURIComponent(minorCategoryName)}.png`
        : `/category-picture-white/${encodeURIComponent(minorCategoryName)}.png`

    const iconSize = SIZE * 0.07
    const iconX = padX - iconSize - SIZE * 0.03 + 69
    const iconY = padX - 15

    function drawAll(ctx) {
     const minorText = props.game.rule.minorCategory || ''
  let fontSize = SIZE * 0.066
  let yOffset = 0
  if (minorText.length >= 6) {
    fontSize = SIZE * 0.036
    yOffset = 15
  } else if (minorText.length >= 4) {
    fontSize = SIZE * 0.048
    yOffset = 8
  }
  ctx.font = `bold ${fontSize}px Pretendard, Arial`
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  // x좌표는 고정, y좌표는 yOffset 더함
  ctx.fillText(minorText, padX + 56, padX  + yOffset - 5)

  // ---- [날짜/시간: 중앙 정렬, 굵게, 줄바꿈] ----
  const date = new Date(props.game.date)
  const dateStr = `${date.getMonth()+1}월 ${date.getDate()}일`
  const timeStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`

  ctx.textAlign = 'center'
  ctx.font = `bold ${SIZE*0.045}px Pretendard, Arial`
  ctx.fillStyle = textColor
  ctx.textBaseline = 'top'
  // 카드 중앙 y좌표, 예: 룰 타이틀 아래쪽에 살짝 띄움
  const dateY = SIZE * 0.08
  ctx.fillText(dateStr, SIZE*0.85, dateY)
    ctx.font = `bold ${SIZE*0.057}px Pretendard, Arial`

  ctx.fillText(timeStr, SIZE*0.85, dateY + SIZE*0.062 ) // 줄바꿈

  // ---- [룰 타이틀 및 장소 위치 조정 (날짜 영역과 겹치지 않도록)] ----
  ctx.font = `bold ${SIZE*0.08}px Pretendard, Arial`
  ctx.fillText(props.game.rule.ruleTitle || '', SIZE/2, SIZE*0.21)

  ctx.font = ` ${SIZE*0.042}px Pretendard, Arial`
  ctx.fillText(props.game.location || '', SIZE/2, SIZE*0.32)
      // 점수
      ctx.font = `bold ${SIZE*0.16}px Pretendard, Arial`
      ctx.fillText(`${props.game.myScore}    ${props.game.opponentScore}`, SIZE/2, SIZE*0.5)

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

        if (props.game.myScore > props.game.opponentScore) {
          const crownImg = new window.Image()
          crownImg.src = getCrownImg(selectedImage.value)
          crownImg.onload = () => {
            const crownW = avatarSize * 0.4
            const crownH = crownW * 0.9
            const crownX = meAvatarCenterX - crownW/2
            const crownY = groupTopY - crownH * 1.6
            ctx.drawImage(crownImg, crownX, crownY, crownW, crownH)
          }
        }
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

        if (props.game.myScore < props.game.opponentScore) {
          const crownImg = new window.Image()
          crownImg.src = getCrownImg(selectedImage.value)
          crownImg.onload = () => {
            const crownW = avatarSize * 0.4
            const crownH = crownW * 0.9
            const crownX = oppAvatarCenterX - crownW/2
            const crownY = groupTopY - crownH * 1.6
            ctx.drawImage(crownImg, crownX, crownY, crownW, crownH)
          }
        }
        ctx.font = nicknameFont
        ctx.fillStyle = textColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText((props.game.opponent?.nickname || ''), oppNicknameX, groupTopY*1.06 + avatarSize + margin)
      }
      oppImg.src = props.game.opponent?.avatar || defaultAvatar

      // --- 우측 하단 Match 로고
      const logoW = SIZE * 0.16
      const logoH = logoW * 1.0 // 비율 맞춰서 조정 (Match.png 비율)
      const logoMargin = SIZE * 0.045
      const logoX = SIZE - logoW - logoMargin - 17
      const logoY = SIZE - logoH - logoMargin

      const logoImg = new window.Image()
      logoImg.onload = () => {
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
        imageReady.value = true
      }
      logoImg.src = matchLogo
      // imageReady.value는 로고 그려진 후에만 true!
    }

    // [카테고리 아이콘 로드 후 drawAll 실행]
    const catImg = new window.Image()
    catImg.crossOrigin = 'anonymous'
    catImg.onload = () => {
      ctx.drawImage(catImg, iconX, iconY, iconSize, iconSize)
      drawAll(ctx)
    }
    catImg.onerror = () => drawAll(ctx)
    catImg.src = categoryIconPath
  }
  bgImg.src = selectedImage.value
}

function downloadImage() {
  if (!imageReady.value) return
  downloading.value = true
  saved.value = true
  const base64 = finalCanvas.value.toDataURL('image/png')
  if (window.AndroidApp?.saveImageToGalleryWithBase64) {
    window.AndroidApp.saveImageToGalleryWithBase64(base64)
    setTimeout(() => downloading.value = false, 1000)
    return
  }
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
  const link = document.createElement('a')
  link.href = base64
  link.download = 'story.png'
  link.click()
  downloading.value = false
}

onMounted(() => drawFinalImage())
</script>
