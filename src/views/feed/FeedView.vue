<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar v-if="userId" :title="userName ? `${userName}님의 경기` : '경기 기록'" back />
    <UiTopBar v-else title="피드">
      <template #right><InboxButtons /></template>
    </UiTopBar>

    <main class="max-w-xl mx-auto px-4 pb-32">
      <UiPullIndicator :pull="pull" :refreshing="refreshing" />

      <UiTabs v-if="!userId" v-model="tab" :options="TABS" class="mt-3" />

      <!-- 처음 불러오는 중: 카드 모양 그대로 -->
      <div v-if="loading && !posts.length" role="status" aria-label="피드 불러오는 중">
        <div v-for="n in 3" :key="n" class="py-5 border-b border-line">
          <div class="flex items-center gap-3">
            <UiSkeleton class="w-8 h-8 rounded-full" />
            <UiSkeleton class="h-4 w-40" />
          </div>
          <UiSkeleton class="h-28 w-full mt-3 rounded-2xl" />
          <UiSkeleton class="h-4 w-24 mt-4" />
        </div>
      </div>

      <UiEmptyState v-else-if="error && !posts.length" class="pt-16" icon="fas fa-triangle-exclamation" title="피드를 불러오지 못했어요" description="잠시 뒤 다시 시도해주세요">
        <UiButton variant="secondary" @click="reload">다시 불러오기</UiButton>
      </UiEmptyState>

      <UiEmptyState
        v-else-if="!visible.length && tab === 'friends' && !userId"
        class="pt-16"
        icon="fas fa-user-group"
        title="친구의 경기가 아직 없어요"
        description="함께 겨룬 사람에게 친구를 걸거나, 친구를 초대해보세요"
      >
        <div class="flex gap-2">
          <UiButton variant="secondary" @click="tab = 'near'">동네 보기</UiButton>
          <UiButton @click="inviteFriends">친구 초대</UiButton>
        </div>
      </UiEmptyState>

      <UiEmptyState v-else-if="!visible.length" class="pt-16" icon="fas fa-flag-checkered" title="아직 끝난 경기가 없어요" description="경기를 마치면 결과가 여기 올라와요">
        <UiButton to="/">열린 경기 보기</UiButton>
      </UiEmptyState>

      <div v-else class="ui-appear">
        <template v-for="p in visible" :key="p.id">
        <p v-if="p.id === firstElsewhere && tab === 'near'" class="t-caption pt-6 pb-1 flex items-center gap-2" role="separator">
          <UiIcon name="location-dot" aria-hidden="true" />우리 동네 경기가 아직 적어서 다른 동네 경기도 보여요
        </p>
        <!-- 지금 하는 경기: 중계로 -->
        <RouterLink v-if="p.live" :to="`/live/${p.id}`" class="flex items-center gap-3 py-4 border-b border-line" :data-game="p.id">
          <span class="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-danger text-white text-xs font-bold flex-shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true"></span>LIVE</span>
          <span class="flex-1 min-w-0">
            <span class="block t-heading truncate">{{ p.players.map((x) => x.name).join(' vs ') }}</span>
            <span class="block t-caption truncate">{{ p.rule?.ruleTitle }}{{ p.meta?.place ? ` · ${p.meta.place}` : '' }}</span>
          </span>
          <span class="t-caption flex items-center gap-1 flex-shrink-0">보러 가기<UiIcon name="chevron-right" aria-hidden="true" /></span>
        </RouterLink>
        <AppDuelFeedCard
          v-else-if="p.appDuel"
          :post="p"
          :highlight="String(p.id) === String(focusId)"
          :data-game="p.id"
          @profile="(id) => id && router.push('/profile/' + id)"
          @like="toggleLike(p)"
          @comment="commentId = Number(p.id)"
          @play="router.push(`/play/${p.appDuel.key}`)"
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
          @play="router.push(`/create-game?ruleId=${p.rule.id}`)"
          @more="menuPost = p"
          @photo="pickPhoto(p)"
        />
        </template>
        <!-- 끝에 닿으면 다음 장 -->
        <div ref="sentinel" class="h-16 flex items-center justify-center">
          <UiSpinner v-if="loading" class="text-fg-subtle" />
          <p v-else-if="done" class="t-micro">모두 봤어요</p>
        </div>
      </div>
    </main>

    <!-- 더보기 -->
    <UiSheet :model-value="!!menuPost" @update:model-value="menuPost = null">
      <UiList>
        <UiListItem icon="fas fa-flag-checkered" title="경기 결과 보기" chevron @click="go(`/games/${menuPost.id}/result`)" />
        <UiListItem icon="fas fa-arrow-up-from-bracket" title="공유하기" subtitle="링크를 복사해요" @click="share(menuPost)" />
        <UiListItem v-if="!menuPost?.isMyGame" icon="far fa-flag" title="신고하기" danger @click="openReport(menuPost)" />
      </UiList>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet :model-value="!!reportPost" title="이 경기를 신고할까요?" @update:model-value="reportPost = null">
      <p class="t-caption mb-4">어떤 문제인지 알려주시면 확인 후 조치할게요.</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고하기</UiButton>
      </template>
    </UiSheet>

    <input ref="photoInput" type="file" accept="image/*" capture="environment" class="hidden" @change="uploadPhoto" />
    <Comment v-if="commentId" :id="commentId" @close="commentId = 0" />
  </div>
