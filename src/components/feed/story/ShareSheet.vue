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
          <!-- 못 찍은 그림은 돌기만 하지 않고 그렇다고 말한다 (경로 8 P2) -->
          <span v-else-if="failed[v.key]" class="w-full h-full flex items-center justify-center px-3 t-caption text-center break-keep">이 그림은 잘 안 나왔어요</span>
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
        :disabled="(d.key === 'story' || d.key === 'more') && !ready && !currentFailed"
        @click="go(d.key)"
      >
        <span class="w-14 h-14 rounded-full flex items-center justify-center" :class="d.key === 'story' ? 'bg-signal text-signal-on' : 'bg-surface-2 text-fg'">
          <UiSpinner v-if="d.key === 'story' && !ready && !currentFailed" />
          <UiIcon v-else :name="d.icon" class="text-xl" aria-hidden="true" />
        </span>
        <span class="t-micro text-fg">{{ d.label }}</span>
      </button>
    </div>
    <!-- 스티커일 때만 보이지만 자리는 늘 잡아 둔다 (넘길 때 시트 높이가 튀지 않게) -->
    <p class="mt-4 t-caption text-center break-keep" :class="{ invisible: current !== 'sticker' || hasNativeInstagram || storyShownBefore }">인스타에서 사진을 고르면 이 카드가 스티커로 붙어요</p>

    <!-- 인스타·카톡 앱 안 브라우저는 내려받기가 되지 않는다: 그림을 크게 띄워 길게 눌러 저장하게 한다 (경로 8: 저장되지 않아도 "그림을 저장했어요"라고 했다) -->
    <div v-if="saveView" class="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-6" @click.self="saveView = ''">
      <img :src="saveView" alt="저장할 그림" class="max-h-[70dvh] rounded-2xl" />
      <p class="mt-4 t-body text-white text-center break-keep">그림을 꾹 눌러서 저장해 주세요</p>
      <button type="button" class="mt-3 h-11 px-5 rounded-full bg-white/15 text-white t-label" @click="saveView = ''">닫기</button>
    </div>
  </UiSheet>
</template>

<script setup lang="ts">
// 공유 주소는 matchapp.me/m/{경기}. Vercel이 서버로 넘겨 경기마다 미리보기 그림을 낸다 (raspy-api share/)
// ?s= 는 어디로 보냈는지. 받은 사람이 '나도 한 판'을 누르면 유입 꼬리표(utm_source)가 되어 관리자 > 유입에 잡힌다
import { computed, onBeforeUnmount, reactive, ref, watch, nextTick } from 'vue'
import { GET } from '@/api/client'
import { UiSheet, UiSkeleton, UiSpinner } from '../../ui'
import { copyText } from '../../../utils/clipboard'
import { useToast } from '../../../composables/useToast'
import { copyStickerAndOpenInstagram, openInstagramStoryNative, shareFiles, storyFile, storyHomeLink, type ShareResult, type StoryVariant } from '../../../utils/storyShare'
import { hasNativeInstagram } from '../../../utils/nativeBridge'
import { storyLine } from '../../../utils/storyLine'
import { newShareCode, registerShare } from '../../../utils/shareRef'

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
// 끝내 못 찍은 디자인 (돌기만 하지 않게)
const failed = reactive<Partial<Record<StoryVariant, boolean>>>({})
const currentFailed = computed(() => !!failed[VARIANTS[active.value].key])
// 앱 안 브라우저에서 저장하려고 크게 띄운 그림
const saveView = ref('')
const inAppBrowser = /Instagram|KAKAOTALK|FBAN|FBAV|Line\//i.test(navigator.userAgent)
const active = ref(0)
const storyShownBefore = (() => { try { return localStorage.getItem('story_shared') === '1' } catch { return false } })()
const current = computed(() => VARIANTS[active.value].key)
// 앱에서 인스타 스토리는 스티커 그림을 넘긴다 (배경은 고른 디자인의 색). 스티커가 아직 없으면 고른 그림을 그대로 붙인다
// (스티커를 기다리다 버튼이 끝없이 돌았다, 11/11 아이폰)
const ready = computed(() => !!files[current.value])
const rail = ref<HTMLElement | null>(null)

