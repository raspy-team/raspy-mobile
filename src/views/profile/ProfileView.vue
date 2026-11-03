<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="isMeRoute ? '내 정보' : ''" :back="!isMeRoute">
      <template #right>
        <template v-if="isMeRoute">
          <UiIconButton icon="fas fa-magnifying-glass" label="사람 찾기" @click="showSearch = true" />
          <UiIconButton icon="fas fa-gear" label="설정" @click="router.push('/settings')" />
        </template>
        <UiIconButton v-else-if="user" icon="fas fa-ellipsis" label="더보기" @click="menuOpen = true" />
      </template>
    </UiTopBar>

    <!-- 불러오는 중: 실제 화면과 같은 모양 -->
    <main v-if="loading" class="max-w-2xl mx-auto px-4 pt-6" role="status" aria-label="프로필 불러오는 중">
      <div class="flex items-center gap-4">
        <UiSkeleton class="w-20 h-20 rounded-full flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <UiSkeleton class="h-6 w-1/2" />
          <UiSkeleton class="h-4 w-1/3" />
        </div>
      </div>
      <UiSkeleton class="h-4 w-3/4 mt-5" />
      <UiSkeleton class="h-16 w-full mt-6 rounded-xl" />
      <UiSkeleton class="h-11 w-full mt-4 rounded-xl" />
      <UiListSkeleton :rows="3" shape="tile" class="mt-8" />
    </main>

    <main v-else-if="loadError" class="max-w-2xl mx-auto px-4 pt-16">
      <UiEmptyState icon="fas fa-user-slash" :title="loadError" description="차단했거나 없는 사용자예요">
        <UiButton variant="secondary" @click="router.back()">돌아가기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else class="max-w-2xl mx-auto px-4 pt-6 pb-32 ui-appear">
      <!-- 누구인지 -->
      <div class="flex items-center gap-4">
        <UiAvatar :src="user.avatar" :name="user.nickname" size="xl" class="!w-20 !h-20" />
        <div class="flex-1 min-w-0">
          <h1 class="t-title truncate">{{ user.nickname }}</h1>
          <p class="t-caption truncate mt-0.5">@{{ user.username }}</p>
          <!-- 동네 (당근의 '합정동 · 동네 인증'). 인증이 지났으면 표시를 뺀다 -->
          <p v-if="user.dong" class="t-caption truncate mt-0.5 flex items-center gap-1">
            <UiIcon name="location-dot" class="text-xs" aria-hidden="true" />{{ user.dong.name }}<span v-if="user.dong.verified" class="text-fg-subtle">· 동네 인증</span>
          </p>
          <p v-if="subline" class="t-caption truncate mt-0.5">{{ subline }}</p>
        </div>
      </div>
      <p v-if="user.intro" class="t-body text-fg-muted mt-4 whitespace-pre-line break-words">{{ user.intro }}</p>

      <!-- 숫자 한 줄 -->
      <div class="mt-6 grid grid-cols-4 bg-surface rounded-xl divide-x divide-line text-center">
        <div class="py-3">
          <p class="t-heading tabular-nums">{{ stats.totalGames || 0 }}</p>
          <p class="t-micro mt-0.5">경기</p>
        </div>
        <div class="py-3">
          <p class="t-heading tabular-nums">{{ stats.totalGames ? `${stats.winRate}%` : '–' }}</p>
          <p class="t-micro mt-0.5">승률</p>
        </div>
        <div class="py-3">
          <p class="t-heading tabular-nums">{{ (user.myChampions || []).length }}</p>
          <p class="t-micro mt-0.5">챔피언</p>
        </div>
        <button type="button" class="py-3" @click="openFriends">
          <p class="t-heading tabular-nums">{{ stats.friends || 0 }}</p>
          <p class="t-micro mt-0.5">친구 <UiIcon name="fas fa-chevron-right" class="text-[10px]" aria-hidden="true" /></p>
        </button>
      </div>

      <!-- 만나도 되는 사람인지 (매치 온도와 근거) -->
      <TrustCard v-if="user.trust" :trust="user.trust" class="mt-4" />

      <!-- 포인트와 출처 (누구나 본다). 내 것이면 눌러서 내역 -->
      <PointCard :key="user.id" :user-id="user.id" :is-me="user.isMe" class="mt-3" />

      <!-- 주 행동 -->
      <div class="flex gap-2 mt-4">
        <template v-if="user.isMe">
          <UiButton block variant="secondary" icon="fas fa-pen" to="/set-profile">프로필 편집</UiButton>
        </template>
        <template v-else>
          <UiButton v-if="friend.received" class="flex-1" :loading="busy" @click="friendAction('accept')">친구 수락</UiButton>
          <UiButton v-if="friend.received" class="flex-1" variant="secondary" :disabled="busy" @click="friendAction('reject')">거절</UiButton>
          <UiButton v-else-if="friend.sent" class="flex-1" variant="secondary" :loading="busy" @click="friendAction('cancel')">요청 보냄 · 취소</UiButton>
          <UiButton v-else-if="!friend.isFriend" class="flex-1" icon="fas fa-user-plus" :loading="busy" @click="friendAction('request')">친구 추가</UiButton>
          <UiButton v-else class="flex-1" variant="secondary" icon="fas fa-user-check" @click="menuOpen = true">친구</UiButton>
          <UiButton class="flex-1" variant="secondary" icon="far fa-paper-plane" :to="`/chat/${user.id}`">메시지</UiButton>
        </template>
      </div>

      <!-- 챔피언 -->
      <section v-if="user.myChampions?.length" class="mt-10">
        <h2 class="t-heading mb-3">챔피언</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="(c, i) in user.myChampions" :key="i" class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-line-strong text-fg text-sm">
            <UiIcon name="crown" class="text-signal-fg" />{{ [c.region, c.ruleTitle].filter(Boolean).join(' ') }}
          </span>
        </div>
      </section>

      <!-- 많이 한 능력 (규칙의 '잘하려면'을 판 수로 센다). 누르면 그 능력 게임 둘러보기 -->
      <section v-if="abilities.length" class="mt-10">
        <h2 class="t-heading mb-3">많이 쓴 능력</h2>
        <div class="flex flex-wrap gap-2">
          <UiChip v-for="a in abilities" :key="a.key" @click="router.push({ path: '/rules', query: { ability: a.key } })">
            {{ a.label }}<span class="text-fg-subtle">{{ a.games }}판</span>
          </UiChip>
        </div>
      </section>

      <!-- 많이 한 규칙 -->
      <section class="mt-10">
        <div class="flex items-center justify-between mb-1">
          <h2 class="t-heading">많이 한 규칙</h2>
          <UiButton v-if="stats.totalGames" size="sm" variant="ghost" class="-mr-2" :to="`/profile/${user.id}/stats`">기록 자세히</UiButton>
        </div>
        <UiList v-if="user.top3Rules?.length">
          <UiListItem
            v-for="r in user.top3Rules"
            :key="r.ruleId"
            :title="r.ruleTitle"
            :subtitle="`${r.rating}점 · 경기 ${r.playCount}번`"
            chevron
            @click="router.push(`/rules/${r.ruleId}`)"
          >
            <template #leading>
              <RuleThumb :rule="r" :size="36" bare />
            </template>
            <template #trailing>
              <UiBadge v-if="r.myRank" :tone="r.myRank === 1 ? 'primary' : 'neutral'">{{ r.myRank }}위 / {{ r.totalPlayers }}명</UiBadge>
            </template>
          </UiListItem>
        </UiList>
        <UiEmptyState
          v-else
          icon="fas fa-trophy"
          :title="user.isMe ? '아직 한 경기가 없어요' : '아직 한 경기가 없어요'"
          :description="user.isMe ? '열린 경기에 신청하거나 직접 열어보세요' : ''"
        >
          <UiButton v-if="user.isMe" to="/">경기 찾기</UiButton>
        </UiEmptyState>
      </section>

      <!-- 최근 경기 -->
      <section v-if="user.recentGames?.length" class="mt-10">
        <div class="flex items-center justify-between mb-1">
          <h2 class="t-heading">최근 경기</h2>
          <UiButton size="sm" variant="ghost" class="-mr-2" :to="`/feed?userId=${user.id}`">전체 보기</UiButton>
        </div>
        <UiList>
          <UiListItem
            v-for="g in user.recentGames"
            :key="g.gameId"
            :ref="(el) => setGameRef(el, g.gameId)"
            :title="g.ruleTitle"
            :subtitle="`vs ${g.opponentNickname} · ${matchTime(g.playedAt)}`"
            :class="{ 'bg-surface-2': highlightId === g.gameId }"
            chevron
            @click="router.push(`/feed?gameId=${g.gameId}`)"
          >
            <template #leading>
              <span class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 t-label" :class="RESULT[resultKey(g.result)].class">
                {{ RESULT[resultKey(g.result)].label }}
              </span>
            </template>
            <template #trailing>
              <span v-if="g.myScore || g.opponentScore" class="t-heading tabular-nums">{{ g.myScore }}:{{ g.opponentScore }}</span>
            </template>
          </UiListItem>
        </UiList>
      </section>
    </main>

    <!-- 더보기 (남의 프로필) -->
    <UiSheet v-model="menuOpen">
      <UiList>
        <UiListItem v-if="friend.isFriend" icon="fas fa-user-minus" title="친구 끊기" @click="unfriend" />
        <UiListItem icon="far fa-flag" title="신고하기" @click="openReport" />
        <UiListItem icon="fas fa-ban" title="차단하기" subtitle="서로의 경기·글이 보이지 않아요" danger @click="block" />
      </UiList>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet v-model="reportOpen" :title="`${user?.nickname || ''}님을 신고할까요?`">
      <p class="t-caption mb-4">어떤 문제인지 알려주시면 확인 후 조치할게요.</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고하기</UiButton>
      </template>
    </UiSheet>

    <!-- 친구 목록 -->
    <UiSheet v-model="friendsOpen" :title="`친구 ${stats.friends || 0}명`">
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <UiList v-else-if="friends.length">
        <UiListItem
          v-for="f in friends"
          :key="f.id"
          :title="f.nickname"
          :subtitle="`@${f.username}`"
          chevron
          @click="goFriend(f.id)"
        >
          <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" :user-id="f.id" size="sm" /></template>
        </UiListItem>
      </UiList>
      <UiEmptyState v-else icon="fas fa-user-group" title="아직 친구가 없어요" :description="user?.isMe ? '경기를 함께한 사람에게 친구를 걸어보세요' : ''" />
    </UiSheet>

    <UserSearchModal v-if="showSearch" @close="showSearch = false" />
  </div>
