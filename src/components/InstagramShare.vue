<template>
  <!-- 인스타그램 공유 모달 -->
  <div class="fixed top-[-24px] pt-[5dvh] inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center h-dvh z-[10000]">
    <div class="bg-white w-[90dvw] h-[90dvh] rounded-2xl overflow-scroll  shadow-lg">

      <!-- 헤더: 타이틀 + 닫기 -->
      <div class="flex items-center justify-between p-3 bg-white border-b">
        <span class="text-base font-semibold">경기 결과 공유</span>
        <button @click="$emit('close')" class="p-1 text-gray-600 hover:text-gray-800">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 바디: 미리보기 + 팔레트 + 촬영 -->
      <div class="p-3 bg-gray-100 flex flex-col items-center">
        <!-- 팔레트 -->
        <div class="flex gap-3 mb-3">
          <div v-for="(item, i) in palette" :key="i"
               :style="{background: item.color, border: bgColor === item.color ? '2.5px solid #ff7300':'2.5px solid #eee'}"
               class="w-8 h-8 rounded-full cursor-pointer ring-1 ring-white"
               @click="selectPalette(item.color)">
          </div>
        </div>
        <!-- 미리보기 (iPhone 세로 규격) -->
        <div class="w-full flex justify-center items-center bg-[#222] py-4">
          <div style="width:234px; aspect-ratio:117/253; position:relative;">
            <canvas ref="finalCanvas"
              width="1170" height="2532"
              class="rounded-2xl shadow border"
              style="width:100%; height:auto; display:block; background:#eee"
            />
          </div>
        </div>
        <!-- 촬영/재촬영 버튼 -->
        <div class="flex gap-3 mt-3">
          <button
            @click="triggerCamera"
            class="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow text-sm"
          >
            <i class="fas fa-camera"></i>
            <span>{{ usingPhoto ? '재촬영' : '카메라로 배경 촬영하기' }}</span>
          </button>
          <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImageSelected" />
        </div>
      </div>

      <!-- 액션 바: 저장 / 공유 -->
      <div class="flex justify-around items-center p-3 bg-white border-t">
        <div v-if="!saved">
          <button @click="downloadImage" :disabled="downloading || !imageReady"
                  class="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600">
            <i class="fas fa-download"></i>
            <span class="font-bold">저장</span>
          </button>
        </div>
        <div v-else>
          <button
            disabled
                  class="flex items-center gap-1 text-sm text-green-500 hover:text-orange-600">
          
            <i class="fas fa-check font-extrabold"></i>
            <span class="font-extrabold">저장됨</span>
          </button>
        </div>
        <div>
          <button @click="goToInstagram" :disabled="loading || !imageReady"
                  class="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600">
                <i class="fab font-extrabold  fa-instagram"></i>
            <span class="font-bold "> 스토리 공유하기</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps, nextTick } from 'vue'
import defaultAvatar from '../assets/default.png'

const palette = [
  { color: "#ffffff", name: "화이트" },        // White: 기본, 깔끔
  { color: "#ff7300", name: "오렌지" },        // Orange: 브랜드
  { color: "#ffe066", name: "라이트옐로우" },  // Light Yellow: 은은한 노랑
  { color: "#fa5252", name: "레드" },          // Red: 톤다운된 레드, 오렌지와 잘 어울림
  { color: "#339af0", name: "블루" },          // Blue: 밝고 튀지 않는 시원한 파랑
  { color: "#dee2e6", name: "그레이" },        // Gray: 중간톤, 세련됨
]

const saved = ref(false)

const props = defineProps({
  game: Object,
  me: Object
})
defineEmits(['close'])

const cameraInput = ref(null)
const finalCanvas = ref(null)
const photoPreview = ref(null)
const imageReady = ref(false)
const loading = ref(false)
const downloading = ref(false)
const selectedFile = ref(null)

const usingPhoto = ref(false)
const bgColor = ref(palette[0].color)

function selectPalette(color) {
  bgColor.value = color
  usingPhoto.value = false
  drawFinalImage()
  saved.value = false
}

const triggerCamera = () => cameraInput.value?.click()

const onImageSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = async () => {
    photoPreview.value = reader.result
    usingPhoto.value = true
    await nextTick()
    drawFinalImage()
    saved.value = false
  }
  reader.readAsDataURL(file)
}

const W = 1170, H = 2532

function drawFinalImage() {
  const canvas = finalCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = W
  canvas.height = H
  ctx.clearRect(0, 0, W, H)

  // 배경
  if (!usingPhoto.value || !photoPreview.value) {
    ctx.fillStyle = bgColor.value
    ctx.fillRect(0, 0, W, H)
    drawMainBox(ctx)
    imageReady.value = true
  } else {
    const img = new Image()
    img.onload = () => {
      // 사진 세로 기준, 가로는 중앙 crop
      const scale = H / img.height
      const cropW = W / scale
      let sx = (img.width - cropW) / 2
      if (sx < 0) sx = 0
      ctx.drawImage(img, sx, 0, cropW, img.height, 0, 0, W, H)
      drawMainBox(ctx)
      imageReady.value = true
    }
    img.src = photoPreview.value
  }
}

