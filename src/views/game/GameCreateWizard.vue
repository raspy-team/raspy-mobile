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
        <!-- 무슨 경기를 열었는지 (예전엔 없었다, '내일 저녁'이 몇 시인지도) -->
        <p v-if="createdLine" class="t-body mt-2">{{ createdLine }}</p>
        <p class="t-caption mt-2">
          <!-- 서버가 친구에게 알림을 보내지 않는데 '알렸어요'라고 했다. 링크로 직접 알리게 한다 (목적 판정 11/11 4번) -->
          {{ friend ? `${friend.nickname}님에게 알림이 갔어요. ${isRemote(venue) ? '시간은' : '장소와 시간은'} 내 경기에서 함께 정해요.` : createdLinkOnly ? '링크를 받은 사람만 신청할 수 있어요. 경기 목록에는 올라가지 않아요.' : '모집 중인 경기에 올라갔어요. 링크를 보내면 아는 사람이 바로 신청할 수 있어요.' }}
        </p>
        <!-- 아무나로 열었으면, 기다리기만 하기보다 아는 사람을 먼저 부르게 -->
        <UiButton v-if="createdId" block size="lg" class="mt-10" icon="share" :loading="sharing" @click="shareGame">{{ friend ? `${friend.nickname}님에게 링크 보내기` : format === 'DUEL' ? '링크 보내서 상대 부르기' : '링크 보내서 같이 할 사람 부르기' }}</UiButton>
        <UiButton block size="lg" :variant="createdId ? 'ghost' : 'primary'" :class="createdId ? 'mt-2' : 'mt-10'" @click="router.replace('/game')">내 경기 보기</UiButton>
      </section>

      <!-- 종목부터: 사람들은 규칙이 아니라 '토요일에 배드민턴'을 하고 싶다. 고르면 그 종목에서 가장 많이 쓰는 규칙으로 (11/3) -->
      <section v-else-if="!ruleId">
        <h1 class="t-title">무슨 종목으로 할까요?</h1>
        <p class="t-caption mt-2">고르면 가장 많이 쓰는 규칙으로 시작해요. 다음 화면에서 바꿀 수 있어요.</p>
        <p v-if="sportMissing" class="t-caption mt-2">아직 {{ wantSport }} 규칙이 없어요. 비슷한 종목을 고르거나 규칙을 직접 골라 주세요.</p>
        <div v-if="!sports" class="grid grid-cols-3 gap-2 mt-6">
          <UiSkeleton v-for="n in 9" :key="n" class="h-24 rounded-xl" />
        </div>
        <!-- 실패하면 칸 없이 '직접 고를래요'만 남아 이유를 몰랐다 (목적 판정 11/11 4번) -->
        <div v-else-if="sportsFailed" class="mt-6 text-center">
          <p class="t-caption">종목을 불러오지 못했어요</p>
          <UiButton class="mt-3" size="sm" variant="secondary" @click="retrySports">다시 시도</UiButton>
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
        <!-- 규칙을 못 불러오면 규칙 칸이 말없이 비어 무엇으로 여는지 몰랐다 (가로 훑기 3) -->
        <UiCard v-if="ruleFailed && !rule" class="flex items-center gap-3 mb-8">
          <p class="flex-1 t-caption">규칙을 불러오지 못했어요</p>
          <UiButton size="sm" variant="secondary" @click="loadRule">다시 시도</UiButton>
        </UiCard>
        <UiCard v-if="rule" class="flex items-center gap-3 mb-8">
          <RuleThumb :rule="rule" :size="36" bare />
          <div class="flex-1 min-w-0">
            <p class="t-micro">{{ autoPicked ? '자동으로 골랐어요 · 가장 많이 쓰는 규칙' : '규칙' }}</p>
            <p class="t-heading truncate">{{ rule.ruleTitle }}</p>
            <p v-if="winSummaryUnder(rule)" class="t-caption">{{ winSummaryUnder(rule) }}</p>
          </div>
          <!-- 종목은 점점 늘어나고 예외도 있으니, 골라 준 규칙은 늘 바꿀 수 있게 (같은 종목 규칙부터 보여 준다) -->
          <UiButton variant="ghost" size="sm" @click="changeRule">바꾸기</UiButton>
        </UiCard>
        <button v-if="autoPicked && pickedSport" type="button" class="t-caption underline underline-offset-2 -mt-6 mb-8 block" @click="backToSports">{{ pickedSport }} 말고 다른 종목</button>
        <!-- 다칠 수 있는 규칙은 서버가 만 19세 이상만 받는다 (내 정보의 나이) -->
        <p v-if="dangerous" class="t-caption text-danger -mt-6 mb-8">다칠 수 있는 규칙이라 만 19세 이상만 할 수 있어요. 내 정보에 나이를 넣어 두세요.</p>

        <!-- 언제쯤: 열린 경기를 보는 사람이 신청할지 정하는 데 가장 필요한 정보. 정확한 시간은 상대와 함께 -->
        <h2 class="t-heading">언제쯤 할까요?</h2>
        <div class="flex flex-wrap gap-2 mt-3" :class="when === EXACT ? 'mb-3' : 'mb-8'">
          <UiChip v-for="w in WHEN" :key="w.label" :selected="when === w.label" @click="when = w.label">{{ w.label }}</UiChip>
        </div>
        <!-- 이미 정해 둔 때가 있으면 날짜·시간을 바로 (빠른 고르기 셋만으로는 '토요일 3시'를 못 적었다) -->
        <!-- 고르고 비워 두면 말없이 '나중에'로 열렸다: 비운 채 다른 것을 고르러 나가면 칩도 '나중에 정하기'로 되돌린다 -->
        <UiInput v-if="when === EXACT" v-model="exactTime" type="datetime-local" :min="nowLocal" class="mb-8" @focusout="!exactTime && (when = '나중에 정하기')" />

        <!-- 어디서: 만나서 / 화상으로 / 다른 게임에서. 화상·다른 게임은 동네 없이 전국에 보인다 -->
        <!-- '어디서'라고 물으면 장소 칸을 찾았다: 보기는 방식(만나서·화상·다른 게임)이고 장소는 상대와 나중에 정한다 -->
        <h2 class="t-heading">어떻게 할까요?</h2>
        <div class="flex flex-wrap gap-2 mt-3">
          <UiChip v-for="v in venueOptions" :key="v.value" :selected="venue === v.value" @click="venue = v.value">{{ v.label }}</UiChip>
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
      <!-- 매치에 아직 없는 친구 (11/14): '아무나'로 열어야만 링크가 나왔고, 그러려면 동네 인증이 먼저였다.
           링크로만 받는 경기를 연다(목록에 안 올라가고 동네를 묻지 않는다, 서버 CreateGameRequest.linkOnly) -->
      <UiList class="mb-3">
        <UiListItem icon="link" title="링크로 부르기" subtitle="매치에 없는 친구도 돼요. 링크를 받은 사람만 신청해요" chevron :disabled="creating" @click="create(null, true)" />
      </UiList>
      <UiInput v-model="q" icon="fas fa-magnifying-glass" placeholder="닉네임이나 아이디" class="mb-3" />
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <!-- 못 불러온 것을 '아직 친구가 없어요'로 보였다: 다시 불러오는 길 (가로 훑기 3) -->
      <UiEmptyState v-else-if="friendsFailed" icon="fas fa-rotate-right" title="친구 목록을 불러오지 못했어요">
        <UiButton variant="secondary" @click="loadFriends">다시 시도</UiButton>
      </UiEmptyState>
      <!-- 친구가 없어도 막다른 길이 아니게 (11/14 피터로 걷기: 방금 데려온 친구와 농구를 하려는데 '아직 친구가 없어요'에서 끝났다).
           이름을 치면 매치의 모든 사람에서 찾고, 친구가 아니면 '한 판 붙자'를 보낸다(받으면 경기가 된다) -->
      <p v-if="!friends.length && !q.trim()" class="t-caption py-6 text-center break-keep">친구의 닉네임이나 아이디를 쳐서 찾아요.</p>
      <p v-else-if="!filteredFriends.length && !others.length" class="t-caption py-6 text-center">{{ searching ? '찾는 중' : '그런 이름이 없어요. 아이디로도 찾아 보세요' }}</p>
      <UiList v-if="filteredFriends.length">
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
      <template v-if="others.length">
        <p class="t-label mt-5 mb-2">아직 친구가 아닌 사람</p>
        <UiList>
          <UiListItem v-for="u in others" :key="u.id" :title="u.nickname" :subtitle="`@${u.username} · 한 판 붙자고 보내기`" :disabled="creating" @click="ask(u)">
            <template #leading><UiAvatar :src="u.avatar" :name="u.nickname" :user-id="u.id" size="sm" /></template>
          </UiListItem>
        </UiList>
      </template>
    </UiSheet>
  </div>
