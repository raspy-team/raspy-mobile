<template>
  <div>
    <div class="flex items-center justify-between">
      <span class="t-caption">앞 카메라로 30초를 찍어요</span>
      <span class="t-mono tabular-nums" :class="remaining <= 20 ? 'text-danger' : 'text-fg-muted'">{{ clock }}</span>
    </div>

    <!-- 인증 동작: 예전 영상을 다시 쓰지 못하게 판마다 다르다 -->
    <UiCard class="mt-3 flex items-center gap-3">
      <UiIcon name="hand" class="text-xl" aria-hidden="true" />
      <p class="t-heading flex-1">{{ problem }}</p>
    </UiCard>

    <div class="relative mt-4 rounded-2xl overflow-hidden bg-surface-3 aspect-[3/4]">
      <video ref="preview" class="w-full h-full object-cover -scale-x-100" autoplay muted playsinline></video>
      <div v-if="recording" class="absolute top-3 left-3 flex items-center gap-2 px-3 h-8 rounded-full bg-black/60 text-white text-sm tabular-nums">
        <span class="w-2 h-2 rounded-full bg-red-500"></span>{{ recordLeft }}초
      </div>
      <p v-if="cameraError" class="absolute inset-0 flex items-center justify-center p-6 text-center t-body">{{ cameraError }}</p>
    </div>

    <UiButton v-if="!recording && !sent" block size="lg" class="mt-4" :disabled="!stream" :loading="submitting" @click="record">찍기 시작 (30초)</UiButton>
    <UiButton v-else-if="recording" block size="lg" variant="secondary" class="mt-4" @click="stop">지금 멈추고 내기</UiButton>
    <p class="t-caption text-center mt-2">처음에 인증 동작을 하고, 엉덩이가 무릎 높이까지 내려가야 하나로 세요. 영상은 AI가 센 뒤 바로 지우고 남기지 않아요</p>
  </div>
</template>

<script setup lang="ts">
// 스쿼트 30초 (2-8 기록 인증). 앞 카메라로 30초를 찍어 그대로 올린다. 시간이 다 되면 찍은 데까지 낸다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { UiButton, UiCard } from '../ui'

const RECORD_SECONDS = 30
const props = defineProps<{ problem: string; timeLimitSeconds: number; submitting: boolean }>()
const emit = defineEmits<{ submitVideo: [video: Blob] }>()

const preview = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const cameraError = ref('')
const recording = ref(false)
const sent = ref(false)
const recordLeft = ref(RECORD_SECONDS)
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []
let recordTimer: ReturnType<typeof setInterval> | undefined

const startedAt = Date.now()
const remaining = ref(props.timeLimitSeconds)
const clock = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined

/** 폰마다 되는 형식이 다르다 (아이폰 사파리는 mp4, 나머지는 webm) */
function mimeType() {
  return ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported?.(t)) ?? ''
}

function record() {
  if (!stream.value) return
  chunks = []
  // 30초가 10MB를 넘지 않게 화질을 낮춘다 (AI가 세기에는 충분하다)
  recorder = new MediaRecorder(stream.value, { mimeType: mimeType() || undefined, videoBitsPerSecond: 1_200_000 })
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  recorder.onstop = () => {
    sent.value = true
    emit('submitVideo', new Blob(chunks, { type: recorder?.mimeType || 'video/webm' }))
  }
  recorder.start(1000)
  recording.value = true
  recordLeft.value = RECORD_SECONDS
  recordTimer = setInterval(() => {
    recordLeft.value--
    if (recordLeft.value <= 0) stop()
  }, 1000)
}

function stop() {
  clearInterval(recordTimer)
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  recording.value = false
}

onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
    if (preview.value) preview.value.srcObject = stream.value
  } catch {
    cameraError.value = '카메라를 쓸 수 없어요. 브라우저 설정에서 이 사이트의 카메라를 허용해 주세요'
  }
  timer = setInterval(() => {
    remaining.value = Math.max(0, props.timeLimitSeconds - Math.floor((Date.now() - startedAt) / 1000))
    if (remaining.value === 0 && recording.value) stop()
  }, 500)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(recordTimer)
  stream.value?.getTracks().forEach((t) => t.stop())
})
</script>
