<template>
  <div>
    <UiTopBar title="경기 만들기" back />

    <main class="px-4 pt-4 pb-12 max-w-xl mx-auto">
      <!-- 열렸어요: 서버가 만든 뒤에만 보인다 -->
      <section v-if="created" class="pt-16 text-center ui-appear">
        <span class="mx-auto w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl" aria-hidden="true">
          <UiIcon name="fas fa-check" />
        </span>
        <h1 class="t-title mt-5">경기가 열렸어요</h1>
        <p class="t-caption mt-2">
          {{ friend ? `${friend.nickname}님에게 알렸어요. ${isRemote(venue) ? '시간은' : '장소와 시간은'} 내 경기에서 함께 정해요.` : '모집 중인 경기에 올라갔어요. 링크를 보내면 아는 사람이 바로 신청할 수 있어요.' }}
        </p>
        <!-- 아무나로 열었으면, 기다리기만 하기보다 아는 사람을 먼저 부르게 -->
        <UiButton v-if="!friend && createdId" block size="lg" class="mt-10" icon="share" :loading="sharing" @click="shareGame">{{ format === 'DUEL' ? '링크 보내서 상대 부르기' : '링크 보내서 같이 할 사람 부르기' }}</UiButton>
        <UiButton block size="lg" :variant="!friend && createdId ? 'ghost' : 'primary'" :class="!friend && createdId ? 'mt-2' : 'mt-10'" to="/game">내 경기 보기</UiButton>
      </section>

      <!-- 종목부터: 사람들은 규칙이 아니라 '토요일에 배드민턴'을 하고 싶다. 고르면 그 종목에서 가장 많이 쓰는 규칙으로 (11/3) -->
      <section v-else-if="!ruleId">
        <h1 class="t-title">무슨 종목으로 할까요?</h1>
        <p class="t-caption mt-2">고르면 가장 많이 쓰는 규칙으로 시작해요. 다음 화면에서 바꿀 수 있어요.</p>
        <div v-if="!sports" class="grid grid-cols-3 gap-2 mt-6">
          <UiSkeleton v-for="n in 9" :key="n" class="h-24 rounded-xl" />
        </div>
        <div v-else class="grid grid-cols-3 gap-2 mt-6">
          <button
            v-for="s in sports"
            :key="s.name"
            type="button"
            class="flex flex-col items-center gap-2 rounded-xl bg-surface py-4 active:bg-surface-2 transition-[background-color,transform] motion-safe:active:scale-[0.98]"
            @click="pickSport(s)"
          >
            <RuleThumb :minor="s.name" :size="36" bare />
            <span class="t-label text-fg">{{ s.name }}</span>
          </button>
        </div>
        <UiButton block variant="ghost" class="mt-6" @click="router.push('/rules?fromGameCreate=true')">규칙을 직접 고를래요</UiButton>
      </section>

      <!-- 누구와 -->
      <template v-else>
        <UiCard v-if="rule" class="flex items-center gap-3 mb-8">
          <RuleThumb :rule="rule" :size="36" bare />
          <div class="flex-1 min-w-0">
            <p class="t-micro">{{ autoPicked ? '자동으로 골랐어요 · 가장 많이 쓰는 규칙' : '규칙' }}</p>
            <p class="t-heading truncate">{{ rule.ruleTitle }}</p>
            <p v-if="winSummary(rule)" class="t-caption">{{ winSummary(rule) }}</p>
          </div>
          <!-- 종목은 점점 늘어나고 예외도 있으니, 골라 준 규칙은 늘 바꿀 수 있게 (같은 종목 규칙부터 보여 준다) -->
          <UiButton variant="ghost" size="sm" @click="router.push({ path: '/rules', query: { fromGameCreate: 'true', ...(autoPicked && pickedSport ? { q: pickedSport } : {}) } })">바꾸기</UiButton>
        </UiCard>
        <!-- 다칠 수 있는 규칙은 서버가 만 19세 이상만 받는다 (내 정보의 나이) -->
        <p v-if="dangerous" class="t-caption text-danger -mt-6 mb-8">다칠 수 있는 규칙이라 만 19세 이상만 할 수 있어요. 내 정보에 나이를 넣어 두세요.</p>

        <!-- 언제쯤: 열린 경기를 보는 사람이 신청할지 정하는 데 가장 필요한 정보. 정확한 시간은 상대와 함께 -->
        <h2 class="t-heading">언제쯤 할까요?</h2>
        <div class="flex flex-wrap gap-2 mt-3" :class="when === EXACT ? 'mb-3' : 'mb-8'">
          <UiChip v-for="w in WHEN" :key="w.label" :selected="when === w.label" @click="when = w.label">{{ w.label }}</UiChip>
        </div>
        <!-- 이미 정해 둔 때가 있으면 날짜·시간을 바로 (빠른 고르기 셋만으로는 '토요일 3시'를 못 적었다) -->
        <UiInput v-if="when === EXACT" v-model="exactTime" type="datetime-local" :min="nowLocal" class="mb-8" />

        <!-- 어디서: 만나서 / 화상으로 / 다른 게임에서. 화상·다른 게임은 동네 없이 전국에 보인다 -->
        <h2 class="t-heading">어디서 할까요?</h2>
        <div class="flex flex-wrap gap-2 mt-3">
          <UiChip v-for="v in VENUES" :key="v.value" :selected="venue === v.value" @click="venue = v.value">{{ v.label }}</UiChip>
        </div>
        <UiInput v-if="isRemote(venue)" v-model="venueDetail" class="mt-3" :placeholder="VENUES.find((v) => v.value === venue)?.placeholder" />
        <p v-if="isRemote(venue)" class="t-caption mt-2">장소가 없어서 동네와 상관없이 전국에서 보여요.</p>
        <div class="mb-8"></div>

        <!-- 몇 명이서: 규칙이 팀·여럿을 받을 때만 보인다 -->
        <template v-if="formats.length > 1">
          <h2 class="t-heading">몇 명이서 할까요?</h2>
          <div class="flex flex-wrap gap-2 mt-3">
            <UiChip v-for="f in formats" :key="f.value" :selected="format === f.value" @click="pickFormat(f.value)">{{ f.label }}</UiChip>
          </div>
          <p class="t-caption mt-2">{{ formats.find((f) => f.value === format)?.description }}</p>
          <div v-if="format !== 'DUEL'" class="flex flex-wrap gap-2 mt-3">
            <UiChip v-for="n in sizes" :key="n" :selected="size === n" @click="size = n">
              {{ format === 'TEAMS' ? `${n}:${n}` : `${n}명` }}
            </UiChip>
          </div>
          <div class="mb-8"></div>
        </template>

        <!-- 동호회 경기: 고르면 그 동호회 멤버 모두에게 알린다 (든 동호회가 있을 때만) -->
        <template v-if="clubs.length">
          <h1 class="t-title">동호회에 알릴까요?</h1>
          <div class="flex flex-wrap gap-2 mt-3 mb-8">
            <UiChip :selected="!clubId" @click="clubId = null">알리지 않기</UiChip>
            <UiChip v-for="c in clubs" :key="c.id" :selected="clubId === c.id" @click="clubId = c.id">{{ c.name }}</UiChip>
          </div>
        </template>

        <h2 class="t-heading">{{ format === 'DUEL' ? '누구와 겨룰까요?' : '어떻게 모을까요?' }}</h2>
        <p class="t-caption mt-1 mb-5">시간·장소는 나중에 내 경기에서 언제든 정하거나 바꿀 수 있어요.</p>

        <div class="space-y-2">
          <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            class="w-full flex items-center gap-4 p-4 rounded-xl bg-surface text-left active:bg-surface-2 disabled:opacity-50"
            :disabled="creating"
            @click="opt.value === 'anyone' ? createAnyone() : (friendsOpen = true)"
          >
            <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
              <UiIcon :name="opt.icon" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block t-heading">{{ opt.title }}</span>
              <span class="block t-caption mt-0.5">{{ opt.value === 'anyone' ? anyoneLine : opt.description }}</span>
            </span>
            <UiSpinner v-if="creating && opt.value === 'anyone' && !friend" size="sm" label="여는 중" />
            <UiIcon name="fas fa-chevron-right" class="text-fg-subtle" v-else  aria-hidden="true" />
          </button>
        </div>
      </template>
    </main>

    <!-- 친구 고르기 -->
    <UiSheet v-model="friendsOpen" title="누구와 할까요?">
      <UiInput v-model="q" icon="fas fa-magnifying-glass" placeholder="닉네임이나 아이디" class="mb-3" />
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <UiEmptyState
        v-else-if="!friends.length"
        icon="fas fa-user-group"
        title="아직 친구가 없어요"
        description="'아무나'로 열거나, 경기를 한 상대에게 친구 요청을 보내 보세요"
      />
      <UiEmptyState v-else-if="!filteredFriends.length" icon="fas fa-magnifying-glass" title="찾는 친구가 없어요" />
      <UiList v-else>
        <UiListItem
          v-for="f in filteredFriends"
          :key="f.id"
          :title="f.nickname"
          :subtitle="'@' + f.username"
          :disabled="creating"
          @click="create(f)"
        >
          <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" :user-id="f.id" size="sm" /></template>
        </UiListItem>
      </UiList>
    </UiSheet>
  </div>