</template>

<script setup>
// 피드: 끝난 경기를 카드로 훑어본다 (예전의 한 장씩 넘기는 릴스 방식 대신)
// - 동네(기본) / 친구 / 전국. 서버가 범위·순서를 정한다 (FeedService.getFeed). 동네 글이 적으면 아래에 '다른 동네' 줄
// - ?gameId= 링크·알림으로 온 경기는 맨 위에 강조, ?userId= 는 그 사람의 경기만
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { haptic } from '../../utils/haptics'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import FeedCard from '../../components/feed/FeedCard.vue'
import AppDuelFeedCard from '../../components/feed/AppDuelFeedCard.vue'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import {
  UiButton, UiChip, UiEmptyState, UiIcon, UiInput, UiList, UiListItem, UiPullIndicator, UiSheet, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { copyText } from '../../utils/clipboard'
import Comment from '../GameCommentView.vue'

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
const tab = ref(['friends', 'all'].includes(route.query.tab) ? route.query.tab : 'near')
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
const finished = (list) => list.filter((p) => p.live || (p.type === 'game' && p.isCompleted) || p.type === 'app_duel' || p.type === 'app_vote')
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

watch(tab, (t) => {
  router.replace({ query: { ...route.query, tab: t === 'near' ? undefined : t } })
  reload()
})

// 사진 한 장 남기기: 고르거나 찍으면 바로 올리고 카드에 보인다 (서버 피드는 1분 안에 따라온다)
const photoInput = ref(null)
const photoPost = ref(null)
function pickPhoto(p) {
  photoPost.value = p
  photoInput.value?.click()
}
async function uploadPhoto(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  const p = photoPost.value
  if (!file || !p) return
  const form = new FormData()
  form.append('pictures', file)
  try {
    const { data } = await api.post(`/api/games/${p.id}/pictures`, form)
    if (data?.success === false) throw new Error(data.message)
    p.photos = [{ url: URL.createObjectURL(file), mediaType: 'IMAGE' }]
    showToast('사진을 올렸어요')
  } catch (err) {
    showToast(err?.response?.data?.message || err?.message || '사진을 올리지 못했어요')
  }
}

async function toggleLike(p) {
  const was = p.isLiked
  p.isLiked = !was
  p.likeCount = (p.likeCount || 0) + (was ? -1 : 1)
  if (!was) haptic('tap')
  try {
    const { data } = await api.post(`/api/games/${p.id}/like`)
    p.isLiked = data.isLiked
    p.likeCount = data.totalCount
  } catch {
    p.isLiked = was
    p.likeCount = (p.likeCount || 0) + (was ? 1 : -1)
    showToast('반영하지 못했어요. 잠시 뒤 다시 시도해주세요')
  }
}

function go(path) {
  menuPost.value = null
  router.push(path)
}
async function share(p) {
  menuPost.value = null
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: p.id } })
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Match', text: `${p.rule?.ruleTitle} 경기 결과`, url: data.url })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    showToast((await copyText(data.url)) ? '링크를 복사했어요' : '복사하지 못했어요')
  } catch {
    showToast('링크를 만들지 못했어요')
  }
}
async function inviteFriends() {
  const url = window.location.origin
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Match', text: '같이 한 판 할래요? Match에서 경기를 잡아요', url })
      return
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
  }
  showToast((await copyText(url)) ? '초대 링크를 복사했어요' : '복사하지 못했어요')
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
    await api.post('/api/reports', { targetType: 'GAME', targetId: Number(reportPost.value.id), reason })
    showToast('신고를 접수했어요. 확인 후 조치할게요')
  } catch (e) {
    showToast(e.response?.data?.message || '이미 신고한 경기예요')
  } finally {
    reporting.value = false
    reportPost.value = null
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