function drawMainBox(ctx) {
  // 주황 박스(정사각형, 각진, 중앙)
  const boxSize = W * 0.8
  const boxX = (W - boxSize) / 2
  const boxY = H * 0.13
  ctx.fillStyle = '#ff7300'
  ctx.fillRect(boxX, boxY, boxSize, boxSize)

  const padX = boxSize * 0.07
  ///let y = boxY + boxSize * 0.15

  // 카테고리/서브카테고리(좌상)
  ctx.font = `${boxSize*0.038}px Pretendard, Arial`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'left'
  ctx.fillText(props.game.mainCategory || '', boxX + padX, boxY + padX)
  ctx.font = `bold ${boxSize*0.055}px Pretendard, Arial`
  ctx.fillText("줄넘기" || '', boxX + padX, boxY + padX + boxSize*0.07)

  // 날짜/시간(우상)
  ctx.textAlign = 'right'
  ctx.font = `${boxSize*0.036}px Pretendard, Arial`
  const date = new Date(props.game.date)
  const dateStr = `${date.getMonth()+1}.${date.getDate()}`
  const timeStr = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
  ctx.fillText(dateStr, boxX + boxSize - padX, boxY + padX + boxSize*0.01)
  ctx.fillText(timeStr, boxX + boxSize - padX, boxY + padX + boxSize*0.07)

  // 룰 타이틀(중앙)
  ctx.textAlign = 'center'
  ctx.font = `bold ${boxSize*0.08}px Pretendard, Arial`
  ctx.fillText(props.game.ruleTitle || '', boxX + boxSize/2, boxY + boxSize*0.31)

  // 장소(중앙, 룰아래)
  ctx.font = ` ${boxSize*0.042}px Pretendard, Arial`
  ctx.fillText(props.game.location || '', boxX + boxSize/2, boxY + boxSize*0.38)

  // 점수(중앙, 박스 중간)
  ctx.font = `bold ${boxSize*0.115}px Pretendard, Arial`
  ctx.fillText(`${props.game.myScore} - ${props.game.opponentScore}`, boxX + boxSize/2, boxY + boxSize*0.6)
// === 1. 변수 세팅 ===
const avatarSize = boxSize * 0.14
const nicknameFontSize = boxSize * 0.037
const nicknameFont = `bold ${nicknameFontSize}px Pretendard, Arial`
const margin = boxSize * 0.018 // 아바타-닉네임 간격
const groupHeight = avatarSize + margin + nicknameFontSize

// === 2. 그룹의 세로 중앙 Y좌표 ===
const groupCenterY = boxY + boxSize * 0.6 - 20

// === 3. 실제 그릴 Top좌표 ===
const groupTopY = groupCenterY - groupHeight / 2

// === 4. 내 아바타 (왼쪽) ===
const meAvatarCenterX = boxX + padX + avatarSize / 2
const meNicknameX = boxX + padX + avatarSize / 2 // (닉네임을 아바타와 정확히 정렬하려면 이 좌표)
const meImg = new window.Image()
meImg.crossOrigin = "anonymous"

meImg.onload = () => {
  // 아바타
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
  ctx.fillStyle = "#fff"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('@' + (props.me?.nickname || ''), meNicknameX, groupTopY + avatarSize + margin+20)
}
meImg.src = props.me?.avatar || defaultAvatar

// === 5. 상대 아바타 (오른쪽) ===
const oppAvatarCenterX = boxX + boxSize - padX - avatarSize / 2
const oppNicknameX = boxX + boxSize - padX - avatarSize / 2
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
  ctx.fillStyle = "#fff"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('@' + (props.game.opponent?.nickname || ''), oppNicknameX, groupTopY + avatarSize + margin+20)
}
oppImg.src = props.game.opponent?.avatar || defaultAvatar

  // RASPY (박스 밖, 우측하단)
  ctx.font = `bold ${boxSize*0.05}px Pretendard, Arial`
  ctx.textAlign = 'right'
  ctx.fillStyle = '#fff'
  ctx.fillText('RASPY', boxX + boxSize - padX*0.5, boxY + boxSize - padX * 0.5)
}
// function drawAvatarCircle(ctx, src, cx, cy, size) {
//   const avatarImg = new window.Image();
//   avatarImg.onload = () => {
//     ctx.save();
//     ctx.beginPath();
//     ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
//     ctx.closePath();
//     ctx.clip();
//     // 원형 영역에 이미지를 그린다
//     ctx.drawImage(avatarImg, cx - size / 2, cy - size / 2, size, size);
//     ctx.restore();

//     // 흰색 원형 외곽선
//     ctx.save();
//     ctx.beginPath();
//     ctx.arc(cx, cy, size / 2 + size * 0.04, 0, Math.PI * 2);
//     ctx.closePath();
//     ctx.strokeStyle = "#fff";
//     ctx.lineWidth = size * 0.09;
//     ctx.stroke();
//     ctx.restore();
//   };
//   avatarImg.src = src;
// }


// 저장
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
  const link = document.createElement('a')
  link.href = base64
  link.download = 'story.png'
  link.click()
  downloading.value = false

}

// 공유
function goToInstagram() {
  if (!imageReady.value) return
  loading.value = true
  const base64 = finalCanvas.value.toDataURL('image/png')
   if (window.AndroidApp?.shareToInstagramFeedWithBase64) {
    window.AndroidApp.shareToInstagramFeedWithBase64(base64)
  } else if (window.webkit?.messageHandlers?.instagram) {
    window.webkit.messageHandlers.instagram.postMessage(base64)
  } else {
    window.location.href = 'instagram://story-camera'
  }
  setTimeout(() => loading.value = false, 3000)
}

// 최초 진입 시 default 랜더링
import { onMounted } from 'vue'
onMounted(() => drawFinalImage())
</script>