</template>

<script setup>
// 경기 만들기: 규칙은 /rules에서 고르고 돌아온다. 여기서는 상대(아무나 / 친구)만 정하면 경기가 열린다.
// 장소·시간은 상대가 정해진 뒤 내 경기에서 함께 정한다
import { ref, computed, onMounted, watch } from 'vue'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import { GET } from '@/api/client'
import { categoryKey, winSummaryUnder } from '../../utils/rule'
import { useRoute, useRouter } from 'vue-router'
import api, { playWithMeTooAPI } from '../../api/api'
import { getMyId } from '@/utils/me'
import { useToast } from '../../composables/useToast'
import { feel } from '../../utils/feel'
import { shareGameInvite } from '../../utils/share'
import { localIso, quickTimes } from '../../utils/when'
import { matchTime } from '../../utils/format'
import { allowedFormats, TEAM_SIZES, GROUP_SIZES, VENUES, isRemote } from '../../utils/gameFormat'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton, UiSheet, UiSkeleton, UiSpinner, UiTopBar,
} from '../../components/ui'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const OPTIONS = [
  { value: 'anyone', icon: 'globe', title: '아무나', description: '경기 목록에 올려서 신청을 받아요' },
  { value: 'friend', icon: 'user-check', title: '친구와', description: '닉네임으로 찾아 한 명과 경기를 잡아요' },
]

