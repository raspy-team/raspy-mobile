<template>
  <div
    v-if="modalVisible"
    class="fixed inset-0 z-sheet flex items-end justify-center bg-black/50 raspy-top"
    @click.self="closeModal"
  >
    <transition name="slide-up" @after-leave="afterLeave">
      <div
        v-show="showModal"
        ref="sheet"
        class="w-full raspy-bot max-w-md flex flex-col rounded-t-2xl bg-surface shadow-xl"
        :style="{
          height: `${sheetHeight}px`,
          display: 'flex',
          flexDirection: 'column',
        }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
      >
        <!-- 드래그바 -->
        <div class="mx-auto mt-2 mb-2 w-10 h-1.5 rounded bg-line-strong" />

        <!-- 댓글 리스트 영역 -->
        <div
          class="flex-1 overflow-y-auto px-4 pt-2 pb-4"
          ref="scrollContainer"
          :style="{
            minHeight: '0px',
            maxHeight: `${commentAreaHeight}px`,
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            overflowY: 'auto',
          }"
        >
          <!-- 댓글 내용 -->
          <template v-if="isLoading">
            <UiListSkeleton :rows="5" />
          </template>
          <template v-else-if="threadedComments.length">
            <CommentItem
              @click.stop
              v-for="comment in threadedComments"
              :key="comment.id"
              :comment="comment"
              :current-user-id="currentUserId"
              :replying-id="replyingToId"
              @reply="onReply"
              @like="onLike"
              @img-click="onImagePreview"
            />
          </template>
          <!-- 못 불러온 것을 '댓글이 없어요'로 보였다 (목적 판정 11/11 4번) -->
          <div v-else-if="loadFailed" class="text-center mt-16 px-6">
            <p class="t-heading">댓글을 불러오지 못했어요</p>
            <button type="button" class="t-label mt-3 underline underline-offset-2" @click="fetchComments">다시 시도</button>
          </div>
          <div v-else class="text-center mt-16 px-6">
            <p class="t-heading">아직 댓글이 없어요</p>
            <p class="t-caption mt-1">첫 댓글로 응원이나 한마디를 남겨 보세요</p>
          </div>
        </div>

        <!-- 입력창 (항상 바텀) -->
        <form
          @submit.prevent="submitInput"
          class="flex gap-2 items-center border-t border-line pt-2 pb-2 px-3 bg-surface"
          ref="inputForm"
          :style="{
            minHeight: `${inputAreaHeight}px`,
            height: `${inputAreaHeight}px`,
          }"
        >
          <div
            class="flex items-center flex-1 min-w-0 bg-surface-2 rounded-full px-3 py-2 focus-within:bg-surface focus-within:border-line transition border"
          >
            <button
              v-if="replyingToId"
              type="button"
              :aria-label="`${replyNickname}님에게 답글 그만 쓰기`"
              class="inline-flex items-center px-2 py-0.5 mr-2 bg-surface-3 text-fg font-medium rounded-full text-sm whitespace-nowrap select-none"
              @click="resetInput"
            >
              {{ replyNickname }}
              <UiIcon name="fas fa-times" class="ml-1 text-xs" aria-hidden="true" />
            </button>
            <input
              v-model="inputContent"
              ref="commentInputRef"
              type="text"
              placeholder="댓글 달기"
              aria-label="댓글"
              class="flex-1 text-base bg-transparent border-0 focus:ring-0 p-0 m-0 outline-none"
              :disabled="isLoading"
              maxlength="1000"
              autocomplete="off"
            />
          </div>
          <button
            type="button"
            @click="triggerImageInput"
            class="text-fg-muted px-2 flex items-center justify-center"
            style="height: 38px; width: 38px"
            title="사진첨부"
          >
            <UiIcon name="fas fa-camera" class="text-lg" />
          </button>
          <button
            type="submit"
            :disabled="!canSubmit || isLoading"
           class="px-4 py-2 rounded-full text-primary-on bg-primary disabled:bg-line-strong font-bold text-base transition flex items-center justify-center"
            style="height: 38px"
          >
            올리기
          </button>
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            @change="onImageChange"
            class="hidden"
          />
        </form>

        <!-- 입력 이미지 프리뷰 (있을 때만) -->
        <div
          v-if="inputImagePreview"
          class="flex items-center gap-2 px-4 pt-1 pb-2 bg-surface border-t border-line"
        >
          <img :src="inputImagePreview" alt="올릴 사진" class="w-14 h-14 rounded-lg object-cover" />
          <button @click="removeInputImage" type="button" aria-label="사진 빼기" class="w-11 h-11 flex items-center justify-center text-fg-muted hover:text-danger">
            <UiIcon name="fas fa-times" class="text-lg" />
          </button>
        </div>
        <!-- 이미지 확대 모달 -->
        <div
          v-if="previewImg"
          class="fixed inset-0 z-dialog flex items-center justify-center bg-black/80"
          @click="previewImg = null"
        >
          <img :src="previewImg" alt="댓글 사진" class="max-h-[80vh] max-w-full rounded-xl shadow-lg" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { UiListSkeleton } from '../components/ui'
