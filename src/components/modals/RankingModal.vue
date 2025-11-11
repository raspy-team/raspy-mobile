<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[100] flex items-end justify-center"
      @click="onBackdropClick"
      @touchstart="onBackdropTouchStart"
      @touchend="onBackdropTouchEnd"
    >
      <!-- Backdrop -->
      <transition name="fade">
        <div v-if="showContent" class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"></div>
      </transition>

      <!-- Modal Content -->
      <transition name="slide-up">
        <div
          v-if="showContent"
          class="relative w-full max-h-[85vh] bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
          :style="modalStyle"
          @click.stop
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseLeave"
        >
          <!-- Drag Handle -->
          <div class="flex justify-center py-2 cursor-grab active:cursor-grabbing">
            <div class="w-12 h-1 bg-white/30 rounded-full"></div>
          </div>

          <!-- Header -->
          <div
            class="flex items-center justify-center px-6 py-3 bg-gray-900/95 backdrop-blur-md border-b border-white/10"
          >
            <h2 class="text-xl font-bold text-white">{{ title }}</h2>
          </div>

          <!-- Body (scrollable) -->
          <div
            ref="scrollContainer"
            class="flex-1 overflow-y-auto"
            @touchstart="onContentTouchStart"
            @mousedown="onContentMouseDown"
            @scroll="onScroll"
          >
            <slot />
          </div>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'close'])

const showContent = ref(false)
const scrollContainer = ref(null)

// 드래그 관련 상태
const isDragging = ref(false)
const startY = ref(0)
const currentY = ref(0)
const translateY = ref(0)
const isAnimating = ref(false)
const scrollTop = ref(0)
const canDrag = ref(true)

const modalStyle = computed(() => {
  if (isAnimating.value) {
    return {
      transform: `translateY(${translateY.value}px)`,
      transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
    }
  }
  return {
    transform: `translateY(${translateY.value}px)`,
    transition: 'none',
  }
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        showContent.value = true
        translateY.value = 0
        isDragging.value = false
      })
    } else {
      showContent.value = false
    }
  },
  { immediate: true }
)

const onScroll = (e) => {
  scrollTop.value = e.target.scrollTop
}

const onContentTouchStart = () => {
  // 스크롤 컨테이너의 스크롤 위치 확인
  canDrag.value = scrollTop.value === 0
}

const onContentMouseDown = () => {
  // 스크롤 컨테이너의 스크롤 위치 확인
  canDrag.value = scrollTop.value === 0
}

const onTouchStart = (e) => {
  if (isAnimating.value) return

  const touch = e.touches[0]
  startY.value = touch.clientY
  currentY.value = touch.clientY
  isDragging.value = true
}

const onTouchMove = (e) => {
  if (!isDragging.value || isAnimating.value) return

  const touch = e.touches[0]
  currentY.value = touch.clientY
  const deltaY = currentY.value - startY.value

  // 아래로만 드래그 가능 (위로는 막음)
  if (deltaY > 0) {
    // 스크롤이 최상단이거나 드래그를 시작했을 때만
    if (!canDrag.value && scrollTop.value > 0) return

    // 드래그 저항 적용 (처음엔 쉽게, 멀어질수록 어렵게)
    translateY.value = deltaY * 0.7
    e.preventDefault()
  }
}

const onTouchEnd = () => {
  if (!isDragging.value || isAnimating.value) return

  isDragging.value = false
  const deltaY = currentY.value - startY.value

  // 100px 이상 또는 빠른 스와이프 감지
  const velocity = Math.abs(deltaY) / 100
  const threshold = 100

  if (deltaY > threshold || velocity > 1.5) {
    // 모달 닫기
    isAnimating.value = true
    translateY.value = window.innerHeight
    setTimeout(() => {
      close()
      isAnimating.value = false
      translateY.value = 0
    }, 300)
  } else {
    // 원위치
    isAnimating.value = true
    translateY.value = 0
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

// 마우스 드래그 핸들러
const onMouseDown = (e) => {
  if (isAnimating.value) return
  // 버튼이나 링크 클릭은 드래그로 처리하지 않음
  if (e.target.closest('button, a, input, textarea, select')) return

  startY.value = e.clientY
  currentY.value = e.clientY
  isDragging.value = true
  e.preventDefault()
}

const onMouseMove = (e) => {
  if (!isDragging.value || isAnimating.value) return

  currentY.value = e.clientY
  const deltaY = currentY.value - startY.value

  // 아래로만 드래그 가능 (위로는 막음)
  if (deltaY > 0) {
    // 스크롤이 최상단이거나 드래그를 시작했을 때만
    if (!canDrag.value && scrollTop.value > 0) return

    // 드래그 저항 적용
    translateY.value = deltaY * 0.7
    e.preventDefault()
  }
}

const onMouseUp = () => {
  if (!isDragging.value || isAnimating.value) return

  isDragging.value = false
  const deltaY = currentY.value - startY.value

  // 100px 이상 또는 빠른 드래그 감지
  const velocity = Math.abs(deltaY) / 100
  const threshold = 100

  if (deltaY > threshold || velocity > 1.5) {
    // 모달 닫기
    isAnimating.value = true
    translateY.value = window.innerHeight
    setTimeout(() => {
      close()
      isAnimating.value = false
      translateY.value = 0
    }, 300)
  } else {
    // 원위치
    isAnimating.value = true
    translateY.value = 0
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

const onMouseLeave = () => {
  // 마우스가 모달 밖으로 나가면 드래그 취소
  if (isDragging.value && !isAnimating.value) {
    isDragging.value = false
    isAnimating.value = true
    translateY.value = 0
    setTimeout(() => {
      isAnimating.value = false
    }, 300)
  }
}

// 백드롭 클릭/터치
let backdropTouchStartTarget = null

const onBackdropClick = (e) => {
  // 백드롭을 직접 클릭했는지 확인 (모달 콘텐츠가 아닌 경우)
  if (e.target === e.currentTarget) {
    close()
  }
}

const onBackdropTouchStart = (e) => {
  // 터치 시작 위치 저장
  backdropTouchStartTarget = e.target
}

const onBackdropTouchEnd = (e) => {
  // 터치 시작과 끝이 같은 위치이고, 백드롭인 경우에만 닫기
  if (
    backdropTouchStartTarget === e.target &&
    e.target === e.currentTarget &&
    !isDragging.value
  ) {
    close()
  }
  backdropTouchStartTarget = null
}

const close = () => {
  showContent.value = false
  setTimeout(() => {
    emit('update:modelValue', false)
    emit('close')
  }, 300)
}
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition for modal */
.slide-up-enter-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
