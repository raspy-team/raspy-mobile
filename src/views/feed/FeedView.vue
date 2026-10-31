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
          <UiButton variant="secondary" @click="tab = 'all'">전체 보기</UiButton>
          <UiButton @click="inviteFriends">친구 초대</UiButton>
        </div>
      </UiEmptyState>

      <UiEmptyState v-else-if="!visible.length" class="pt-16" icon="fas fa-flag-checkered" title="아직 끝난 경기가 없어요" description="경기를 마치면 결과가 여기 올라와요">
        <UiButton to="/">열린 경기 보기</UiButton>
      </UiEmptyState>

      <div v-else class="ui-appear">
        <FeedCard
          v-for="p in visible"
          :key="p.id"
          :post="p"
          :highlight="String(p.id) === String(focusId)"
          :data-game="p.id"
          @profile="(id) => id && router.push('/profile/' + id)"
          @rule="router.push(`/rules/${p.rule.id}`)"
          @like="toggleLike(p)"
          @comment="commentId = Number(p.id)"
          @play="router.push(`/create-game?ruleId=${p.rule.id}`)"
          @more="menuPost = p"
        />
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

    <Comment v-if="commentId" :id="commentId" @close="commentId = 0" />
  </div>
</template>

<script setup>
// 피드: 끝난 경기를 카드로 훑어본다 (예전의 한 장씩 넘기는 릴스 방식 대신)
// - 친구 / 전체. 서버가 친구 경기를 앞에 주므로 '친구'는 받은 것에서 고른다
// - ?gameId= 링크·알림으로 온 경기는 맨 위에 강조, ?userId= 는 그 사람의 경기만
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import FeedCard from '../../components/feed/FeedCard.vue'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import {
  UiButton, UiChip, UiEmptyState, UiInput, UiList, UiListItem, UiPullIndicator, UiSheet, UiSkeleton, UiSpinner, UiTabs, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { usePullToRefresh } from '../../composables/usePullToRefresh'
import { copyText } from '../../utils/clipboard'
import Comment from '../GameCommentView.vue'

const TABS = [
  { value: 'friends', label: '친구' },
  { value: 'all', label: '전체' },
]
const REPORT_REASONS = ['욕설·비방', '거짓 경기', '부적절한 사진', '기타']
const PAGE = 20

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const userId = route.query.userId ? Number(route.query.userId) : null
const focusId = route.query.gameId || null
const userName = ref('')
const tab = ref(route.query.tab === 'friends' ? 'friends' : 'all')
const posts = ref([])
const page = ref(0)
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
const finished = (list) => list.filter((p) => p.type === 'game' && p.isCompleted)
const visible = computed(() => (tab.value === 'friends' && !userId ? posts.value.filter((p) => p.isFriend || p.isMyGame) : posts.value))

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
      const { data } = await api.get('/api/feed', { params: { page: page.value, size: PAGE } })
      const before = visible.value.length
      addPosts(data.items || [])
      page.value++
      done.value = data.nextCursor == null || !(data.items || []).length
      // '친구' 탭에서 이번 장에 친구 경기가 하나도 없으면 더 받아도 없다 (서버가 친구 경기를 앞에 준다)
      if (tab.value === 'friends' && visible.value.length === before && page.value > 1) done.value = true
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
  router.replace({ query: { ...route.query, tab: t === 'friends' ? 'friends' : undefined } })
  if (t === 'all' && !done.value && visible.value.length < 5) loadMore()
  if (t === 'friends') done.value = false
})

async function toggleLike(p) {
  const was = p.isLiked
  p.isLiked = !was
  p.likeCount = (p.likeCount || 0) + (was ? -1 : 1)
  if (!was && navigator.vibrate) navigator.vibrate(10)
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
