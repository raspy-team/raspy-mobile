<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar v-if="userId" :title="userName ? `${userName}님의 경기` : '경기 기록'" back />
    <UiTopBar v-else title="소식" back="/">
      <template #right><InboxButtons /></template>
    </UiTopBar>

    <main class="max-w-xl mx-auto px-4 pb-32">
      <UiPullIndicator :pull="pull" :refreshing="refreshing" />

      <UiTabs v-if="!userId" v-model="tab" :options="TABS" class="mt-3 mb-2" />

      <!-- 처음 불러오는 중: 카드 모양 그대로 -->
      <div v-if="loading && !posts.length" role="status" aria-label="소식 불러오는 중">
        <div v-for="n in 3" :key="n" class="py-5 border-b border-line">
          <div class="flex items-center gap-3">
            <UiSkeleton class="w-8 h-8 rounded-full" />
            <UiSkeleton class="h-4 w-40" />
          </div>
          <UiSkeleton class="h-28 w-full mt-3 rounded-2xl" />
          <UiSkeleton class="h-4 w-24 mt-4" />
        </div>
      </div>

      <UiEmptyState v-else-if="error && !posts.length" class="pt-16" icon="fas fa-triangle-exclamation" title="소식을 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="reload">다시 시도</UiButton>
      </UiEmptyState>

      <UiEmptyState
        v-else-if="!visible.length && tab === 'friends' && !userId"
        class="pt-16"
        mascot="tong"
        title="친구의 경기가 아직 없어요"
        description="함께 겨룬 사람에게 친구를 걸거나, 친구를 초대해 보세요"
      >
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="tab = 'near'">동네 보기</UiButton>
          <UiButton @click="inviteFriends">친구 초대</UiButton>
        </div>
      </UiEmptyState>

      <!-- 남의 경기 기록(?userId)을 보러 온 사람에게 '경기 찾기'는 엉뚱하다 (경로 6 리뷰 P13) -->
      <UiEmptyState v-else-if="!visible.length" class="pt-16" mascot="tong" title="아직 끝난 경기가 없어요">
        <UiButton v-if="!userId" to="/">경기 찾기</UiButton>
      </UiEmptyState>

      <div v-else class="ui-appear">
        <template v-for="p in visible" :key="p.id">
        <p v-if="p.id === firstElsewhere && tab === 'near'" class="t-caption pt-6 pb-1 flex items-center gap-2" role="separator">
          <UiIcon name="location-dot" aria-hidden="true" />우리 동네 경기가 아직 적어서 다른 동네 경기도 보여요
        </p>
        <!-- 지금 하는 경기: 중계로 -->
        <RouterLink v-if="p.live" :to="`/live/${p.id}`" class="flex items-center gap-3 py-4 border-b border-line" :data-game="p.id">
          <UiBadge tone="signal" class="flex-shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-signal-on motion-safe:animate-pulse" aria-hidden="true"></span>LIVE</UiBadge>
          <span class="flex-1 min-w-0">
            <span class="block t-heading truncate">{{ p.players.map((x) => x.name).join(' vs ') }}</span>
            <span class="block t-caption truncate">{{ p.rule?.ruleTitle }}{{ p.meta?.place ? ` · ${p.meta.place}` : '' }}</span>
          </span>
          <span class="t-caption flex items-center gap-1 flex-shrink-0">보러 가기<UiIcon name="chevron-right" aria-hidden="true" /></span>
        </RouterLink>
        <!-- AI 보스가 앱 게임 전국 자리를 되찾았다 (docs/ai-residents.md 3). 누르면 그 게임 (챔피언 카드에서 다시 도전) -->
        <RouterLink v-else-if="p.type === 'boss_back'" :to="p.rule?.appGameKey ? `/play/${p.rule.appGameKey}` : `/rules/${p.rule?.id}`" class="flex items-center gap-3 py-4 border-b border-line" :data-game="p.id">
          <span class="w-10 h-10 rounded-full bg-signal-soft text-signal-fg flex items-center justify-center flex-shrink-0" aria-hidden="true"><UiIcon name="crown" /></span>
          <span class="flex-1 min-w-0">
            <span class="flex items-center t-heading min-w-0"><span class="truncate">{{ p.players[0]?.name }}</span><UiAiBadge /></span>
            <span class="block t-caption mt-0.5 break-keep">{{ p.caption }}</span>
          </span>
          <span class="t-caption flex items-center gap-1 flex-shrink-0">한 판<UiIcon name="chevron-right" aria-hidden="true" /></span>
        </RouterLink>
        <AppDuelFeedCard
          v-else-if="p.appDuel"
          :post="p"
          :highlight="String(p.id) === String(focusId)"
          :data-game="p.id"
          @profile="(id) => id && router.push('/profile/' + id)"
          @like="toggleLike(p)"
          @comment="commentId = Number(p.id)"
          @share="share(p)"
          @play="openDuel(p)"
          :my-id="myId"
          @watch="(t) => pick(p, 'watch', t)"
          @challenge="(t) => pick(p, 'challenge', t)"
        />
        <FeedCard
          v-else
          :post="p"
          :highlight="String(p.id) === String(focusId)"
          :data-game="p.id"
          @profile="(id) => id && router.push('/profile/' + id)"
          @rule="router.push(`/rules/${p.rule.id}`)"
          @like="toggleLike(p)"
          @comment="commentId = Number(p.id)"
          @share="share(p)"
          :my-id="myId"
          @watch="(t) => pick(p, 'watch', t)"
          @challenge="(t) => pick(p, 'challenge', t)"
          @more="menuPost = p"
        />
        </template>
        <!-- 끝에 닿으면 다음 장 -->
        <div ref="sentinel" class="h-16 flex items-center justify-center">
          <UiSpinner v-if="loading" class="text-fg-subtle" />
          <!-- 둘째 장부터 실패하면 아무 말 없이 멈췄다: 끝인지 망가졌는지 몰랐다 (목적 판정 6) -->
          <p v-else-if="error && posts.length" class="t-caption">더 불러오지 못했어요 · <button class="hit underline" @click="loadMore">다시 시도</button></p>
          <p v-else-if="done" class="t-micro">모두 봤어요</p>
        </div>
      </div>
    </main>

    <!-- 더보기 -->
    <UiSheet :model-value="!!menuPost" @update:model-value="menuPost = null">
      <UiList>
        <UiListItem icon="fas fa-flag-checkered" title="경기 결과 보기" chevron @click="go(`/games/${menuPost.id}/result`)" />
        <UiListItem v-if="menuPost?.rule?.id" icon="rotate-right" title="이 규칙으로 경기 만들기" subtitle="같은 규칙으로 사람을 모아요" chevron @click="go(`/create-game?ruleId=${menuPost.rule.id}`)" />
        <UiListItem v-if="!menuPost?.isMyGame" icon="far fa-flag" title="신고" danger @click="openReport(menuPost)" />
      </UiList>
    </UiSheet>

    <!-- 또 보고 싶어요 · 도전해요: 대상이 여럿이면 고른다 -->
    <UiSheet :model-value="!!picking" :title="picking?.kind === 'watch' ? '누구의 다음 경기를 알림으로 받을까요?' : '누구에게 도전할까요?'" @update:model-value="picking = null">
      <UiList>
        <UiListItem
          v-for="t in picking?.targets || []"
          :key="t.id"
          :title="t.name"
          :subtitle="picking?.kind === 'watch' && picking.post.watching?.includes(t.id) ? '알림 받는 중' : ''"
          chevron
          @click="act(picking.post, picking.kind, t)"
        />
      </UiList>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet :model-value="!!reportPost" title="이 경기를 신고할까요?" @update:model-value="reportPost = null">
      <p class="t-caption mb-4">어떤 문제인지 알려 주시면 <strong class="text-fg">운영진이 바로 확인하고 처리해요.</strong></p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어 주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고</UiButton>
      </template>
    </UiSheet>

    <ShareSheet v-if="sharePost" :post="sharePost" :my-id="myId" @close="sharePost = null" />

    <Comment v-if="commentId" :id="commentId" @close="commentId = 0" />
  </div>