import {
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed,
  defineProps,
  defineEmits,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'
import { useToast } from '../composables/useToast'
import CommentItem from '../components/CommentItem.vue'
import { photoFromFile } from '../utils/image'

// Props/emit
const props = defineProps({ id: { type: [String, Number], required: true } })
const { showToast } = useToast()
const emit = defineEmits(['close'])

const showModal = ref(false)
const modalVisible = ref(false)
const sheet = ref(null)
const scrollContainer = ref(null)
const commentInputRef = ref(null)
const imageInputRef = ref(null)
const inputForm = ref(null)

const inputAreaHeight = 56 // 입력창 높이(px)
const SHEET_MARGIN = 0 // 바텀시트 상하 여백

const sheetHeight = ref(window.innerHeight * 0.9)
const commentAreaHeight = ref(0)
function updateHeights() {
  const vv = window.visualViewport
  const vh = vv ? vv.height : window.innerHeight
  sheetHeight.value = vh * 0.9
  commentAreaHeight.value = sheetHeight.value - inputAreaHeight - SHEET_MARGIN
}
onMounted(() => {
  updateHeights()
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateHeights)
    window.visualViewport.addEventListener('scroll', updateHeights)
  }
})
onBeforeUnmount(() => {
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateHeights)
    window.visualViewport.removeEventListener('scroll', updateHeights)
  }
})

// 댓글 데이터/로딩/입력/답글/이미지/프리뷰 등 기존 로직 유지
const currentUserId = ref(8)
const isLoading = ref(true)
const threadedComments = ref([])
const inputContent = ref('')
const inputImage = ref(null)
const inputImagePreview = ref(null)
const replyingToId = ref(null)
const replyNickname = ref('')
const previewImg = ref(null)