// 친구와 바로 잡는 경기는 1:1만 된다 (여럿은 열어서 신청을 받는다)
const options = computed(() => (format.value === 'DUEL' ? OPTIONS : OPTIONS.filter((o) => o.value === 'anyone')))

const venue = ref(route.query.venue ? String(route.query.venue) : 'IN_PERSON')
const venueDetail = ref(route.query.venueDetail ? String(route.query.venueDetail).slice(0, 100) : '')

const formats = computed(() => allowedFormats(rule.value))
const dangerous = computed(() => (rule.value?.category?.traits || []).some((t) => t.key === 'DANGER'))
const format = ref(route.query.format ? String(route.query.format) : 'DUEL')
const size = ref(Number(route.query.size) || 2)
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
const when = ref(WHEN.some((w) => w.label === route.query.when) ? String(route.query.when) : '나중에 정하기')
if (route.query.exact) exactTime.value = String(route.query.exact)

const ruleId = ref(Number(route.query.ruleId) || 0)

const ruleFailed = ref(false)
function loadRule() {
  ruleFailed.value = false
  api.get(`/api/rules/${ruleId.value}`).then(({ data }) => (rule.value = data)).catch(() => (ruleFailed.value = true))
}
const createdId = ref(null)
const sharing = ref(false)

async function shareGame() {
  sharing.value = true
  try {
    const msg = await shareGameInvite(createdId.value, `${rule.value?.ruleTitle || '경기'} 한 판 할래요? 매치에서 신청해 주세요`)
    if (msg) showToast(msg)
  } finally {
    sharing.value = false
  }
}
const rule = ref(null)
// 규칙이 팀으로만(또는 여럿이만) 하는 것이면 그 방식으로 시작한다. 1:1로 두면 '세 명씩 편을 나눠' 규칙도 1:1로 열렸다 (11/4 밤샘)
// 사람이 이미 고른 방식(돌아올 주소의 format)이 있으면 그대로
watch(rule, (r) => {
  // 롤·피파처럼 다른 게임 안에서 하는 규칙이면 장소는 '다른 게임에서', 칸에는 그 게임 이름 (9번)
  if (r?.extGame && !route.query.venue && venue.value === 'IN_PERSON') {
    venue.value = 'ONLINE'
    if (!venueDetail.value) venueDetail.value = r.extGameLabel || ''
  }
  if (!r || route.query.format) return
  const parties = (r.category?.parties || []).map((p) => p.key)
  const only = (k) => parties.includes(k) && !parties.includes('SOLO') && !parties.includes('DUO')
  if (only('TEAM') && format.value !== 'TEAMS') pickFormat('TEAMS')
  else if (only('GROUP') && !parties.includes('TEAM') && format.value !== 'FREE_FOR_ALL') pickFormat('FREE_FOR_ALL')
})