</template>

<script setup>
import { inviteFriend } from '@/utils/inviteFriend'
// 피드: 끝난 경기를 카드로 훑어본다 (예전의 한 장씩 넘기는 릴스 방식 대신)
// - 동네(기본) / 친구 / 전국. 서버가 범위·순서를 정한다 (FeedService.getFeed). 동네 글이 적으면 아래에 '다른 동네' 줄
// - ?gameId= 링크·알림으로 온 경기는 맨 위에 강조, ?userId= 는 그 사람의 경기만
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, defineAsyncComponent } from 'vue'
import { feel } from '../../utils/feel'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import FeedCard from '../../components/feed/FeedCard.vue'
import AppDuelFeedCard from '../../components/feed/AppDuelFeedCard.vue'
// 공유 시트(스토리 그림 찍기 포함, 압축 100KB 넘음)는 처음 열 때 받는다. 화면을 열 때마다 받아 첫 화면을 늦췄다 (11/11 몸과 시간)
const ShareSheet = defineAsyncComponent(() => import('../../components/feed/story/ShareSheet.vue'))
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import {
  UiAiBadge, UiBadge, UiButton, UiChip, UiEmptyState, UiIcon, UiInput, UiList, UiListItem, UiPullIndicator, UiSheet, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composables/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { shareLink } from '../../utils/share'
import Comment from '../GameCommentView.vue'
import { DELETE, POST } from '@/api/client'
import { playWithMeTooAPI } from '../../api/api'
import { getMyId } from '@/utils/me'
import { track } from '@/utils/trackLog'

// 동네(기본): 내 동네 범위 먼저, 동네 글이 적으면 서버가 다른 동네 글을 아래에 채운다 (elsewhere). 친구: 친구·내 경기. 전국: 전부
const TABS = [
  { value: 'near', label: '동네' },
  { value: 'friends', label: '친구' },
  { value: 'all', label: '전국' },
]
const REPORT_REASONS = ['욕설·비방', '거짓 경기', '부적절한 사진', '기타']
const PAGE = 20

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const userId = route.query.userId ? Number(route.query.userId) : null
const focusId = route.query.gameId || null
const userName = ref('')
// 주소에 탭이 없으면 마지막으로 본 탭 (열 때마다 '동네'로 돌아가 다시 골랐다, 11/11 쌓이는 피로 전수표)
const lastTab = (() => { try { return localStorage.getItem('feed_tab') } catch { return null } })()
const tab = ref(['friends', 'all'].includes(route.query.tab) ? route.query.tab : ['near', 'friends', 'all'].includes(lastTab) ? lastTab : 'near')
watch(tab, (t) => { try { localStorage.setItem('feed_tab', t) } catch { /* 못 남기면 다음에 '동네'부터 */ } })
const posts = ref([])
const page = ref(0)
// 첫 장이 매긴 기준 시각. 다음 장도 같은 기준으로 받아야 순서가 흔들리지 않는다
const asOf = ref('')
const done = ref(false)
const loading = ref(false)
const error = ref(false)
const sentinel = ref(null)
const commentId = ref(0)
const menuPost = ref(null)
const reportPost = ref(null)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)

