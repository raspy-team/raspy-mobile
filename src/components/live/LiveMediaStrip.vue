<template>
  <section v-if="data && (data.items.length || data.canUpload)">
    <div class="flex items-baseline justify-between mb-2">
      <p class="t-label">관중이 찍은 장면</p>
      <span v-if="data.items.length" class="t-micro tabular-nums">{{ data.items.length }}</span>
    </div>

    <!-- 옆으로 넘기는 한 줄. 누르면 크게 -->
    <div class="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
      <button
        v-if="data.canUpload"
        type="button"
        class="shrink-0 w-24 h-24 rounded-xl border border-dashed border-line flex flex-col items-center justify-center gap-1 text-fg-muted snap-start active:scale-95 transition-transform"
        :disabled="uploading"
        aria-label="사진·영상 올리기"
        @click="picker?.click()"
      >
        <UiSpinner v-if="uploading" />
        <template v-else>
          <UiIcon name="fas fa-camera" />
          <span class="t-micro">올리기</span>
        </template>
      </button>
      <button
        v-for="m in data.items"
        :key="m.id"
        type="button"
        class="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-surface-2 snap-start"
        :aria-label="`${m.uploader?.nickname || '관중'}님이 올린 ${m.mediaType === 'VIDEO' ? '영상' : '사진'}`"
        @click="open = m"
      >
        <video v-if="m.mediaType === 'VIDEO'" :src="m.url" class="w-full h-full object-cover" muted playsinline preload="metadata"></video>
        <img v-else :src="m.url" alt="" class="w-full h-full object-cover" loading="lazy" />
        <span v-if="m.mediaType === 'VIDEO'" class="absolute bottom-1 right-1 text-white text-xs drop-shadow" aria-hidden="true"><UiIcon name="fas fa-play" /></span>
      </button>
    </div>
    <p v-if="data.canUpload && !data.items.length" class="t-caption mt-2">현장에 있다면 한 장 올려 주세요. 선수도 봐요</p>
    <input ref="picker" type="file" accept="image/*,video/*" class="hidden" @change="onPick" />

    <!-- 크게 보기: 누가 올렸나, 내리기·신고 -->
    <UiSheet :model-value="!!open" :title="open ? `${open.uploader?.nickname || '관중'}님이 올린 ${open.mediaType === 'VIDEO' ? '영상' : '사진'}` : ''" @update:model-value="(v) => { if (!v) open = null }">
      <template v-if="open">
        <video v-if="open.mediaType === 'VIDEO'" :src="open.url" class="w-full max-h-[60vh] rounded-xl bg-black" controls playsinline autoplay></video>
        <img v-else :src="open.url" alt="" class="w-full max-h-[60vh] object-contain rounded-xl bg-surface-2" />
      </template>
      <template #footer>
        <div class="flex gap-2">
          <UiButton v-if="open?.canHide" variant="secondary" class="flex-1" :loading="hiding" @click="hide">{{ open?.mine ? '삭제' : '내리기' }}</UiButton>
          <UiButton v-if="open && !open.mine" variant="ghost" class="flex-1" @click="openReport">신고</UiButton>
        </div>
      </template>
    </UiSheet>
    <ReportSheet :model-value="reporting !== null" title="이 사진을 신고할까요?" target-type="GAME_MEDIA" :target-id="reporting ?? undefined" :context="`game:${gameId}`" @update:model-value="(v) => { if (!v) reporting = null }" />
  </section>
</template>

