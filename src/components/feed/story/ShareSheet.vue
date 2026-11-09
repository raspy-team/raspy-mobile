<template>
  <!-- 결과 보내기 (Strava·나이키 런 클럽·스포티파이의 공유 화면처럼): 위는 실제로 나갈 그림을 옆으로 넘겨 고르고, 아래 한 줄에서 보낼 곳을 고른다.
       그림은 시트가 열리자마자 디자인마다 미리 찍어 둔다 (src/utils/storyShare.ts). 누른 순간 바로 넘겨야 사파리가 공유를 막지 않는다 -->
  <UiSheet :model-value="!!post" title="공유" @update:model-value="close">
    <!-- 미리보기: 가운데 한 장, 양옆이 조금 보인다 -->
    <div ref="rail" class="-mx-5 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-[19%] pb-1" @scroll.passive="onScroll">
      <div v-for="(v, i) in VARIANTS" :key="v.key" class="snap-center flex-shrink-0 w-[62%]">
        <button
          type="button"
          class="block w-full aspect-[9/16] rounded-2xl overflow-hidden border transition-colors"
          :class="[i === active ? 'border-fg' : 'border-line', v.key === 'sticker' ? 'sticker-bg' : 'bg-surface-2']"
          :aria-label="`${v.label} 고르기`"
          :aria-pressed="i === active"
          @click="pick(i)"
        >
          <img v-if="urls[v.key]" :src="urls[v.key]" :alt="`${v.label} 미리보기`" class="w-full h-full" :class="v.key === 'sticker' ? 'object-contain p-3' : 'object-cover'" />
          <UiSkeleton v-else class="w-full h-full rounded-none" />
        </button>
      </div>
    </div>
    <p class="mt-3 text-center t-caption">
      <template v-for="(v, i) in VARIANTS" :key="v.key"><span v-if="i" class="text-fg-subtle"> · </span><span :class="i === active ? 'text-fg font-semibold' : ''">{{ v.label }}</span></template>
    </p>

    <!-- 보낼 곳 -->
    <div class="mt-5 grid grid-cols-4 gap-2">
      <button
        v-for="d in DESTS"
        :key="d.key"
        type="button"
        class="flex flex-col items-center gap-2 py-1 disabled:opacity-40"
        :disabled="(d.key === 'story' || d.key === 'more') && !ready"
        @click="go(d.key)"
      >
        <span class="w-14 h-14 rounded-full flex items-center justify-center" :class="d.key === 'story' ? 'bg-signal text-signal-on' : 'bg-surface-2 text-fg'">
          <UiSpinner v-if="d.key === 'story' && !ready" />
          <UiIcon v-else :name="d.icon" class="text-xl" aria-hidden="true" />
        </span>
        <span class="t-micro text-fg">{{ d.label }}</span>
      </button>
    </div>
    <!-- 스티커일 때만 보이지만 자리는 늘 잡아 둔다 (넘길 때 시트 높이가 튀지 않게) -->
    <p class="mt-4 t-caption text-center break-keep" :class="{ invisible: current !== 'sticker' || hasNativeInstagram }">인스타에서 사진을 고르면 이 카드가 스티커로 붙어요</p>
  </UiSheet>
</template>

<script setup lang="ts">
// 공유 주소는 matchapp.me/m/{경기}. Vercel이 서버로 넘겨 경기마다 미리보기 그림을 낸다 (raspy-api share/)
// ?s= 는 어디로 보냈는지. 받은 사람이 '나도 한 판'을 누르면 유입 꼬리표(utm_source)가 되어 관리자 > 유입에 잡힌다
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { GET } from '@/api/client'
import { UiSheet, UiSkeleton, UiSpinner } from '../../ui'
import { copyText } from '../../../utils/clipboard'
import { useToast } from '../../../composables/useToast'
import { copyStickerAndOpenInstagram, openInstagramStoryNative, shareFiles, storyFile, type ShareResult, type StoryVariant } from '../../../utils/storyShare'
import { hasNativeInstagram } from '../../../utils/nativeBridge'
import { storyLine } from '../../../utils/storyLine'

const props = defineProps<{
  /** 소식의 경기 한 장. null이면 닫힘 */
  post: any | null
  /** 보내는 사람 (맨 위 한 줄과 세트 칸을 그 사람 기준으로) */
  myId?: number | null
}>()
const emit = defineEmits(['close'])
const { showToast } = useToast()

const VARIANTS: { key: StoryVariant; label: string }[] = [
  { key: 'dark', label: '어둡게' },
  { key: 'volt', label: '볼트' },
  { key: 'sticker', label: '스티커' },
]
const DESTS = [
  { key: 'story', icon: 'instagram', label: '인스타 스토리' },
  { key: 'message', icon: 'comment', label: '카톡·메시지' },
  { key: 'copy', icon: 'link', label: '링크 복사' },
  { key: 'more', icon: 'ellipsis', label: '더보기' },
] as const
type Dest = (typeof DESTS)[number]['key']

// 디자인마다 찍은 그림. 시트가 열릴 때 처음 것부터 차례로
const files = reactive<Partial<Record<StoryVariant, File>>>({})
const urls = reactive<Partial<Record<StoryVariant, string>>>({})
const active = ref(0)
const current = computed(() => VARIANTS[active.value].key)
// 앱에서 인스타 스토리는 늘 스티커 그림을 넘긴다 (배경은 고른 디자인의 색)
const ready = computed(() => !!files[current.value] && (!hasNativeInstagram || !!files.sticker))
const rail = ref<HTMLElement | null>(null)