</template>

<script setup>
// 경기 만들기: 규칙은 /rules에서 고르고 돌아온다. 여기서는 상대(아무나 / 친구)만 정하면 경기가 열린다.
// 장소·시간은 상대가 정해진 뒤 내 경기에서 함께 정한다
import { ref, computed, onMounted } from 'vue'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import { GET } from '@/api/client'
import { categoryKey, winSummary } from '../../utils/rule'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import { feel } from '../../utils/feel'
import { shareLink } from '../../utils/share'
import { localIso, quickTimes } from '../../utils/when'
import { allowedFormats, TEAM_SIZES, GROUP_SIZES, VENUES, isRemote } from '../../utils/gameFormat'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton, UiSheet, UiSkeleton, UiSpinner, UiTopBar,
} from '../../components/ui'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const OPTIONS = [
  { value: 'anyone', icon: 'globe', title: '아무나', description: '경기 목록에 올려서 신청을 받아요' },
  { value: 'friend', icon: 'user-check', title: '친구와', description: '친구 한 명과 바로 경기를 잡아요' },
]

// 친구와 바로 잡는 경기는 1:1만 된다 (여럿은 열어서 신청을 받는다)
const options = computed(() => (format.value === 'DUEL' ? OPTIONS : OPTIONS.filter((o) => o.value === 'anyone')))

