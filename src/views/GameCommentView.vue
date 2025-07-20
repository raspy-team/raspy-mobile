<template>
  <div
    v-if="modalVisible"
    class="fixed inset-0 z-[123123912] flex items-end justify-center bg-black/50 raspy-top"
    @click.self="closeModal"
  >
<transition name="slide-up" @after-leave="afterLeave">
  <div
    v-show="showModal"
    ref="sheet"
    class="w-full max-w-md h-[100%] min-h-[60%]  raspy-bot flex flex-col rounded-t-2xl bg-white shadow-xl"
    style="display:flex; flex-direction:column;"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  >
    <div class="mx-auto mt-2 mb-2 w-10 h-1.5 rounded bg-gray-300" />
    <div
      class="flex-1 overflow-y-auto px-4 pt-2 pb-4"
      ref="scrollContainer"
      style="min-height:0px; max-height:calc(88vh - 65px); overscroll-behavior:contain; touch-action:pan-y; overflow-y:auto;"
    >
      <!-- 댓글 내용 -->  
          <template v-if="isLoading">
            <div v-for="i in 5" :key="i" class="flex gap-3 py-2 animate-pulse">
              <div class="w-9 h-9 rounded-full bg-gray-200"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-1/4 bg-gray-200 rounded"></div>
                <div class="h-3 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </template>
          <template v-else-if="threadedComments.length">
            <CommentItem
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
          <p
            v-else
            class="text-gray-400 text-center text-[15px] mt-16"
          >아직 댓글이 없습니다.</p>
        </div>
        <!-- 댓글 입력창 -->
<form
  @submit.prevent="submitInput"
  class="flex gap-2 items-center border-t pt-2 px-3 bg-white"
  style="min-height:40px"
>
<!-- 입력창 영역 -->
<div class="flex items-center flex-1 min-w-0 bg-gray-100 rounded-full px-3 py-2 focus-within:bg-white focus-within:border-gray-300 transition border">
  <span
    v-if="replyingToId"
    class="inline-block px-2 py-0.5 mr-2 bg-blue-100 text-blue-600 font-semibold rounded-full text-[14px] whitespace-nowrap cursor-pointer select-none"
    @click="resetInput"
  >
    {{ replyNickname }}
    <i class="fas fa-times ml-1 text-xs" />
  </span>
  <input
    v-model="inputContent"
    ref="commentInputRef"
    type="text"
    placeholder="댓글 달기..."
    class="flex-1 text-[16px] bg-transparent border-0 focus:ring-0 p-0 m-0 outline-none"
    :disabled="isLoading"
    maxlength="1000"
    autocomplete="off"
  />
</div>

  <button
    type="button"
    @click="triggerImageInput"
    class="text-gray-500 px-2 flex items-center justify-center"
    style="height:38px;width:38px"
    title="사진첨부"
  >
    <i class="fas fa-camera text-lg"></i>
  </button>
  <button
    type="submit"
    :disabled="!canSubmit || isLoading"
    class="px-4 py-2 rounded-full text-white bg-orange-500 disabled:bg-gray-300 font-semibold text-base transition flex items-center justify-center"
    style="height:38px"
  >게시</button>
  <input
    ref="imageInputRef"
    type="file"
    accept="image/*"
    @change="onImageChange"
    class="hidden"
  />
</form>

        <div
          v-if="inputImagePreview"
          class="flex items-center gap-2 px-4 pt-1 pb-2 bg-white border-t"
        >
          <img
            :src="inputImagePreview"
            class="w-14 h-14 rounded-lg object-cover border"
          />
          <button
            @click="removeInputImage"
            type="button"
            class="text-gray-500 hover:text-red-400"
          >
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <!-- 이미지 확대 모달 -->
        <div
          v-if="previewImg"
          class="fixed inset-0 z-[999] flex items-center justify-center bg-black/80"
          @click="previewImg = null"
        >
          <img
            :src="previewImg"
            class="max-h-[80vh] max-w-full rounded-xl shadow-lg"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import api from '../api/api'
import CommentItem from '../components/CommentItem.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const emit = defineEmits(['close'])
const showModal = ref(false)
const modalVisible = ref(false)
const sheet = ref(null)
const scrollContainer = ref(null)
const commentInputRef = ref(null)
const imageInputRef = ref(null)

const currentUserId = ref(8)
const isLoading = ref(true)
const threadedComments = ref([])

const inputContent = ref('')
const inputImage = ref(null)
const inputImagePreview = ref(null)
const replyingToId = ref(null)
// f
const replyNickname = ref('')
const previewImg = ref(null)

const fetchComments = async () => {
  isLoading.value = true
  try {
    const res = await api.get(`/api/games/${props.id}/comments/tree`)
    threadedComments.value = res.data
  } finally {
    isLoading.value = false
  }
}
const canSubmit = computed(() => inputContent.value.trim().length > 0)
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
  // inputContent를 초기화하되, '@닉네임 ' 문자열을 인풋 value에 넣지 않는다
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
const onImageChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    inputImage.value = file
    inputImagePreview.value = URL.createObjectURL(file)
  }
}
const removeInputImage = () => {
  inputImage.value = null
  inputImagePreview.value = null
}
const onImagePreview = (imgUrl) => {
  previewImg.value = imgUrl
}
watch(() => props.id, async (newId) => {
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
}, { immediate: true })
const closeModal = () => { showModal.value = false }
const afterLeave = () => { modalVisible.value = false; emit('close') }

// 바텀시트 드래그(기존과 동일)
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

  // 아래로 끌면서 스크롤 최상단이면 드래그 시작
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
  // 드래그가 시작되지 않았다면 터치무브는 스크롤로 처리
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
watch(() => modalVisible.value, (visible) => {
  document.body.style.overflow = visible ? 'hidden' : ''
})
onBeforeUnmount(() => { document.body.style.overflow = '' })
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
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