<script setup lang="ts">
import { confirmDialog } from '@/composables/useConfirm'
// 관중이 찍은 장면 (리뷰 6번 "점수만 있고 장면이 없다"). 중계 화면과 결과 화면에 한 줄로 붙는다.
// 관중은 경기 중·끝나고 하루 안에 올리고, 선수는 보고 내린다. 볼 수 없는 경기(차단·구경 끔·앱 게임)면 통째로 숨는다
// 새 사진은 /topic/game-media/{id}의 MEDIA 신호에만 다시 불러온다 (폴링하지 않는다).
// 중계 채널(/topic/game-live)은 구독이 곧 관중 수·증인 기록이라 여기서 듣지 않는다 (결과 화면만 연 사람이 관중이 되고, 익명 관중이 실명이 된다)
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue'
import { GET, POST } from '@/api/client'
import type { components } from '@/api/schema'
import { subscribeTopic } from '@/websocket/userChannel'
import { useToast } from '@/composables/useToast'
import { compressImage, dataUrlToFile, readAsDataUrl } from '@/utils/image'
import ReportSheet from '../safety/ReportSheet.vue'
import { UiButton, UiIcon, UiSheet, UiSpinner } from '../ui'

type Media = components['schemas']['LiveMedia']

const props = defineProps<{ gameId: number }>()
const { showToast } = useToast()
const data = ref<components['schemas']['LiveMediaList'] | null>(null)
const picker = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const hiding = ref(false)
const open = ref<Media | null>(null)
const reporting = ref<number | null>(null)

const message = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback

async function load() {
  try {
    data.value = (await GET('/api/games/{gameId}/live/media', { path: { gameId: props.gameId } })).data
  } catch {
    data.value = null
  }
}

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const video = file.type.startsWith('video/')
  if (video && file.size > 10 * 1024 * 1024) return showToast('영상은 10MB까지 올릴 수 있어요. 짧게 찍어 주세요')
  uploading.value = true
  try {
    // 폰 사진은 10MB를 넘기 쉽다. 중계에 충분한 크기로 줄여 올린다
    const upload = video ? file : dataUrlToFile(await compressImage(await readAsDataUrl(file), 1280, 0.75), `live_${props.gameId}.jpg`)
    const form = new FormData()
    form.append('file', upload)
    // 여러 부분으로 나눈 본문(multipart)은 schema 타입에 없어 주소만 검사받는다
    const added = (await POST('/api/games/{gameId}/live/media', { path: { gameId: props.gameId }, body: form as never })).data
    if (data.value && !data.value.items.some((m) => m.id === added.id)) data.value.items.push(added)
    showToast('올렸어요. 선수와 관중이 같이 봐요')
  } catch (err) {
    showToast(message(err, '올리지 못했어요'))
  } finally {
    uploading.value = false
  }
}

async function hide() {
  if (!open.value) return
  // 한 번 누르면 되돌릴 수 없어 묻는다 (경로 8 P13)
  if (!(await confirmDialog({ title: open.value.mine ? '이 장면을 삭제할까요?' : '이 장면을 내릴까요?', message: '선수와 관중 모두에게서 사라져요', confirmText: open.value.mine ? '삭제' : '내리기', danger: true }))) return
  hiding.value = true
  try {
    await POST('/api/games/{gameId}/live/media/{mediaId}/hide', { path: { gameId: props.gameId, mediaId: open.value.id } })
    const id = open.value.id
    if (data.value) data.value.items = data.value.items.filter((m) => m.id !== id)
    open.value = null
  } catch (err) {
    showToast(message(err, '내리지 못했어요'))
  } finally {
    hiding.value = false
  }
}

let off: (() => void) | undefined
onMounted(() => {
  load()
  off = subscribeTopic(`/topic/game-media/${props.gameId}`, (e: { type: string }) => { if (e.type === 'MEDIA') load() })
})
onBeforeUnmount(() => off?.())

// 크게 보기 시트를 닫고 신고 시트를 연다. 바로 열면 닫은 시트의 기록 칸이 남아 뒤로를 두 번 눌러야 했다 (가로 훑기 2)
function openReport() {
  const id = open.value?.id ?? null
  open.value = null
  let done = false
  const go = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', go)
    reporting.value = id
  }
  window.addEventListener('popstate', go)
  setTimeout(go, 300)
}
</script>