const venue = ref('IN_PERSON')
const venueDetail = ref('')

const formats = computed(() => allowedFormats(rule.value))
const dangerous = computed(() => (rule.value?.category?.traits || []).some((t) => t.key === 'DANGER'))
const format = ref('DUEL')
const size = ref(2)
const sizes = computed(() => (format.value === 'TEAMS' ? TEAM_SIZES : GROUP_SIZES))
function pickFormat(value) {
  format.value = value
  size.value = value === 'TEAMS' ? 2 : 3
}
// 서버에 보내는 인원: 팀은 두 팀 합
const maxPlayers = computed(() => (format.value === 'TEAMS' ? size.value * 2 : format.value === 'FREE_FOR_ALL' ? size.value : 2))

const EXACT = '날짜·시간 고르기'
const exactTime = ref('')
const nowLocal = localIso(new Date()).slice(0, 16)
const WHEN = [...quickTimes(), { label: EXACT, date: () => (exactTime.value ? `${exactTime.value.slice(0, 16)}:00` : null) }, { label: '나중에 정하기', date: () => null }]
const when = ref('나중에 정하기')

const ruleId = ref(Number(route.query.ruleId) || 0)

// 동호회 화면에서 '동호회 경기 열기'로 왔으면 그 동호회를 미리 고른다 (규칙을 고르러 다녀오는 동안 sessionStorage에 둔다)
const CLUB_KEY = 'match_club_for_game'
const clubs = ref([])
const clubId = ref(Number(route.query.clubId || sessionStorage.getItem(CLUB_KEY)) || null)
api.get('/api/clubs/mine').then(({ data }) => {
  clubs.value = data
  if (clubId.value && !data.some((c) => c.id === clubId.value)) clubId.value = null
}).catch(() => {})
const createdId = ref(null)
const sharing = ref(false)

async function shareGame() {
  sharing.value = true
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: createdId.value } })
    const msg = await shareLink(data.url, `${rule.value?.ruleTitle || '경기'} 한 판 할래요? 매치에서 신청해 주세요`)
    if (msg) showToast(msg)
  } catch {
    showToast('링크를 만들지 못했어요')
  } finally {
    sharing.value = false
  }
}
const rule = ref(null)

