<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar back>
      <!-- 규칙을 못 불러왔을 때는 공유·더보기를 숨긴다: 눌러도 아무 일이 없거나 '이미 신고한 규칙'이라는 거짓 문구가 떴다 (목적 판정 6) -->
      <template v-if="rule" #right>
        <UiIconButton icon="fas fa-arrow-up-from-bracket" label="공유" @click="share" />
        <UiIconButton icon="fas fa-ellipsis" label="더보기" @click="menuOpen = true" />
      </template>
    </UiTopBar>

    <main v-if="loading" class="max-w-2xl mx-auto px-4 pt-2 space-y-4">
      <UiSkeleton class="h-16 w-16 rounded-xl" />
      <UiSkeleton class="h-7 w-2/3" />
      <UiSkeleton class="h-4 w-1/3" />
      <UiSkeleton class="h-20 w-full" />
    </main>

    <!-- 연결 오류를 '지워졌거나 주소가 잘못됐어요'로 보이면 친구가 보낸 링크가 지워진 줄 안다 (목적 판정 6) -->
    <main v-else-if="!rule && loadFailed" class="max-w-2xl mx-auto px-4 pt-10">
      <UiEmptyState icon="fas fa-wifi" title="규칙을 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 시도</UiButton>
      </UiEmptyState>
    </main>

    <main v-else-if="!rule" class="max-w-2xl mx-auto px-4 pt-10">
      <UiEmptyState icon="fas fa-circle-question" title="규칙을 찾을 수 없어요" description="지워졌거나 주소가 잘못됐어요">
        <UiButton to="/rules">다른 규칙 보기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else class="max-w-2xl mx-auto px-4 pt-2 pb-32">
      <!-- 그림 · 이름 (대표 사진이 없어 큰 빈 상자 대신 한 줄로) -->
      <div class="flex items-center gap-4 mt-2">
        <RuleThumb :rule="rule" :size="64" />
        <div class="min-w-0">
          <h1 class="t-title">{{ rule.ruleTitle }}</h1>
          <p class="t-caption mt-1">{{ subtitle }}</p>
        </div>
      </div>

      <!-- 숫자는 상자 없이 한 줄, 있는 것만 (빈 값을 '–'로 보이지 않는다, 11/3) -->
      <p v-if="rule.playCount || rating" class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 t-body text-fg-muted">
        <span v-if="rating" class="inline-flex items-center gap-1 text-fg"><UiIcon name="fas fa-star" class="text-sm" aria-hidden="true" />{{ rating }}<span class="text-fg-muted">({{ rule.ratingCount }})</span></span>
        <span v-if="rule.playCount">경기 <b class="text-fg tabular-nums">{{ rule.playCount }}</b>번</span>
      </p>

      <!-- 만든 사람 -->
      <button type="button" class="w-full flex items-center gap-3 py-5 mt-2 border-b border-line text-left" @click="router.push('/profile/' + rule.createdBy.id)">
        <UiAvatar :src="rule.createdBy.profile?.profilePicture" :name="rule.createdBy.nickname" :user-id="rule.createdBy.id" size="md" />
        <span class="flex-1 min-w-0">
          <span class="block t-heading truncate">{{ rule.createdBy.nickname }}님이 만들었어요</span>
          <span v-if="rule.lastPlayedAt" class="block t-caption mt-0.5">마지막 경기 {{ timeAgo(rule.lastPlayedAt) }}</span>
        </span>
        <UiIcon name="fas fa-chevron-right" class="text-fg-subtle text-sm" aria-hidden="true" />
      </button>

      <!-- 롤·피파 같은 다른 게임 안에서 하는 규칙이면 어느 게임인지와 내 아이디 (9번) -->
      <ExtGameCard v-if="rule.extGame" :game="rule.extGame" :label="rule.extGameLabel" class="border-b border-line" />

      <!-- 챔피언: 내가 속한 자리(동네·소속·전국)마다 한 줄 -->
      <ChampionSeatsCard :rule-id="rule.id" :app-game-key="rule.appGameKey" class="border-b border-line" />

      <!-- 카테고리 (분류한 규칙만) -->
      <RuleCategory v-if="rule.category" :category="rule.category" />

      <!-- 규칙 내용 -->
      <div class="pt-8">
        <h2 class="t-heading mb-4">규칙</h2>
        <RuleBody :rule="rule" />
      </div>

      <!-- 수정 제안·신고는 더보기(…) 안에만 둔다. 규칙을 보러 온 사람의 눈 둘 곳만 늘렸다 (목적 판정 6) -->
    </main>

    <!-- 아래 고정: 요약 + 경기 열기 -->
    <div v-if="rule" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="t-heading truncate">{{ winSummary(rule) }}</p>
          <p class="t-micro truncate">{{ rule.playCount ? `${rule.playCount}번 겨뤘어요` : aiGames ? `AI 주민과 ${aiGames}판 했어요` : '첫 경기를 열어 보세요' }}</p>
        </div>
        <UiButton v-if="rule.appGameKey" size="lg" :to="`/play/${rule.appGameKey}`">한 판 하기</UiButton>
        <UiButton v-else size="lg" :to="`/create-game?ruleId=${rule.id}`">경기 만들기</UiButton>
      </div>
    </div>

    <!-- 더보기 -->
    <UiSheet v-model="menuOpen">
      <UiList>
        <UiListItem v-if="isMine" icon="fas fa-pen" title="내 규칙 고치기" subtitle="관리자가 확인한 뒤 바뀌어요" @click="goEdit" />
        <!-- '수정 제안'(남의 규칙)과 '수정 요청'(내 규칙)이 이름이 거의 같아 하는 일이 헷갈렸다 (경로 6 리뷰): 하는 일로 부른다 -->
        <UiListItem v-if="!isMine" icon="far fa-comment" title="만든 사람에게 고칠 점 보내기" subtitle="메시지로 가요" @click="openSuggest" />
        <UiListItem v-if="!isMine" icon="far fa-flag" title="신고" danger @click="openReport" />
      </UiList>
    </UiSheet>

    <!-- 수정 제안: 만든 사람에게 DM으로 -->
    <UiSheet v-model="suggestOpen" title="만든 사람에게 고칠 점 보내기">
      <p class="t-caption mb-4">{{ rule?.createdBy?.nickname || '만든 사람' }}님에게 메시지로 보내요</p>
      <UiInput v-model="suggestText" multiline :rows="4" :maxlength="1000" placeholder="예: 3세트는 길어요. 2세트 선승으로 바꾸면 어때요?" />
      <template #footer>
        <UiButton block :disabled="suggestText.trim().length < 5" :loading="suggesting" @click="submitSuggest">보내기</UiButton>
      </template>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet v-model="reportOpen" title="이 규칙을 신고할까요?">
      <p class="t-caption mb-4">어떤 문제인지 알려 주시면 <strong class="text-fg">운영진이 바로 확인하고 처리해요.</strong></p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어 주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고</UiButton>
      </template>
    </UiSheet>
  </div>
