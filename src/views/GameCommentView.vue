<template>
  <!-- Modal Backdrop -->
  <div
    v-if="modalVisible"
    class="fixed inset-0 z-40 flex items-end justify-center bg-black/30"
    @click.self="closeModal"
  >
    <transition name="slide-up" @after-leave="afterLeave">
      <div
        v-show="showModal"
        ref="sheet"
        class="w-full max-w-2xl rounded-t-2xl bg-white shadow-xl pb-4 px-4 pt-3"
        :style="{
          maxHeight: '80vh',
          minHeight: '60dvh',
          transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)'
        }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @wheel.stop.prevent
        @touchmove.stop.prevent
      >
        <!-- Drag handle -->
        <div class="mx-auto mb-4 mt-1 w-12 h-1.5 rounded bg-gray-300"></div>

        <!-- 댓글 입력 -->
        <div class="flex items-center space-x-3 mb-6">
          <input
            v-model="newComment"
            type="text"
            placeholder="댓글 달기..."
            class="flex-1 text-sm border-b border-gray-300 focus:border-orange-500 focus:outline-none py-2"
            @keyup.enter="submitComment"
            :disabled="isLoading"
          />
          <button
            @click="submitComment"
            :disabled="!canSubmit || isLoading"
            class="text-sm font-semibold text-orange-500 disabled:text-gray-300"
          >
            게시
          </button>
        </div>

        <!-- 댓글 목록 or 로딩중 스켈레톤 -->
        <div
          class="space-y-6 overflow-y-auto"
          style="max-height: 55vh; overscroll-behavior: contain;"
          ref="scrollContainer"
        >
          <!-- 로딩중 -->
          <template v-if="isLoading">
            <div v-for="i in 4" :key="i" class="flex items-start space-x-3 animate-pulse">
              <div class="w-8 h-8 rounded-full bg-gray-200"></div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <div class="h-3 w-20 bg-gray-200 rounded"></div>
                  <div class="h-2 w-10 bg-gray-200 rounded"></div>
                </div>
                <div class="mt-2 h-3 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </template>
          <!-- 댓글 리스트 -->
          <template v-else-if="comments.length">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="flex items-start space-x-3"
            >
              <img
                :src="comment.authorProfileUrl || defaultProfile"
                class="w-8 h-8 rounded-full object-cover"
              />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-semibold text-gray-800">
                    @{{ comment.authorNickname }}
                  </p>
                  <p class="text-xs text-gray-500">{{ relativeTime(comment.createdAt) }}</p>
                </div>
                <p class="text-sm text-gray-800 mt-1">{{ comment.content }}</p>
              </div>
            </div>
          </template>
          <!-- 댓글 없음 -->
          <p v-else class="text-gray-400 text-center text-sm mt-12">
            첫 댓글을 작성해보세요.
          </p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, watch, defineEmits, nextTick, onBeforeUnmount } from 'vue'
import api from '../api/api'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  }
})
const emit = defineEmits(['close'])

const showModal = ref(false)         // 애니메이션용
const modalVisible = ref(false)      // 실제 렌더링용
const sheet = ref(null)
const scrollContainer = ref(null)
const startY = ref(0)
const currentY = ref(0)
const dragging = ref(false)
const diffY = ref(0)

const comments = ref([])
const newComment = ref('')
const defaultProfile = '/default-profile.png'
const isLoading = ref(true)

const canSubmit = computed(() => newComment.value.trim().length > 0)

// 최소 1초 이상 로딩 함수
const minDelay = (promise, ms = 1000) =>
  Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, ms))
  ]).then(([result]) => result)

const fetchComments = async () => {
  isLoading.value = true
  try {
    const res = await minDelay(api.get(`/api/games/${props.id}/comments`), 600)
    comments.value = res.data
  } catch (e) {
    comments.value = []
  } finally {
    isLoading.value = false
  }
}

const submitComment = async () => {
  if (!canSubmit.value || isLoading.value) return
  isLoading.value = true
  try {
    await api.post(`/api/games/${props.id}/comments`, { content: newComment.value.trim() })
    newComment.value = ''
    await fetchComments()
  } finally {
    isLoading.value = false
  }
}

const relativeTime = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff/60)}분 전`
  if (diff < 86400) return `${Math.floor(diff/3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff/86400)}일 전`
  if (diff < 31536000) return `${Math.floor(diff/2592000)}개월 전`
  return `${Math.floor(diff/31536000)}년 전`
}

// ==== Body Scroll Lock ==== //
function lockBodyScroll() {
  document.body.style.overflow = 'hidden'
}
function unlockBodyScroll() {
  document.body.style.overflow = ''
}
watch(
  () => modalVisible.value,
  (visible) => {
    if (visible) lockBodyScroll()
    else unlockBodyScroll()
  }
)
onBeforeUnmount(() => {
  unlockBodyScroll()
})

// ==== 모달 show/hide 애니메이션 ==== //
watch(() => props.id, async (newId) => {
  if (newId && newId !== 0) {
    modalVisible.value = true
    await nextTick()
    showModal.value = true
    fetchComments()
  } else {
    showModal.value = false
  }
}, { immediate: true })

const closeModal = () => {
  showModal.value = false
}
const afterLeave = () => {
  modalVisible.value = false
  emit('close')
}

// ==== Drag/Touch 이벤트 ==== //
function onTouchStart(e) {
  // 스크롤 최상단에서만 바텀시트 드래그 가능!
  if (scrollContainer.value && scrollContainer.value.scrollTop > 0) return
  dragging.value = true
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
}
function onTouchMove(e) {
  if (!dragging.value) return
  if (scrollContainer.value && scrollContainer.value.scrollTop > 0) return // 내부 스크롤중이면 드래그 금지
  currentY.value = e.touches[0].clientY
  diffY.value = Math.max(0, currentY.value - startY.value)
  if (sheet.value) sheet.value.style.transform = `translateY(${diffY.value}px)`
}
function onTouchEnd() {
  dragging.value = false
  if (diffY.value > 80) {
    closeModal()
  } else {
    if (sheet.value) sheet.value.style.transform = ''
  }
  diffY.value = 0
}

// ==== 마우스 드래그 ==== //
function onMouseDown(e) {
  if (scrollContainer.value && scrollContainer.value.scrollTop > 0) return
  dragging.value = true
  startY.value = e.clientY
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e) {
  if (!dragging.value) return
  if (scrollContainer.value && scrollContainer.value.scrollTop > 0) return
  currentY.value = e.clientY
  diffY.value = Math.max(0, currentY.value - startY.value)
  if (sheet.value) sheet.value.style.transform = `translateY(${diffY.value}px)`
}
function onMouseUp() {
  dragging.value = false
  if (diffY.value > 80) { closeModal() }
  else if (sheet.value) sheet.value.style.transform = ''
  diffY.value = 0
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
</script>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.5s cubic-bezier(.4,0,.2,1),
    opacity 0.22s cubic-bezier(.4,0,.2,1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0%);
  opacity: 1;
}
</style>