// 서명(k)이 붙은 주소는 서버가 준다 (번호만으로는 열리지 않는다)
const shared = ref<{ url: string; storyImage: string } | null>(null)
// 공유 번호: 시트를 열 때마다 새로 (아래 link·markShared)
const shareCode = ref('')
let registered = false
let run = 0
// 아래 watch(immediate)가 바로 fetchLink를 부르므로 그보다 먼저 선언한다. 뒤에 두면 시트를 연 순간 오류가 나
// 그림 찍기가 시작되지 않고 인스타 버튼이 끝없이 돌았다 (11/12, 소식에서 공유: 시트가 게시물을 들고 열려 처음부터 부른다)
const linkFailed = ref(false)
watch(
  () => props.post?.id,
  async (id) => {
    const my = ++run
    reset()
    if (!id) return
    shareCode.value = newShareCode()
    registered = false
    fetchLink(my, Number(id))
    // 지난번에 고른 모양으로 연다 (열 때마다 첫 모양으로 돌아가 다시 넘겼다, 11/11 쌓이는 피로 전수표)
    const last = (() => { try { return Number(localStorage.getItem('share_variant') || 0) } catch { return 0 } })()
    if (last > 0 && last < VARIANTS.length) nextTick(() => pick(last))
    // 지금 보이는 그림부터 찍는다(버튼이 그 그림만 있으면 된다). 앱에서는 그다음 스티커 (인스타 편집기에 붙일 카드)
    const first = VARIANTS[last > 0 && last < VARIANTS.length ? last : 0]
    const order = [first, ...(hasNativeInstagram && first.key !== 'sticker' ? [VARIANTS[2]] : []), ...VARIANTS].filter((v, i, a) => a.indexOf(v) === i)
    for (const v of order) {
      try {
        const f = await storyFile(props.post, props.myId ?? null, v.key)
        if (my !== run) return
        files[v.key] = f
        urls[v.key] = URL.createObjectURL(f)
      } catch {
        // 못 찍은 디자인은 그렇다고 표시한다. 어둡게마저 못 찍으면 서버 그림으로 (오래된 브라우저)
        if (my !== run) return
        if (v.key === 'dark') serverStory(my).then((ok) => { if (!ok && my === run) failed.dark = true })
        else failed[v.key] = true
      }
    }
  },
  { immediate: true },
)
// 서명 주소 받기. 실패하면 '만드는 중'만 되풀이하지 않게 표시해 두고, 누를 때 다시 받는다 (목적 판정 8)
function fetchLink(my = run, id = Number(props.post?.id)) {
  linkFailed.value = false
  GET('/api/games/{gameId}/share-link', { path: { gameId: id } }).then(({ data }) => {
    if (data && my === run) shared.value = data
  }, () => {
    if (my === run) linkFailed.value = true
  })
}
async function serverStory(my: number): Promise<boolean> {
  for (let i = 0; i < 20 && !shared.value && my === run; i++) await new Promise((r) => setTimeout(r, 200))
  if (!shared.value || my !== run) return false
  const res = await fetch(shared.value.storyImage).catch(() => null)
  if (!res?.ok || my !== run) return false
  const f = new File([await res.blob()], `match-${props.post?.id}.png`, { type: 'image/png' })
  files.dark = f
  urls.dark = URL.createObjectURL(f)
  return true
}
function reset() {
  for (const v of VARIANTS) {
    if (urls[v.key]) URL.revokeObjectURL(urls[v.key]!)
    delete urls[v.key]
    delete files[v.key]
    delete failed[v.key]
  }
  saveView.value = ''
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
  try { localStorage.setItem('share_variant', String(i)) } catch { /* 못 남기면 첫 모양부터 */ }
}

// 서버 주소의 앞(matchapp.me)을 지금 연 곳으로 바꾼다 (미리보기·로컬에서도 같은 곳으로 돌아오게)
// r: 공유 번호 (누가 보냈는지). 시트를 열 때 하나 만들어 어디로 보내든 같은 번호를 쓴다 (utils/shareRef.ts)
const link = (s: string) => {
  if (!shared.value) return ''
  const u = new URL(shared.value.url)
  return `${location.origin}${u.pathname}${u.search}&s=${s}&r=${shareCode.value}`
}
/** 처음 보낼 때 번호를 서버에 남긴다 (시트만 열고 닫으면 남기지 않는다) */
function markShared() {
  try { localStorage.setItem('story_shared', '1') } catch { /* 안내가 한 번 더 보일 뿐 */ }
  if (registered || !shareCode.value) return
  registered = true
  registerShare(shareCode.value, shared.value ? new URL(shared.value.url).pathname : `/m/${props.post?.id ?? ''}`)
}
const line = computed(() => (props.post ? storyLine(props.post, props.myId ?? null) : ''))
const close = () => emit('close')
const copied = (url: string, msg = '링크 복사해 뒀어요') => void copyText(url).then((ok) => {
  if (ok) markShared()
  showToast(ok ? msg : '복사가 안 됐어요. 한 번만 다시 눌러 주세요')
})