</template>

<script setup>
import RuleThumb from '../../components/rule/RuleThumb.vue'
import TrustCard from '../../components/profile/TrustCard.vue'
import PointCard from '../../components/point/PointCard.vue'
// 프로필 (/profile/0 = 나, /profile/:id = 다른 사람)
// 누구인지(동네) → 숫자 한 줄 → 주 행동(나: 편집 / 남: 친구·메시지) → 챔피언 → 많이 쓴 능력 → 많이 한 규칙 → 최근 경기
// 신고·차단·친구 끊기는 더보기 안에. 빈 값(나이·성별·지역 없음)은 보여주지 않는다
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import api from '../../api/api'
import UserSearchModal from '../../components/profile/UserSearchModal.vue'
import {
  UiAvatar, UiBadge, UiButton, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composable/useToast'
import { matchTime } from '../../utils/format'

const REPORT_REASONS = ['욕설·비방', '노쇼·비매너', '사칭', '기타']
const RESULT = {
  win: { label: '승', class: 'bg-fg text-canvas' },
  lose: { label: '패', class: 'border border-line-strong text-fg-subtle' },
  draw: { label: '무', class: 'bg-surface-2 text-fg-muted' },
}
const resultKey = (r) => (r === 'win' ? 'win' : r === 'lose' || r === 'loss' ? 'lose' : 'draw')

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const isMeRoute = route.params.id === '0'
const user = ref(null)
const loading = ref(true)
const loadError = ref('')
const friend = ref({ sent: false, isFriend: false, received: false })
const busy = ref(false)
const menuOpen = ref(false)
const reportOpen = ref(false)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)
const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])
const showSearch = ref(false)
const highlightId = ref(Number(route.query.id) || null)
const gameRefs = {}

