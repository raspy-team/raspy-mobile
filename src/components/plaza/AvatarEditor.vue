<template>
  <div class="flex flex-col h-full">
    <!-- 미리보기: 걷는 모습 -->
    <div class="flex flex-col items-center pt-4 pb-3">
      <div class="relative rounded-3xl bg-surface-2 w-40 h-40 flex items-end justify-center overflow-hidden">
        <div v-if="previewKey" class="avatar-walk" :style="{ backgroundImage: `url(${sheetUrl(previewKey)})` }" role="img" :aria-label="'내 캐릭터 미리보기'" />
      </div>
      <p v-if="state" class="t-caption mt-2">
        포인트 <strong class="text-fg">{{ state.balance.toLocaleString() }}P</strong>
      </p>
    </div>

    <UiTabs v-model="layer" :options="tabs" class="px-4" />

    <div class="flex-1 overflow-y-auto px-4 pt-3 pb-4">
      <UiSkeleton v-if="!state" class="h-48 w-full" />
      <template v-else>
        <button
          v-if="layer === 'acc'"
          type="button"
          class="mb-2 px-3 h-11 rounded-xl t-body"
          :class="draft.acc ? 'bg-surface text-fg-muted' : 'bg-fg text-canvas'"
          @click="draft.acc = undefined"
        >
          소품 없음
        </button>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="g in groups"
            :key="g.key"
            type="button"
            class="relative rounded-2xl bg-surface flex flex-col items-center pt-2 pb-1.5 min-h-[92px] border-2"
            :class="g.items.some((i) => i.id === draft[layer]) ? 'border-signal' : 'border-transparent'"
            :aria-label="g.label"
            @click="pick(g.items.find((i) => i.id === draft[layer]) ?? g.items[0])"
          >
            <img :src="partUrl(g.items[0].id)" alt="" class="part" />
            <span class="t-micro mt-1 truncate max-w-full px-1">{{ g.label }}</span>
            <span v-if="g.badge" class="absolute top-1 left-1 t-micro px-1 rounded font-semibold" :class="g.tierClass || 'bg-surface-3 text-fg'">{{ g.badge }}</span>
            <span v-if="g.price" class="absolute top-1 right-1 t-micro text-fg-muted">{{ g.price }}P</span>
          </button>
        </div>
        <!-- 색 고르기: 같은 모양의 다른 색 -->
        <div v-if="variants.length > 1" class="mt-4">
          <p class="t-caption mb-2">색</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="v in variants"
              :key="v.id"
              type="button"
              class="relative w-12 h-14 rounded-xl bg-surface border-2 flex items-center justify-center"
              :class="v.id === draft[layer] ? 'border-signal' : 'border-transparent'"
              :aria-label="`${v.label} ${v.variant}번 색`"
              @click="pick(v)"
            >
              <img :src="partUrl(v.id)" alt="" class="part-sm" />
              <UiIcon v-if="!v.wearable" name="lock" class="absolute bottom-0.5 right-0.5 text-[10px] text-fg-muted" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <div class="px-4 py-3 border-t border-line space-y-2" :style="{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }">
      <p v-if="error" class="t-caption text-danger text-center">{{ error }}</p>
      <UiButton v-if="loadFailed" block size="lg" variant="secondary" @click="fetchAvatar">다시 시도</UiButton>
      <UiButton v-if="locked" block size="lg" :loading="busy" :disabled="!locked.buyable || (state?.balance ?? 0) < locked.price" @click="buy(locked)">
        {{ buyLabel(locked) }}
      </UiButton>
      <UiButton block size="lg" :variant="locked ? 'secondary' : 'primary'" :loading="busy && !locked" :disabled="!!locked || !state" @click="save">
        {{ mode === 'start' ? '이 모습으로 시작하기' : '저장' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// 캐릭터 꾸미기 (광장, 11/5). mode='start': 처음 광장에 들어올 때 무료 부품만으로 기본 꾸미기. mode='edit': 포인트로 사서 꾸미기.
// 그림은 서버가 겹쳐 준다(/api/plaza/art). 사지 않은 부품도 입혀 볼 수 있고, 저장은 입을 수 있는 것만
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { GET, POST, PUT } from '@/api/client'
import type { components } from '@/api/schema'
import { API_BASE_URL } from '@/config/server'
import { UiButton, UiIcon, UiSkeleton, UiTabs } from '../ui'

type S = components['schemas']
type Item = S['ShopItem']
type Layer = 'body' | 'eyes' | 'outfit' | 'hair' | 'acc'

const props = withDefaults(defineProps<{ mode?: 'start' | 'edit' }>(), { mode: 'edit' })
const emit = defineEmits<{ (e: 'saved', state: S['AvatarState']): void }>()

const ART = `${API_BASE_URL}/api/plaza/art`
const sheetUrl = (key: string) => `${ART}/avatar/${key}.png`
const partUrl = (id: string) => `${ART}/part/${id}.png`

const state = ref<S['AvatarState'] | null>(null)
const draft = reactive<Record<Layer, string | undefined>>({ body: undefined, eyes: undefined, outfit: undefined, hair: undefined, acc: undefined })
const layer = ref<Layer>('outfit')
const busy = ref(false)
const error = ref('')

const tabs = computed(() => {
  const all = [
    { value: 'outfit', label: '옷' },
    { value: 'hair', label: '머리' },
    { value: 'body', label: '피부' },
    { value: 'eyes', label: '눈' },
    { value: 'acc', label: '소품' },
  ]
  // 처음 꾸미기는 기본만: 소품은 포인트로 사는 것이라 뺀다
  return props.mode === 'start' ? all.filter((t) => t.value !== 'acc') : all
})

const byId = computed(() => new Map((state.value?.items ?? []).map((i) => [i.id, i])))

// 등급 피라미드 (docs/plaza.md): 위로 갈수록 드물고 값지다. 전설은 살 수 없고 챔피언만 입는다
const TIER: Record<string, { label: string; cls: string }> = {
  common: { label: '일반', cls: 'bg-surface-3 text-fg' },
  rare: { label: '고급', cls: 'bg-[#2d6cdf] text-white' },
  epic: { label: '희귀', cls: 'bg-[#8b3fd9] text-white' },
  legend: { label: '전설', cls: 'bg-[#d9a31a] text-[#121214]' },
}

/** 이 층에서 보여 줄 부품: 처음 꾸미기는 무료만, 꾸미기는 모두(이번 주에 안 파는 한정·챔피언 아닌 사람의 챔피언 부품은 가진 것만) */
const visible = computed(() =>
  (state.value?.items ?? []).filter((i) => {
    if (i.layer !== layer.value) return false
    if (props.mode === 'start') return i.price === 0 && !i.champion
    if (i.limited && !i.onSale && !i.owned) return false
    return true
  }),
)

const groups = computed(() => {
  const map = new Map<string, Item[]>()
  for (const i of visible.value) {
    const k = `${i.layer}:${i.label}`
    map.set(k, [...(map.get(k) ?? []), i])
  }
  return [...map.entries()].map(([key, items]) => {
    const first = items[0]
    const any = items.some((i) => i.wearable)
    return {
      key,
      label: first.label,
      items,
      price: any ? 0 : first.price,
      badge: any && first.price > 0 ? '보유' : TIER[first.tier]?.label ?? '',
      tierClass: TIER[first.tier]?.cls ?? '',
    }
  })
})

const variants = computed(() => {
  const cur = draft[layer.value]
  const item = cur ? byId.value.get(cur) : undefined
  if (!item) return []
  return visible.value.filter((i) => i.label === item.label)
})

/** 입혀 본 것 중 아직 못 입는 것 (사거나 되돌려야 저장된다) */
const locked = computed(() => {
  for (const l of ['body', 'eyes', 'outfit', 'hair', 'acc'] as Layer[]) {
    const id = draft[l]
    const it = id ? byId.value.get(id) : undefined
    if (it && !it.wearable) return it
  }
  return null
})

const previewKey = computed(() => {
  if (!draft.body || !draft.eyes || !draft.outfit || !draft.hair) return ''
  return [draft.body, draft.eyes, draft.outfit, draft.hair, draft.acc].filter(Boolean).join('_')
})

function buyLabel(i: Item) {
  if (i.champion) return '챔피언이 되면 입을 수 있어요'
  const have = state.value?.balance ?? 0
  if (have < i.price) return `${i.label} ${i.price}P · ${i.price - have}P 모자라요`
  return `${i.label} ${i.price}P에 사기`
}

function pick(i: Item) {
  error.value = ''
  draft[i.layer as Layer] = i.id
}

function load(s: S['AvatarState']) {
  state.value = s
  draft.body = s.parts.body
  draft.eyes = s.parts.eyes
  draft.outfit = s.parts.outfit
  draft.hair = s.parts.hair
  draft.acc = s.parts.acc ?? undefined
}

// 처음 불러오기가 실패하면 그 자리에서 다시 (예전엔 '다시 열어 주세요'뿐이라 광장 처음이면 나아갈 길이 없었다, 목적 판정 8)
const loadFailed = ref(false)
async function fetchAvatar() {
  loadFailed.value = false
  error.value = ''
  try {
    load((await GET('/api/plaza/avatar')).data)
  } catch {
    loadFailed.value = true
    error.value = '불러오지 못했어요'
  }
}
onMounted(fetchAvatar)

watch(layer, () => (error.value = ''))

async function buy(i: Item) {
  busy.value = true
  error.value = ''
  try {
    const s = (await POST('/api/plaza/avatar/items/{itemId}/buy', { path: { itemId: i.id } })).data
    const keep = { ...draft }
    state.value = s
    Object.assign(draft, keep)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '사지 못했어요'
  } finally {
    busy.value = false
  }
}

async function save() {
  if (!draft.body || !draft.eyes || !draft.outfit || !draft.hair) return
  busy.value = true
  error.value = ''
  try {
    const s = (await PUT('/api/plaza/avatar', { body: { body: draft.body, eyes: draft.eyes, outfit: draft.outfit, hair: draft.hair, acc: draft.acc } })).data
    load(s)
    emit('saved', s)
  } catch (e) {
    error.value = (e as { response?: { data?: { message?: string } } }).response?.data?.message || '저장하지 못했어요'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
/* 16×32 칸을 5배로: 아래(앞)를 보고 걷는 6칸 (2줄 18~23칸) */
.avatar-walk {
  width: 80px;
  height: 160px;
  background-size: 4480px 480px;
  background-position-y: -320px;
  image-rendering: pixelated;
  animation: walk 0.6s steps(6) infinite;
}
@keyframes walk {
  from { background-position-x: -1440px; }
  to { background-position-x: -1920px; }
}
.part {
  width: 32px;
  height: 64px;
  image-rendering: pixelated;
}
.part-sm {
  width: 22px;
  height: 44px;
  image-rendering: pixelated;
}
</style>