// 종목 고르기: 규칙을 많이 쓴 순으로 받아 종목마다 맨 위 규칙을 고른다. 종목 이름은 분류(category.sport) → 제목·분류에서 찾은 종목
const createdLine = ref('')
// 규칙 바꾸기: 고른 때·방식·인원을 실어 보내고, 규칙을 고르면 그대로 돌아온다 (예전엔 규칙 상세 → '경기 열기' → 처음부터 다시)
function changeRule() {
  const keep = {
    when: when.value, venue: venue.value, format: format.value,
    ...(format.value !== 'DUEL' ? { size: String(size.value) } : {}),
    ...(when.value === EXACT && exactTime.value ? { exact: exactTime.value } : {}),
    ...(isRemote(venue.value) && venueDetail.value ? { venueDetail: venueDetail.value } : {}),
  }
  router.push({ path: '/rules', query: { fromGameCreate: 'true', ...(autoPicked.value && pickedSport.value ? { q: pickedSport.value } : {}), ...keep } })
}
const sports = ref(null)
// '다른 게임에서'는 롤·피파처럼 다른 게임 안에서 하는 규칙에만 (배드민턴에 '다른 게임에서'가 보였다)
const venueOptions = computed(() => VENUES.filter((v) => v.value !== 'ONLINE' || rule.value?.extGame || venue.value === 'ONLINE'))
const autoPicked = ref(false)
const pickedSport = ref('')
const wantSport = typeof route.query.sport === 'string' ? route.query.sport.trim().slice(0, 20) : ''
const sportMissing = ref(false)
async function loadSports() {
  try {
    const { data } = await GET('/api/rules/list', { query: { sort: 'popular' } })
    const bySport = new Map()
    for (const r of data || []) {
      const name = r.category?.sport || categoryKey(r)
      if (name === '기타') continue
      const s = bySport.get(name)
      if (s) { s.plays += r.playCount ?? 0; continue }
      bySport.set(name, { name, top: r, plays: r.playCount ?? 0, ext: !!r.extGame })
    }
    // 종목은 그 종목 판 수가 많은 순, 같으면 만나서 하는 종목을 인기 게임(롤·피파 등)보다 먼저.
    // 판 수가 같은 규칙끼리 순서가 없어 체스·카트라이더가 맨 위, 배드민턴·탁구가 첫 화면 밖에 있었다
    sports.value = [...bySport.values()].sort((a, b) => b.plays - a.plays || Number(a.ext) - Number(b.ext))
    // 이웃 알림의 '먼저 경기를 열어 보세요'(?sport=배드민턴)로 왔으면 그 종목을 골라 둔다 (docs/ai-residents.md 4)
    if (wantSport && !ruleId.value) {
      const hit = sports.value.find((s) => s.name === wantSport) || sports.value.find((s) => s.name.includes(wantSport) || wantSport.includes(s.name))
      if (hit) {
        ruleId.value = hit.top.id
        rule.value = hit.top
        autoPicked.value = true
        pickedSport.value = hit.name
      } else sportMissing.value = true
    }
  } catch {
    sports.value = []
    sportsFailed.value = true
  }
}
const sportsFailed = ref(false)
function retrySports() {
  sportsFailed.value = false
  sports.value = null
  loadSports()
}
// 종목을 다시 고르려면 '바꾸기'로 규칙 목록까지 가야 했다: 자동으로 고른 규칙이면 종목 고르기로 돌아간다
function backToSports() {
  ruleId.value = 0
  rule.value = null
  autoPicked.value = false
  pickedSport.value = ''
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
const createdLinkOnly = ref(false)

const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])
const q = ref('')
const filteredFriends = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return friends.value
  return friends.value.filter((f) => f.nickname?.toLowerCase().includes(k) || f.username?.toLowerCase().includes(k))
})

// 친구가 아닌 사람도 이름으로 찾는다 (서버 /api/user-profile/search, 최대 20명). 나·친구·AI는 뺀다
const others = ref([])
const searching = ref(false)
let searchSeq = 0
watch(q, async (v) => {
  const k = v.trim()
  const my = ++searchSeq
  if (!k) { others.value = []; return }
  searching.value = true
  try {
    const [{ data }, me] = await Promise.all([GET('/api/user-profile/search', { query: { keyword: k }, quiet: true }), getMyId().catch(() => null)])
    if (my !== searchSeq) return
    const known = new Set(friends.value.map((f) => f.id))
    others.value = (data ?? []).filter((u) => u.id !== me && !u.isBot && !known.has(u.id))
  } catch {
    if (my === searchSeq) others.value = []
  } finally {
    if (my === searchSeq) searching.value = false
  }
})
// 친구가 아닌 사람에게는 바로 경기를 잡지 않고 '한 판 붙자'를 보낸다. 받으면 경기가 되고 메시지로 이어진다
async function ask(u) {
  if (creating.value) return
  creating.value = true
  try {
    await playWithMeTooAPI.sendRequest(u.id, ruleId.value)
    friendsOpen.value = false
    feel('success')
    showToast(`${u.nickname}님에게 ${rule.value?.ruleTitle ?? '한 판'} 붙자고 했어요. 받으면 알려 드릴게요`)
    router.replace('/game')
  } catch (e) {
    showToast(e.response?.data?.message || '보내지 못했어요')
  } finally {
    creating.value = false
  }
}