// 댓글 불러오기
const loadFailed = ref(false)
const fetchComments = async () => {
  isLoading.value = true
  try {
    const res = await api.get(`/api/games/${props.id}/comments/tree`)
    threadedComments.value = res.data
    loadFailed.value = false
  } catch {
    loadFailed.value = true
  } finally {
    isLoading.value = false
  }
}
// 댓글 등록
// 사진만 있어도 올릴 수 있다 (사진만 고르고 '올리기'가 안 눌렸다)
const canSubmit = computed(() => inputContent.value.trim().length > 0 || !!inputImage.value)
const submitInput = async () => {
  if (!canSubmit.value || isLoading.value) return
  isLoading.value = true
  try {
    const formData = new FormData()
    formData.append('content', inputContent.value)
    if (replyingToId.value) formData.append('parentId', replyingToId.value)
    if (inputImage.value) formData.append('image', inputImage.value)
    await api.post(`/api/games/${props.id}/comments`, formData)
    await fetchComments()
    resetInput()
    nextTick(() => commentInputRef.value && commentInputRef.value.focus())
  } catch (e) {
    // 실패해도 말이 없어 올라간 줄 알았다. 쓴 글은 그대로 둔다
    showToast(e.response?.data?.message || '올리지 못했어요. 다시 해 주세요')
  } finally {
    isLoading.value = false
  }
}
function resetInput() {
  inputContent.value = ''
  inputImage.value = null
  inputImagePreview.value = null
  replyingToId.value = null
  replyNickname.value = ''
}
const onReply = (parentId, parentNickname) => {
  replyingToId.value = parentId
  replyNickname.value = parentNickname
  inputContent.value = ''
  nextTick(() => commentInputRef.value && commentInputRef.value.focus())
}
const onLike = async (commentId) => {
  const comment = findCommentById(threadedComments.value, commentId)
  if (!comment) return
  const liked = comment.myLikeType === 'LIKE'
  comment.myLikeType = liked ? null : 'LIKE'
  comment.likeCount += liked ? -1 : 1
  try {
    await api.post(`/api/comments/${commentId}/like`)
  } catch (e) {
    comment.myLikeType = liked ? 'LIKE' : null
    comment.likeCount += liked ? 1 : -1
  }
}
function findCommentById(list, id) {
  for (const c of list) {
    if (c.id === id) return c
    if (c.children && c.children.length) {
      const f = findCommentById(c.children, id)
      if (f) return f
    }
  }
  return null
}
const triggerImageInput = () => imageInputRef.value?.click()
const onImageChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  // 줄이지 못하면 원본을 쓴다
  const p = await photoFromFile(file).catch(() => null)
  inputImage.value = p?.file ?? file
  inputImagePreview.value = p?.dataUrl ?? URL.createObjectURL(file)
}
const removeInputImage = () => {
  inputImage.value = null
  inputImagePreview.value = null
}
const onImagePreview = (imgUrl) => {
  previewImg.value = imgUrl
}
watch(
  () => props.id,
  async (newId) => {
    if (newId && newId !== 0) {
      modalVisible.value = true
      await nextTick()
      showModal.value = true
      await fetchComments()
      resetInput()
      nextTick(() => commentInputRef.value && commentInputRef.value.focus())
    } else {
      showModal.value = false
    }
  },
  { immediate: true },
)
const closeModal = () => {
  showModal.value = false
}
const route = useRoute()
const router = useRouter()
const afterLeave = () => {
  modalVisible.value = false
  emit('close')
  // 주소(/games/:id/comments)로 열었으면 닫을 때 빈 화면에 남지 않게 돌아간다
  if (route.name === 'GameComments') window.history.state?.back ? router.back() : router.replace('/feed')
}

// 바텀시트 드래그
let dragging = ref(false)
let startY = ref(0)
let currentY = ref(0)
let diffY = ref(0)
function onTouchStart(e) {
  dragging.value = false
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
  diffY.value = 0
}
function onTouchMove(e) {
  if (!scrollContainer.value) return
  const touchY = e.touches[0].clientY
  const deltaY = touchY - startY.value
  const scrollTop = scrollContainer.value.scrollTop
  if (!dragging.value && deltaY > 5 && scrollTop === 0) {
    dragging.value = true
  }
  if (dragging.value) {
    e.preventDefault()
    e.stopPropagation()
    currentY.value = touchY
    diffY.value = Math.max(0, currentY.value - startY.value)
    if (sheet.value) sheet.value.style.transform = `translateY(${diffY.value}px)`
  }
}
function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (diffY.value > 80) {
    closeModal()
  } else if (sheet.value) {
    sheet.value.style.transform = ''
  }
  diffY.value = 0
}
function onMouseDown(e) {
  if (scrollContainer.value && scrollContainer.value.scrollTop > 0) return
  dragging.value = true
  startY.value = e.clientY
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
function onMouseMove(e) {
  if (!dragging.value) return
  if (!scrollContainer.value) return
  if (scrollContainer.value.scrollTop === 0) {
    e.preventDefault()
    e.stopPropagation()
    currentY.value = e.clientY
    diffY.value = Math.max(0, currentY.value - startY.value)
    if (sheet.value) sheet.value.style.transform = `translateY(${diffY.value}px)`
  }
}
function onMouseUp() {
  dragging.value = false
  if (diffY.value > 80) closeModal()
  else if (sheet.value) sheet.value.style.transform = ''
  diffY.value = 0
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
watch(
  () => modalVisible.value,
  (visible) => {
    document.body.style.overflow = visible ? 'hidden' : ''
  },
)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style>
.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1);
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
