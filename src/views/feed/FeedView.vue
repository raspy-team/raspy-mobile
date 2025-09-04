<template>
  <div class="relative h-[100dvh] w-full bg-black text-white overflow-hidden select-none">
    <!-- Slides progress (top) -->
    <div
      class="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4"
      :style="{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }"
    >
      <div
        v-for="(s, i) in sections"
        :key="'prog-' + i"
        class="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
      >
        <div class="h-full bg-white" :style="{ width: i <= currentSlide ? '100%' : '0%' }" />
      </div>
    </div>

    <!-- Left/Right tap zones for navigation -->
    <div class="absolute inset-0 z-10 grid grid-cols-2">
      <button class="w-full h-full" aria-label="Previous" @click="prevSlide" />
      <button class="w-full h-full" aria-label="Next" @click="nextSlide" />
    </div>

    <!-- Slides Wrapper -->
    <div
      class="absolute inset-0 z-0"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend.passive="onTouchEnd"
    >
      <div class="h-full flex" :style="wrapperStyle">
        <!-- 1. 인증샷 -->
        <section class="w-screen shrink-0 h-full relative">
          <img
            :src="post.proofImage"
            alt="proof"
            class="absolute inset-0 w-full h-full object-cover"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60" />
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            1 / 4 · 인증샷
          </div>
          <!-- Content overlay for slide 1 -->
          <div
            class="absolute bottom-[calc(140px+env(safe-area-inset-bottom))] left-0 right-0 px-4 z-10"
          >
            <div
              class="max-w-xl bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur-md"
            >
              <div class="text-lg font-bold">어제 경기 인증샷</div>
              <div class="mt-1 text-xs text-white/80">
                {{ post.meta.place }} · {{ post.meta.time }}
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="t in post.tags"
                  :key="t"
                  class="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/10"
                  >#{{ t }}</span
                >
              </div>
            </div>
          </div>
        </section>

        <!-- 2. 경기 결과 -->
        <section class="w-screen shrink-0 h-full relative flex items-center justify-center">
          <div class="absolute inset-0 bg-gradient-to-b from-indigo-900 via-black to-black" />
          <div
            class="relative z-10 w-[86%] max-w-xl rounded-2xl p-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="text-white/80 text-sm">Match Result</div>
              <div class="text-xs text-white/60">{{ post.date }}</div>
            </div>
            <div class="grid grid-cols-3 items-center gap-3">
              <div class="text-center">
                <img
                  :src="post.players[0].avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover"
                />
                <div class="text-white font-semibold text-sm truncate">
                  {{ post.players[0].name }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-5xl font-extrabold text-white tracking-wider">
                  {{ post.result.scoreA }}<span class="text-white/50"> : </span
                  >{{ post.result.scoreB }}
                </div>
                <div class="mt-1 text-xs text-emerald-300 font-medium">
                  Winner · {{ post.result.winner }}
                </div>
              </div>
              <div class="text-center">
                <img
                  :src="post.players[1].avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 object-cover"
                />
                <div class="text-white font-semibold text-sm truncate">
                  {{ post.players[1].name }}
                </div>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80">
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span class="inline-block w-4 h-4" v-html="icons.trophy" />
                <span>세트수 {{ post.result.sets }}</span>
              </div>
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span class="inline-block w-4 h-4" v-html="icons.clock" />
                <span>총 시간 {{ post.result.duration }}</span>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 justify-center">
              <div
                v-for="(sc, idx) in post.result.setScores"
                :key="'set-' + idx"
                class="px-3 py-1 rounded-full bg-black/30 border border-white/10 text-xs text-white/90"
              >
                {{ idx + 1 }}세트 · {{ sc.a }} : {{ sc.b }}
              </div>
            </div>
            <div class="mt-3 text-[11px] text-white/70 flex items-center justify-between">
              <span>{{ post.meta.place }}</span>
              <span>{{ post.meta.time }}</span>
            </div>
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            2 / 4 · 경기 결과
          </div>
        </section>

        <!-- 3. 플레이어 리뷰 -->
        <section class="w-screen shrink-0 h-full relative">
          <div class="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-black" />
          <div class="relative z-10 h-full flex flex-col gap-3 px-4 py-12">
            <div class="flex items-center justify-center">
              <div
                class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4"
              >
                <div class="flex items-center gap-3">
                  <img :src="post.reviews[0].avatar" class="w-12 h-12 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="font-semibold truncate">{{ post.reviews[0].name }}</div>
                      <div class="text-[10px] flex gap-2">
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >퍼포먼스 {{ post.reviews[0].performance.toFixed(1) }}/5</span
                        >
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >매너 {{ post.reviews[0].manner.toFixed(1) }}/5</span
                        >
                      </div>
                    </div>
                    <div class="mt-2">
                      <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-emerald-400"
                          :style="{ width: (post.reviews[0].performance / 5) * 100 + '%' }"
                        />
                      </div>
                      <div class="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          class="h-full bg-sky-400"
                          :style="{ width: (post.reviews[0].manner / 5) * 100 + '%' }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-3 text-white/80 text-sm leading-snug">
                  {{ post.reviews[0].text }}
                </div>
              </div>
            </div>
            <div class="flex items-center justify-center">
              <div
                class="w-full max-w-xl bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4"
              >
                <div class="flex items-center gap-3">
                  <img :src="post.reviews[1].avatar" class="w-12 h-12 rounded-full object-cover" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <div class="font-semibold truncate">{{ post.reviews[1].name }}</div>
                      <div class="text-[10px] flex gap-2">
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >퍼포먼스 {{ post.reviews[1].performance.toFixed(1) }}/5</span
                        >
                        <span class="px-2 py-1 rounded-full bg-black/30 border border-white/10"
                          >매너 {{ post.reviews[1].manner.toFixed(1) }}/5</span
                        >
                      </div>
                    </div>
                    <div class="mt-2">
                      <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-emerald-400"
                          :style="{ width: (post.reviews[1].performance / 5) * 100 + '%' }"
                        />
                      </div>
                      <div class="h-1.5 bg-white/10 rounded-full overflow-hidden mt-1">
                        <div
                          class="h-full bg-sky-400"
                          :style="{ width: (post.reviews[1].manner / 5) * 100 + '%' }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-3 text-white/80 text-sm leading-snug">
                  {{ post.reviews[1].text }}
                </div>
              </div>
            </div>
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            3 / 4 · 플레이어 리뷰
          </div>
        </section>

        <!-- 4. 규칙 설명 -->
        <section class="w-screen shrink-0 h-full relative p-5">
          <div class="absolute inset-0 bg-gradient-to-b from-amber-900 via-black to-black" />
          <div class="relative z-10 max-w-xl">
            <div class="text-2xl font-extrabold">{{ post.rule.title }}</div>
            <div class="text-white/70 mt-1 text-sm">작성자 · {{ post.author.name }}</div>
            <div
              class="mt-4 bg-white/10 border border-white/15 rounded-2xl backdrop-blur-md max-h-[70vh] overflow-auto no-scrollbar"
            >
              <div
                class="sticky top-0 z-10 bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-2 text-xs text-white/80"
              >
                규칙 세부 내용 · 총 {{ post.rule.items.length }}개
              </div>
              <div class="p-4 space-y-4">
                <div
                  v-for="(it, idx) in post.rule.items"
                  :key="'rule-' + idx"
                  class="flex items-start gap-3"
                >
                  <div
                    class="mt-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-xs shrink-0"
                  >
                    {{ idx + 1 }}
                  </div>
                  <div class="min-w-0">
                    <div class="font-semibold leading-tight">{{ it.title }}</div>
                    <div class="text-white/80 text-sm leading-snug mt-1">{{ it.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            class="absolute bottom-[calc(96px+env(safe-area-inset-bottom))] left-4 text-xs bg-white/10 border border-white/15 rounded-full px-2 py-1 backdrop-blur-md"
          >
            4 / 4 · 규칙 설명
          </div>
        </section>
      </div>
    </div>

    <!-- Bottom left info (author/caption) -->
    <div class="absolute z-30 left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom))] px-4">
      <div class="flex items-end justify-between gap-3 pr-16">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3">
            <img :src="post.author.avatar" class="w-10 h-10 rounded-full object-cover" />
            <div class="min-w-0">
              <div class="font-semibold truncate">{{ post.author.name }}</div>
              <div class="text-xs text-white/70 truncate">{{ post.caption }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right action buttons column -->
    <div
      class="absolute z-40 right-4 bottom-[calc(22%+env(safe-area-inset-bottom))] flex flex-col items-center gap-4"
    >
      <button @click="toggleLike" class="flex flex-col items-center active:scale-95 transition">
        <span
          class="w-8 h-8"
          :class="liked ? 'text-red-500' : ''"
          v-html="liked ? icons.heartFill : icons.heart"
        />
        <span class="text-[10px] mt-1">또 보고싶어</span>
      </button>
      <button @click="onDoWithMe" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.handshake" />
        <span class="text-[10px] mt-1">나랑도 해</span>
      </button>
      <button @click="onComment" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.comment" />
        <span class="text-[10px] mt-1">댓글</span>
      </button>
      <button @click="onShare" class="flex flex-col items-center active:scale-95 transition">
        <span class="w-8 h-8" v-html="icons.share" />
        <span class="text-[10px] mt-1">공유</span>
      </button>
    </div>

    <!-- Floating like hearts -->
    <div class="pointer-events-none absolute inset-0 z-30">
      <div
        v-for="h in hearts"
        :key="h.id"
        class="absolute text-red-500 animate-heart-pop"
        :style="{ left: h.x + 'px', top: h.y + 'px' }"
        v-html="icons.heartFill"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Dummy post data
const post = reactive({
  id: 'demo-1',
  date: '2025-09-05',
  proofImage: 'https://prodigits.co.uk/content4/wallpapers/2024/p2/29/f4te4054.jpg',
  reviewBg: 'https://prodigits.co.uk/content4/wallpapers/2024/p2/29/f4te4054.jpg',
  caption: '경기도 수원시',
  meta: {
    place: '수원시청 체육관',
    time: '어제 · 20:00',
  },
  tags: ['검도', '친선전', '3세트'],
  author: {
    name: '김우진',
    avatar:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop',
  },
  players: [
    {
      name: '현수',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    },
    {
      name: '민재',
      avatar:
        'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop',
    },
  ],
  result: {
    scoreA: 2,
    scoreB: 1,
    winner: '현수',
    sets: 3,
    duration: '34분',
    setScores: [
      { a: 11, b: 9 },
      { a: 8, b: 11 },
      { a: 11, b: 7 },
    ],
  },
  reviews: [
    {
      name: '현수',
      avatar:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      performance: 4.8,
      manner: 4.9,
      text: '상대가 잘 받아냈어요! 마지막 랠리는 아직도 짜릿🤩 다음엔 드라이브 템포를 조금 더 올려볼게요.',
    },
    {
      name: '민재',
      avatar:
        'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop',
      performance: 4.2,
      manner: 5.0,
      text: '규칙이 깔끔해서 몰입감 최고. 리시브 포지션을 다듬으면 더 좋아질 듯!',
    },
  ],
  rule: {
    title: '3세트 승부 · 11점 선취',
    items: [
      {
        title: '타이틀임',
        desc: '내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임내용임 ',
      },
    ],
  },
})

const sections = ref(['인증샷', '경기 결과', '플레이어 리뷰', '규칙 설명'])

// Slides logic
const currentSlide = ref(0)
const translateX = ref(0)
const animating = ref(false)
const startX = ref(0)
const deltaX = ref(0)
const endX = ref(0)
let lastTapAt = 0
const hearts = ref([])

const wrapperStyle = computed(() => ({
  width: sections.value.length * 100 + 'vw',
  transform: `translateX(calc(${-currentSlide.value * 100}vw + ${translateX.value}px))`,
  transition: animating.value ? 'transform 280ms ease' : 'none',
}))

function onTouchStart(e) {
  startX.value = e.touches[0].clientX
  endX.value = startX.value
  deltaX.value = 0
  animating.value = false
}

function onTouchMove(e) {
  const x = e.touches[0].clientX
  deltaX.value = x - startX.value
  endX.value = x
  // resist overscroll
  const atStart = currentSlide.value === 0 && deltaX.value > 0
  const atEnd = currentSlide.value === sections.value.length - 1 && deltaX.value < 0
  translateX.value = atStart || atEnd ? deltaX.value * 0.35 : deltaX.value
}

function onTouchEnd() {
  const threshold = 60
  animating.value = true
  if (Math.abs(deltaX.value) > threshold) {
    if (deltaX.value < 0) nextSlide()
    else prevSlide()
  } else {
    // tap: left/right or double-like
    const now = Date.now()
    const tapGap = now - lastTapAt
    const moved = Math.abs(deltaX.value) > 10
    if (!moved && tapGap < 260) {
      toggleLike()
      spawnHeart(endX.value, window.innerHeight * 0.45)
      lastTapAt = 0
    } else {
      const half = window.innerWidth / 2
      if (endX.value > half) nextSlide()
      else prevSlide()
      lastTapAt = now
    }
  }
  setTimeout(() => {
    animating.value = false
    translateX.value = 0
  }, 320)
}

function nextSlide() {
  const before = currentSlide.value
  currentSlide.value = Math.min(currentSlide.value + 1, sections.value.length - 1)
  if (currentSlide.value !== before) tryVibrate(10)
}
function prevSlide() {
  const before = currentSlide.value
  currentSlide.value = Math.max(currentSlide.value - 1, 0)
  if (currentSlide.value !== before) tryVibrate(10)
}

// Actions
const liked = ref(false)
function toggleLike() {
  liked.value = !liked.value
  tryVibrate(15)
}
function onDoWithMe() {
  router.push('/create-game')
}
function onComment() {
  router.push('/games/demo-game/comments')
}
async function onShare() {
  const url = window.location.origin + '/'
  const text = `${post.author.name}의 경기 하이라이트 – Raspy`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Raspy', text, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('링크를 복사했어요!')
    }
  } catch (e) {
    console.log(e)
  }
}

function tryVibrate(ms) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms)
  } catch (e) {
    // ignore
  }
}