</template>

<script setup>
// 규칙 상세 (/rules/:ruleId): 그림 → 이름 → 숫자 → 만든 사람·챔피언 → 규칙 → 랭킹. 주 행동은 아래 '경기 열기' 하나
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { POST } from '@/api/client'
import { getMyId } from '@/utils/me'
import RuleBody from '../../components/rule/RuleBody.vue'
import {
  UiAvatar, UiButton, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem, UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { useToast } from '../../composables/useToast'
import { shareLink } from '../../utils/share'
import { timeAgo } from '../../utils/format'
import { ratingText, ruleKind, winSummary } from '../../utils/rule'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import RuleCategory from '../../components/rule/RuleCategory.vue'
import ChampionSeatsCard from '../../components/champion/ChampionSeatsCard.vue'
import ExtGameCard from '../../components/external/ExtGameCard.vue'

const REPORT_REASONS = ['욕설·비방', '위험한 규칙', '광고·스팸', '기타']

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const rule = ref(null)
const loading = ref(true)
const myId = ref(null)
const aiGames = ref(0) // AI 주민과 둔 판 수 (앱 게임)
const menuOpen = ref(false)
const reportOpen = ref(false)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)
const suggestOpen = ref(false)
const suggestText = ref('')
const suggesting = ref(false)

const rating = computed(() => (rule.value ? ratingText(rule.value) : ''))
const subtitle = computed(() => ruleKind(rule.value, true))
const isMine = computed(() => rule.value?.createdBy?.id === myId.value)

async function share() {
  menuOpen.value = false
  const url = `${window.location.origin}/rules/${rule.value.id}`
  const msg = await shareLink(url, '', { title: rule.value.ruleTitle })
  if (msg) showToast(msg)
}
function goEdit() {
  menuOpen.value = false
  router.push(`/rules/edit/${rule.value.id}`)
}
function openSuggest() {
  menuOpen.value = false
  suggestText.value = ''
  suggestOpen.value = true
}
async function submitSuggest() {
  suggesting.value = true
  try {
    const { data } = await POST('/api/rules/{ruleId}/suggestions', { path: { ruleId: rule.value.id }, body: { message: suggestText.value.trim() } })
    suggestOpen.value = false
    showToast(`${data.targetNickname}님에게 메시지로 보냈어요`)
  } catch (e) {
    showToast(e.response?.data?.message || '보내지 못했어요. 다시 해 주세요')
  } finally {
    suggesting.value = false
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
    const { data: done } = await api.post('/api/reports', { targetType: 'RULE', targetId: rule.value.id, reason })
    showToast(done?.message || '신고가 접수됐어요. 운영진이 바로 확인하고 처리해요')
    reportOpen.value = false
  } catch (e) {
    // 연결이 끊겨도 '이미 신고했다'고 해 신고가 된 줄 알았다 (목적 판정 6)
    showToast(e.response?.data?.message || '신고하지 못했어요. 다시 해 주세요')
    // 연결 오류면 고른 사유·쓴 글을 버리지 않고 시트를 연 채로 둔다 (경로 6 리뷰 P7)
    if (e.response?.data?.message) reportOpen.value = false
  } finally {
    reporting.value = false
  }
}

const loadFailed = ref(false)
async function load() {
  loading.value = true
  loadFailed.value = false
  const id = route.params.ruleId
  const [ruleRes, meRes, rankRes] = await Promise.allSettled([
    api.get(`/api/rules/${id}`),
    getMyId(),
    api.get(`/api/rules/${id}/rankings`),
  ])
  if (ruleRes.status === 'fulfilled') rule.value = ruleRes.value.data
  // 서버가 답을 못 준 것(연결·서버 오류)과 없는 규칙을 가른다
  else loadFailed.value = !ruleRes.reason?.response || ruleRes.reason.response.status >= 500
  if (meRes.status === 'fulfilled') myId.value = meRes.value
  if (rankRes.status === 'fulfilled') {
    // 순위는 뺐다(11/13). AI 주민과 둔 판 수만 아래 줄에 쓴다
    aiGames.value = rankRes.value.data.aiGames || 0
  }
  loading.value = false
}
onMounted(load)
</script>
