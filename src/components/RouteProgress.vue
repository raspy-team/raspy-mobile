<template>
  <div class="fixed top-0 inset-x-0 z-toast h-0.5 pointer-events-none" aria-hidden="true">
    <div
      class="h-full bg-primary origin-left"
      :style="{ transform: `scaleX(${width})`, opacity: visible ? 1 : 0, transition: `transform ${speed}ms ease-out, opacity 200ms linear` }"
    ></div>
  </div>
</template>

<script setup>
// 화면을 옮기는데 시간이 걸리면(화면 코드 받기, 가드에서 서버 확인) 맨 위에 얇은 진행 막대
// 금방 끝나는 이동에는 나타나지 않는다 (150ms 넘을 때만)
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const visible = ref(false)
const width = ref(0)
const speed = ref(0)
let showTimer = null
let creepTimer = null

function start() {
  clearTimeout(showTimer)
  showTimer = setTimeout(() => {
    speed.value = 0
    width.value = 0
    visible.value = true
    requestAnimationFrame(() => {
      speed.value = 400
      width.value = 0.3
      creepTimer = setInterval(() => {
        // 끝을 모르니 점점 느리게 90%까지만
        width.value = Math.min(0.9, width.value + (0.9 - width.value) * 0.15)
      }, 300)
    })
  }, 150)
}
function done() {
  clearTimeout(showTimer)
  clearInterval(creepTimer)
  if (!visible.value) return
  speed.value = 200
  width.value = 1
  setTimeout(() => (visible.value = false), 200)
}

router.beforeEach(() => {
  start()
})
router.afterEach(done)
router.onError(done)
</script>