function spawnHeart(x, y) {
  const id = Math.random().toString(36).slice(2)
  hearts.value.push({ id, x: x - 16, y: y - 16 })
  setTimeout(() => {
    hearts.value = hearts.value.filter((h) => h.id !== id)
  }, 700)
}

// Icons (inline SVG)
const icons = {
  heart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
  heartFill:
    '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>',
  handshake:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 13.5 10 15a2.828 2.828 0 0 0 4 0l3.5-3.5m-5-5 2 2m-7 7 2 2"/><path d="M3 8.5 8.5 3 12 6.5l3.5-3.5L21 8.5l-6.5 6.5"/></svg>',
  comment:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0Z"/></svg>',
  share:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" xmlns="http://www.w3.org/2000/svg"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6 12 2 8 6"/><path d="M12 2v14"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>',
  starFill:
    '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m12 3 2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>',
  trophy:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M8 21h8M12 17a5 5 0 0 0 5-5V4H7v8a5 5 0 0 0 5 5Z"/><path d="M5 4H3v2a4 4 0 0 0 4 4"/><path d="M19 4h2v2a4 4 0 0 1-4 4"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
}

onBeforeUnmount(() => {})
</script>

<style scoped>
.w-8 :deep(svg),
.w-4 :deep(svg) {
  width: 100%;
  height: 100%;
}
.w-8 :deep(svg),
.w-4 :deep(svg) {
  display: block;
}

@keyframes heart-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  10% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.6) translateY(-20px);
    opacity: 0;
  }
}
.animate-heart-pop :deep(svg) {
  width: 32px;
  height: 32px;
  animation: heart-pop 650ms ease forwards;
}

/* hide scrollbars for rule box */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