const stats = computed(() => user.value?.stats || {})
// 지역·소속 중 있는 것만 한 줄로
// 동네가 있으면 예전 활동 지역(시·구)은 겹치니 뺀다
const subline = computed(() => [user.value?.dong ? '' : user.value?.location, user.value?.affiliation].filter((v) => v && v.trim()).join(' · '))

function setGameRef(el, id) {
  if (el) gameRefs[id] = el.$el || el
}

async function loadFriendStatus() {
  if (!user.value || user.value.isMe) return
  friend.value = (await api.get(`/api/friends/status/${user.value.id}`).catch(() => ({ data: friend.value }))).data
}

const FRIEND_ACTIONS = {
  request: { call: (id) => api.post(`/api/friends/request/${id}`), done: '친구 요청을 보냈어요' },
  cancel: { call: (id) => api.delete(`/api/friends/cancel/${id}`), done: '요청을 취소했어요' },
  accept: { call: (id) => api.post(`/api/friends/accept/${id}`), done: '이제 친구예요' },
  reject: { call: (id) => api.post(`/api/friends/reject/${id}`), done: '요청을 거절했어요' },
}
async function friendAction(kind) {
  busy.value = true
  try {
    await FRIEND_ACTIONS[kind].call(user.value.id)
    showToast(FRIEND_ACTIONS[kind].done)
    await loadFriendStatus()
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요. 잠시 뒤 다시 시도해주세요')
  } finally {
    busy.value = false
  }
}