// '아무나'는 내 동네 경기 목록에 올라간다. 동네가 없거나 인증이 지났으면 고르기 전에 알려 주고 인증으로 보낸다
// ('친구와'는 아는 사람과 바로 잡는 경기라 동네와 상관없다)
const dong = ref(null) // { name, expired } | null, 불러오기 전 undefined
const anyoneLine = computed(() => {
  // 화상·다른 게임은 동네와 상관없이 전국 목록에 올라간다
  if (isRemote(venue.value)) return '전국 경기 목록에 올려서 신청을 받아요'
  if (dong.value === undefined) return OPTIONS[0].description
  if (!dong.value) return '동네를 고르면 내 동네 경기 목록에 올릴 수 있어요'
  if (dong.value.expired) return `${dong.value.name} 인증이 지났어요. 다시 인증하면 열 수 있어요`
  return `${dong.value.name} 근처 경기 목록에 올려서 신청을 받아요`
})
function createAnyone() {
  if (!isRemote(venue.value) && (dong.value === null || dong.value?.expired)) {
    // 고른 것(규칙·언제·어디서·몇 명)을 돌아올 주소에 담는다. 전에는 인증하고 오면 처음부터 다시 골라야 했다 (11/4 밤샘)
    const picks = { ruleId: ruleId.value || undefined, when: when.value, exact: exactTime.value || undefined, venue: venue.value, format: format.value, size: size.value }
    const back = router.resolve({ path: route.path, query: { ...route.query, ...picks } }).fullPath
    router.push({ path: '/neighborhood', query: { back, reason: anyoneLine.value } })
    return
  }
  create(null)
}

async function create(target, linkOnly = false) {
  if (creating.value) return
  creating.value = true
  friend.value = target
  try {
    const matchDate = WHEN.find((w) => w.label === when.value)?.date() ?? null
    const payload = {
      referencedRuleId: ruleId.value, friendId: target?.id ?? null, linkOnly, matchDate, format: format.value, maxPlayers: maxPlayers.value,
      venue: venue.value, placeDetail: isRemote(venue.value) ? venueDetail.value.trim() || null : null,
    }
    const { data } = await api.post(target ? '/api/games/create-friend-game' : '/api/games/create', payload)
    createdId.value = data
    createdLine.value = [rule.value?.ruleTitle, matchDate ? matchTime(matchDate) : '시간은 나중에', isRemote(venue.value) ? null : dong.value?.name && `${dong.value.name} 근처`].filter(Boolean).join(' · ')
    friendsOpen.value = false
    created.value = true
    createdLinkOnly.value = linkOnly
    feel('success')
    // 링크로 부르기는 링크를 보내려고 연 것: 보내기 창을 바로 띄운다
    if (linkOnly) shareGame()
  } catch (e) {
    friend.value = null
    if (e.response?.status !== 428) showToast(e.response?.data?.message || '경기를 열지 못했어요. 다시 해 주세요') // 428은 내 동네 화면이 말한다
  } finally {
    creating.value = false
  }
}

const friendsFailed = ref(false)
async function loadFriends() {
  friendsLoading.value = true
  friendsFailed.value = false
  try {
    friends.value = (await api.get('/api/friends/my')).data || []
  } catch {
    friendsFailed.value = true
  } finally {
    friendsLoading.value = false
  }
}

onMounted(() => {
  // 규칙 없이 들어오면 종목부터 고른다 (규칙 목록으로 보내지 않는다)
  if (!ruleId.value) loadSports()
  else loadRule()
  dong.value = undefined
  api.get('/api/neighborhoods/me')
    .then(({ data }) => (dong.value = data.neighborhoods.find((n) => n.active) ?? null))
    .catch(() => (dong.value = undefined))
  loadFriends()
})
</script>