// 스토리 속 카드를 누르면 홈으로 가게 하는 공개 방법은 없다(스포티파이 링크는 메타 제휴 전용). 링크를 클립보드에 넣어 두었으니 링크 스티커로 붙이게 알린다
function linkTip() {
  markShared()
  // 스토리를 올려 본 사람에게는 어디에 붙이는지 다시 말하지 않는다 (story_shared, 손님 결과와 같은 표시)
  showToast(storyShownBefore ? '링크 복사해 뒀어요' : '링크 복사해 뒀어요. 인스타에서 링크 스티커에 붙여 넣으시면 돼요')
  close()
}
function after(r: ShareResult, file?: File) {
  if (r === 'cancelled') return
  if (r === 'unsupported') return showToast('죄송해요, 앱에서는 아직 안 돼요. 휴대폰 브라우저로 matchapp.me에 들어가서 올려 주세요')
  markShared()
  if (r === 'saved') {
    // 앱 안 브라우저는 내려받기가 실제로 되지 않는다: 그림을 띄워 길게 눌러 저장하게 한다
    if (inAppBrowser && file) {
      saveView.value = URL.createObjectURL(file)
      return
    }
    showToast('그림 저장해 뒀어요')
  }
  close()
}

// 누른 그 자리에서 공유 창을 연다 (앞에 await를 두지 않는다)
// 공유함은 실제로 보냈을 때만 센다 (예전엔 누르기만 해도 세어 관리자 > 유입의 '공유함'이 부풀었다, 경로 8 P3)
function go(key: Dest) {
  if (key === 'copy' || key === 'message') {
    const url = link(key === 'copy' ? 'copy' : 'kakao')
    if (!url && linkFailed.value) {
      fetchLink()
      return showToast('링크가 잘 안 만들어졌어요. 조금 있다가 다시 눌러 주세요')
    }
    if (!url) return showToast('링크 만드는 중이에요. 잠깐만요')
    if (key === 'copy' || !navigator.share) return copied(url, key === 'copy' ? '링크 복사해 뒀어요' : '링크 복사해 뒀어요. 붙여 넣어서 보내 주세요')
    // 카톡·메시지: 링크만 보낸다. 카톡이 경기 그림을 펼쳐 보여 준다 (미리보기 그림 og.png)
    return void navigator.share({ text: line.value, url }).then(() => {
      markShared()
      close()
    }, (e: any) => {
      if (e?.name !== 'AbortError') copied(url)
    })
  }
  const file = files[current.value]
  if (!file) {
    // 이 디자인을 못 찍었으면 찍은 다른 디자인으로 옮겨 준다
    if (currentFailed.value) {
      const other = VARIANTS.findIndex((v) => files[v.key])
      if (other >= 0) {
        pick(other)
        return showToast('이 그림은 잘 안 나와서 다른 걸로 바꿔 드렸어요')
      }
      return showToast('죄송해요, 그림이 잘 안 나왔어요. 링크로 보내 주세요')
    }
    return showToast('그림 만드는 중이에요. 잠깐만요')
  }
  // 스토리 링크 스티커: 그 경기로 바로 (서명 주소가 아직 없으면 홈)
  const home = storyHomeLink(props.post.id, shared.value ? link('story') : undefined, shareCode.value)
  if (key === 'story' && hasNativeInstagram) {
    // 앱: 스포티파이처럼 인스타 편집기에 배경색 + 움직이는 결과 카드 (스티커를 못 찍었으면 고른 그림을 붙인다)
    return void openInstagramStoryNative(files.sticker || file, current.value, home).then((r) => {
      if (r === 'opened') return linkTip()
      if (r === 'not_installed') return showToast('인스타그램 앱이 깔려 있어야 올릴 수 있어요')
      shareFiles([file]).then((r) => after(r, file))
    })
  }
  if (key === 'story') {
    if (current.value === 'sticker') {
      return void copyStickerAndOpenInstagram(file, home).then((ok) => {
        if (ok) return linkTip()
        // 클립보드에 그림을 못 넣는 브라우저: 그림을 넘겨 인스타에서 고르게
        shareFiles([file]).then((r) => after(r, file))
      })
    }
    // 그림을 넘기면서 링크는 클립보드에 (같은 누름 안에서 둘 다 시작해야 사파리가 막지 않는다)
    void navigator.clipboard?.writeText(home).catch(() => null)
    return void shareFiles([file]).then((r) => (r === 'shared' ? linkTip() : after(r, file)))
  }
  // 더보기: 그림과 한 줄·링크를 함께 (폰이 아는 모든 곳)
  const url = link('link')
  void shareFiles([file], url ? `${line.value}\n${url}` : line.value).then((r) => after(r, file))
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