// 끝난 경기만 (열린 경기는 홈에서 본다)
// 끝난 오프라인 경기 + 앱 대결(끝난 것·투표 중인 것). 열린(예정) 경기는 홈에서 본다
// 지금 하는 경기(LIVE)는 끝나지 않았어도 보여 준다 → 중계(/live)로
const finished = (list) => list.filter((p) => p.live || (p.type === 'game' && p.isCompleted) || p.type === 'app_duel' || p.type === 'app_vote' || p.type === 'boss_back')
const visible = computed(() => posts.value)
// 다른 동네 글이 시작되는 곳에 줄을 긋는다
const firstElsewhere = computed(() => posts.value.find((p) => p.elsewhere)?.id)

function addPosts(list) {
  const seen = new Set(posts.value.map((p) => String(p.id)))
  posts.value.push(...finished(list).filter((p) => !seen.has(String(p.id))))
}

async function loadMore() {
  if (loading.value || done.value) return
  loading.value = true
  error.value = false
  try {
    if (userId) {
      const { data } = await api.get(`/api/feed/user/${userId}/completed`)
      addPosts(data.items || [])
      userName.value = posts.value[0]?.players?.find((p) => p.id === userId)?.name || ''
      done.value = true
    } else {
      const { data } = await api.get('/api/feed', { params: { page: page.value, size: PAGE, scope: tab.value, asOf: asOf.value || undefined } })
      if (page.value === 0) asOf.value = data.asOf || ''
      addPosts(data.items || [])
      // AI 카드가 채운 장은 원본 기록에 ai=true로 (docs/ai-residents.md '숫자는 따로': AI가 채운 곳에서 사람이 무엇을 했나)
      const aiCards = (data.items || []).filter((p) => p.players?.length && p.players.every((x) => x.isBot)).length
      if (aiCards) track('feed_ai_shown', { step: page.value, value: `ai=true:${tab.value}:${aiCards}/${(data.items || []).length}` })
      page.value++
      done.value = data.nextCursor == null || !(data.items || []).length
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

async function reload() {
  posts.value = []
  page.value = 0
  asOf.value = ''
  done.value = false
  await loadFocus()
  await loadMore()
}
const { pull, refreshing } = usePullToRefresh(reload)

// 링크·알림으로 온 경기: 맨 위에 두고 보여준다
async function loadFocus() {
  if (!focusId) return
  try {
    const { data } = await api.get(`/api/feed/game/${focusId}`)
    addPosts([data])
  } catch {
    showToast('그 경기를 찾지 못했어요')
  }
}

// 탭은 주소에만 적어 둔다(새로 고침해도 그 탭). router.replace로 query를 바꾸면 화면 key(App.vue)가 바뀌어
// 통째로 새로 그려지고(맨 위로) 목록을 두 번 불렀다 (가로 훑기 1절)
watch(tab, (t) => {
  const url = router.resolve({ query: { ...route.query, tab: t === 'near' ? undefined : t } }).fullPath
  window.history.replaceState({ ...window.history.state, current: url }, '', url)
  reload()
})

// 사진 남기기는 닿을 수 없는 길이라 지웠다 (카드가 신호를 보내지 않았다, 목적 판정 6 경로 제거)

// 또 보고 싶어요 · 도전해요 (카드의 선수 중 나·봇을 뺀 사람에게)
const picking = ref(null)
function pick(post, kind, targets) {
  if (targets.length === 1) act(post, kind, targets[0])
  else picking.value = { post, kind, targets }
}
async function act(post, kind, target) {
  picking.value = null
  if (kind === 'watch') return toggleWatch(post, target)
  // 앱 게임: 같은 게임을 먼저 하고 그 사람에게 도전장을 보낸다 (신뢰 사다리와 같은 길)
  if (post.appDuel) return router.push({ path: `/play/${post.appDuel.key}`, query: { to: target.id, toName: target.name, from: 'feed' } })
  // 만나서·화상 경기: 같은 규칙으로 '나랑도해' (메시지로 이어진다. 만남 안전 검사는 서버가 한다)
  try {
    await playWithMeTooAPI.sendRequest(target.id, post.rule.id)
    feel('tap')
    showToast(`${target.name}님에게 도전했어요. 받으면 메시지로 이어져요`)
  } catch (e) {
    showToast(e.response?.data?.message || '도전을 보내지 못했어요')
  }
}
async function toggleWatch(post, target) {
  const on = !(post.watching || []).includes(target.id)
  post.watching = on ? [...(post.watching || []), target.id] : (post.watching || []).filter((id) => id !== target.id)
  try {
    if (on) await POST('/api/watch/{userId}', { path: { userId: target.id } })
    else await DELETE('/api/watch/{userId}', { path: { userId: target.id } })
    // 같은 사람이 나오는 다른 카드도 맞춘다
    posts.value.forEach((p) => {
      if (p === post || !(p.players || []).some((x) => x.id === target.id)) return
      p.watching = on ? [...new Set([...(p.watching || []), target.id])] : (p.watching || []).filter((id) => id !== target.id)
    })
    if (on) {
      feel('tap')
      showToast(`${target.name}님 경기가 시작되면 알림함에 와요`)
    }
  } catch (e) {
    post.watching = !on ? [...(post.watching || []), target.id] : (post.watching || []).filter((id) => id !== target.id)
    showToast(e.response?.data?.message || '반영하지 못했어요')
  }
}

async function toggleLike(p) {
  const was = p.isLiked
  p.isLiked = !was
  p.likeCount = (p.likeCount || 0) + (was ? -1 : 1)
  if (!was) feel('tap')
  try {
    const { data } = await api.post(`/api/games/${p.id}/like`)
    p.isLiked = data.isLiked
    p.likeCount = data.totalCount
  } catch {
    p.isLiked = was
    p.likeCount = (p.likeCount || 0) + (was ? 1 : -1)
    showToast('반영하지 못했어요. 잠시 뒤 다시 해 주세요')
  }
}

function go(path) {
  menuPost.value = null
  router.push(path)
}
// 공유(카드의 댓글 옆 아이콘): 그림 미리보기 + 인스타 스토리·카톡·링크 (components/feed/story/ShareSheet)
const sharePost = ref(null)
const myId = ref(null)

// 앱 게임 소식 카드를 누르면: 내가 낀 대결이면 그 대결 결과로(?duel=), 아니면 그 게임으로 (3-5 P6 나머지: 누르면 게임 첫 화면이었다)
function openDuel(p) {
  const mine = myId.value != null && (p.players || []).some((pl) => String(pl.id) === String(myId.value))
  router.push(mine ? { path: `/play/${p.appDuel.key}`, query: { duel: p.appDuel.gameId } } : `/play/${p.appDuel.key}`)
}
getMyId().then((id) => (myId.value = id)).catch(() => {})
function share(p) {
  menuPost.value = null
  sharePost.value = p
}
// 친구 초대: 첫 주소로 보내면 받은 친구가 무엇에 초대받았는지 모른 채 가입 화면을 만났다. 가입 없이 바로 되는 한 판으로 (경로 6 리뷰 P3)
async function inviteFriends() {
  await inviteFriend('feed_invite')
}
function openReport(p) {
  menuPost.value = null
  reportReason.value = ''
  reportDetail.value = ''
  reportPost.value = p
}
async function submitReport() {
  reporting.value = true
  try {
    const reason = reportReason.value === '기타' ? reportDetail.value.trim() : reportReason.value
    const { data: done } = await api.post('/api/reports', { targetType: 'GAME', targetId: Number(reportPost.value.id), reason })
    showToast(done?.message || '신고가 접수됐어요. 운영진이 바로 확인하고 처리해요')
    reportPost.value = null
  } catch (e) {
    // 연결이 끊겨도 '이미 신고했다'고 해 신고가 된 줄 알았다 (목적 판정 6)
    showToast(e.response?.data?.message || '신고하지 못했어요. 다시 해 주세요')
    // 연결 오류면 고른 사유·쓴 글을 버리지 않고 시트를 연 채로 둔다 (경로 6 리뷰 P7)
    if (e.response?.data?.message) reportPost.value = null
  } finally {
    reporting.value = false
  }
}

let observer = null
onMounted(async () => {
  await reload()
  await nextTick()
  if (focusId) document.querySelector(`[data-game="${focusId}"]`)?.scrollIntoView({ block: 'center' })
  observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { rootMargin: '600px' })
  watch(sentinel, (el, old) => {
    if (old) observer.unobserve(old)
    if (el) observer.observe(el)
  }, { immediate: true })
})
onBeforeUnmount(() => observer?.disconnect())
</script>