// 서명(k)이 붙은 주소는 서버가 준다 (번호만으로는 열리지 않는다)
const shared = ref<{ url: string; storyImage: string } | null>(null)
let run = 0
watch(
  () => props.post?.id,
  async (id) => {
    const my = ++run
    reset()
    if (!id) return
    GET('/api/games/{gameId}/share-link', { path: { gameId: Number(id) } }).then(({ data }) => {
      if (data && my === run) shared.value = data
    }, () => null)
    // 앱(인스타 플러그인)에서는 인스타 버튼이 스티커를 쓰니 스티커부터 찍는다
    const order = hasNativeInstagram ? [VARIANTS[2], VARIANTS[0], VARIANTS[1]] : VARIANTS
    for (const v of order) {
      try {
        const f = await storyFile(props.post, props.myId ?? null, v.key)
        if (my !== run) return
        files[v.key] = f
        urls[v.key] = URL.createObjectURL(f)
      } catch {
        // 못 찍은 디자인은 비워 둔다. 어둡게마저 못 찍으면 서버 그림으로 (오래된 브라우저)
        if (v.key === 'dark' && my === run) serverStory(my)
      }
    }
  },
  { immediate: true },
)
async function serverStory(my: number) {
  for (let i = 0; i < 20 && !shared.value && my === run; i++) await new Promise((r) => setTimeout(r, 200))
  if (!shared.value || my !== run) return
  const res = await fetch(shared.value.storyImage).catch(() => null)
  if (!res?.ok || my !== run) return
  const f = new File([await res.blob()], `match-${props.post?.id}.png`, { type: 'image/png' })
  files.dark = f
  urls.dark = URL.createObjectURL(f)
}
function reset() {
  for (const v of VARIANTS) {
    if (urls[v.key]) URL.revokeObjectURL(urls[v.key]!)
    delete urls[v.key]
    delete files[v.key]
  }
  shared.value = null
  active.value = 0
  rail.value?.scrollTo({ left: 0 })
}
onBeforeUnmount(() => {
  run++
  reset()
})

function onScroll() {
  const el = rail.value
  const item = el?.firstElementChild as HTMLElement | null
  if (!el || !item) return
  const step = item.offsetWidth + 12
  active.value = Math.max(0, Math.min(VARIANTS.length - 1, Math.round(el.scrollLeft / step)))
}
function pick(i: number) {
  const el = rail.value
  const item = el?.children[i] as HTMLElement | undefined
  if (el && item) el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2, behavior: 'smooth' })
  active.value = i
}

// 서버 주소의 앞(matchapp.me)을 지금 연 곳으로 바꾼다 (미리보기·로컬에서도 같은 곳으로 돌아오게)
const link = (s: string) => {
  if (!shared.value) return ''
  const u = new URL(shared.value.url)
  return `${location.origin}${u.pathname}${u.search}&s=${s}`
}
const line = computed(() => (props.post ? storyLine(props.post, props.myId ?? null) : ''))
const close = () => emit('close')
const copied = (url: string, msg = '링크를 복사했어요') => void copyText(url).then((ok) => showToast(ok ? msg : '복사하지 못했어요'))

function after(r: ShareResult) {
  if (r === 'cancelled') return
  if (r === 'unsupported') return showToast('이 앱에서는 아직 못 올려요. 휴대폰 브라우저의 matchapp.me에서 올려 주세요')
  if (r === 'saved') showToast('그림을 저장했어요')
  close()
}

// 누른 그 자리에서 공유 창을 연다 (앞에 await를 두지 않는다)
function go(key: Dest) {
  if (key === 'copy' || key === 'message') {
    const url = link(key === 'copy' ? 'copy' : 'kakao')
    if (!url) return showToast('링크를 만드는 중이에요. 잠시 뒤 다시 눌러 주세요')
    if (key === 'copy' || !navigator.share) return copied(url, key === 'copy' ? '링크를 복사했어요' : '링크를 복사했어요. 붙여 넣어 보내세요')
    // 카톡·메시지: 링크만 보낸다. 카톡이 경기 그림을 펼쳐 보여 준다 (미리보기 그림 og.png)
    return void navigator.share({ text: line.value, url }).then(close, (e: any) => {
      if (e?.name !== 'AbortError') copied(url)
    })
  }
  const file = files[current.value]
  if (!file) return showToast('그림을 만드는 중이에요')
  if (key === 'story' && hasNativeInstagram && files.sticker) {
    // 앱: 스포티파이처럼 인스타 편집기에 배경색 + 움직이는 결과 카드
    return void openInstagramStoryNative(files.sticker, current.value).then((r) => {
      if (r === 'opened') return close()
      if (r === 'not_installed') return showToast('인스타그램 앱이 있어야 올릴 수 있어요')
      shareFiles([file]).then(after)
    })
  }
  if (key === 'story') {
    if (current.value === 'sticker') {
      return void copyStickerAndOpenInstagram(file).then((ok) => {
        if (ok) return close()
        // 클립보드에 그림을 못 넣는 브라우저: 그림을 넘겨 인스타에서 고르게
        shareFiles([file]).then(after)
      })
    }
    return void shareFiles([file]).then(after)
  }
  // 더보기: 그림과 한 줄·링크를 함께 (폰이 아는 모든 곳)
  const url = link('link')
  void shareFiles([file], url ? `${line.value}\n${url}` : line.value).then(after)
}
</script>

<style scoped>
/* 스티커 미리보기: 투명한 곳이 보이게 바둑판 */
.sticker-bg {
  background-color: rgb(var(--c-surface-2));
  background-image: linear-gradient(45deg, rgb(var(--c-surface-3)) 25%, transparent 25%), linear-gradient(-45deg, rgb(var(--c-surface-3)) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(var(--c-surface-3)) 75%), linear-gradient(-45deg, transparent 75%, rgb(var(--c-surface-3)) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