async function unfriend() {
  menuOpen.value = false
  if (!(await confirmDialog({ title: '친구를 끊을까요?', message: `${user.value.nickname}님에게 알리지 않아요`, confirmText: '친구 끊기', danger: true }))) return
  try {
    await api.delete(`/api/friends/${user.value.id}`)
    showToast('친구를 끊었어요')
    await loadFriendStatus()
  } catch {
    showToast('처리하지 못했어요. 잠시 뒤 다시 시도해주세요')
  }
}

async function block() {
  menuOpen.value = false
  if (!(await confirmDialog({ title: `${user.value.nickname}님을 차단할까요?`, message: '서로의 경기·글이 보이지 않아요. 설정에서 풀 수 있어요', confirmText: '차단', danger: true }))) return
  try {
    await api.post(`/api/block/${user.value.id}`)
    showToast('차단했어요')
    router.replace('/profile/0')
  } catch (e) {
    showToast(e.response?.data?.message || '차단하지 못했어요')
  }
}

function openReport() {
  menuOpen.value = false
  reportReason.value = ''
  reportDetail.value = ''
  reportOpen.value = true
}
async function submitReport() {
  reporting.value = true
  try {
    const reason = reportReason.value === '기타' ? reportDetail.value.trim() : reportReason.value
    await api.post('/api/reports', { targetType: 'USER', targetId: user.value.id, reason })
    showToast('신고를 접수했어요. 확인 후 조치할게요')
  } catch (e) {
    showToast(e.response?.data?.message || '이미 신고했어요')
  } finally {
    reporting.value = false
    reportOpen.value = false
  }
}

async function openFriends() {
  friendsOpen.value = true
  friendsLoading.value = true
  try {
    friends.value = (await api.get('/api/friends/my', { params: { userId: user.value.id } })).data
  } catch {
    friends.value = []
  } finally {
    friendsLoading.value = false
  }
}
function goFriend(id) {
  friendsOpen.value = false
  router.push('/profile/' + id)
}

const abilities = ref([])

onMounted(async () => {
  try {
    user.value = (await api.get(`/api/user-profile/${route.params.id}`)).data
  } catch (e) {
    loadError.value = e.response?.data?.message || '프로필을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
  await loadFriendStatus()
  // 많이 쓴 능력 (없어도 화면은 그대로)
  if (user.value) {
    abilities.value = (await GET('/api/rules/top-played-abilities/{userId}', { path: { userId: user.value.id } }).catch(() => ({ data: [] }))).data
  }
  // 경기 결과를 보내고 넘어온 경우(?id=경기) 그 경기를 보여준다
  if (highlightId.value) {
    await nextTick()
    gameRefs[highlightId.value]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => (highlightId.value = null), 2000)
  }
})
</script>