// 종목 고르기: 규칙을 많이 쓴 순으로 받아 종목마다 맨 위 규칙을 고른다. 종목 이름은 분류(category.sport) → 제목·분류에서 찾은 종목
const sports = ref(null)
const autoPicked = ref(false)
const pickedSport = ref('')
async function loadSports() {
  try {
    const { data } = await GET('/api/rules/list', { query: { sort: 'popular' } })
    const bySport = new Map()
    for (const r of data || []) {
      const name = r.category?.sport || categoryKey(r)
      if (name === '기타' || bySport.has(name)) continue
      bySport.set(name, { name, top: r })
    }
    sports.value = [...bySport.values()]
  } catch {
    sports.value = []
  }
}
function pickSport(s) {
  ruleId.value = s.top.id
  rule.value = s.top
  autoPicked.value = true
  pickedSport.value = s.name
  feel('select')
}
const friend = ref(null)
const creating = ref(false)
const created = ref(false)

const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])
const q = ref('')
const filteredFriends = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return friends.value
  return friends.value.filter((f) => f.nickname?.toLowerCase().includes(k) || f.username?.toLowerCase().includes(k))
})

// '아무나'는 내 동네 경기 목록에 올라간다. 동네가 없거나 인증이 지났으면 고르기 전에 알려 주고 인증으로 보낸다
// ('친구와'는 아는 사람과 바로 잡는 경기라 동네와 상관없다)
const dong = ref(null) // { name, expired } | null, 불러오기 전 undefined
const anyoneLine = computed(() => {
  // 화상·다른 게임은 동네와 상관없이 전국 목록에 올라간다
  if (isRemote(venue.value)) return '전국 경기 목록에 올려서 신청을 받아요'
  if (dong.value === undefined) return OPTIONS[0].description
  if (!dong.value) return '동네를 인증하면 내 동네 경기 목록에 올릴 수 있어요'
  if (dong.value.expired) return `${dong.value.name} 인증이 지났어요. 다시 인증하면 열 수 있어요`
  return `${dong.value.name} 근처 경기 목록에 올려서 신청을 받아요`
})
function createAnyone() {
  if (!isRemote(venue.value) && (dong.value === null || dong.value?.expired)) {
    router.push({ path: '/neighborhood', query: { back: route.fullPath, reason: anyoneLine.value } })
    return
  }
  create(null)
}

async function create(target) {
  if (creating.value) return
  creating.value = true
  friend.value = target
  try {
    const matchDate = WHEN.find((w) => w.label === when.value)?.date() ?? null
    const payload = {
      referencedRuleId: ruleId.value, friendId: target?.id ?? null, matchDate, format: format.value, maxPlayers: maxPlayers.value,
      venue: venue.value, placeDetail: isRemote(venue.value) ? venueDetail.value.trim() || null : null,
      clubId: target ? null : clubId.value,
    }
    const { data } = await api.post(target ? '/api/games/create-friend-game' : '/api/games/create', payload)
    createdId.value = data
    friendsOpen.value = false
    created.value = true
    sessionStorage.removeItem(CLUB_KEY)
    feel('success')
  } catch (e) {
    friend.value = null
    showToast(e.response?.data?.message || '경기를 열지 못했어요. 다시 해 주세요')
  } finally {
    creating.value = false
  }
}

async function loadFriends() {
  friendsLoading.value = true
  try {
    friends.value = (await api.get('/api/friends/my')).data || []
  } catch {
    showToast('친구 목록을 불러오지 못했어요')
  } finally {
    friendsLoading.value = false
  }
}

onMounted(() => {
  // 규칙 없이 들어오면 종목부터 고른다 (규칙 목록으로 보내지 않는다)
  if (!ruleId.value) loadSports()
  else api.get(`/api/rules/${ruleId.value}`).then(({ data }) => (rule.value = data)).catch(() => {})
  dong.value = undefined
  api.get('/api/neighborhoods/me')
    .then(({ data }) => (dong.value = data.neighborhoods.find((n) => n.active) ?? null))
    .catch(() => (dong.value = undefined))
  loadFriends()
})
</script>
