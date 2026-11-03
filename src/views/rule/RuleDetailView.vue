<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar back>
      <template #right>
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
      <p v-if="rule.playCount || rating || myRank" class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 t-body text-fg-muted">
        <span v-if="rating" class="inline-flex items-center gap-1 text-fg"><UiIcon name="fas fa-star" class="text-sm" aria-hidden="true" />{{ rating }}<span class="text-fg-muted">({{ rule.ratingCount }})</span></span>
        <span v-if="rule.playCount">경기 <b class="text-fg tabular-nums">{{ rule.playCount }}</b>번</span>
        <button v-if="myRank" type="button" class="inline-flex items-center gap-1 py-2.5 -my-2.5" @click="router.push(`/rules/${rule.id}/ranking`)">
          {{ rankingArea ? '동네' : '내' }} 순위 <b class="text-fg tabular-nums">{{ myRank }}위</b><UiIcon name="chevron-right" class="text-xs" aria-hidden="true" />
        </button>
        <button v-else-if="rule.playCount" type="button" class="inline-flex items-center gap-1 underline underline-offset-2 py-2.5 -my-2.5" @click="router.push(`/rules/${rule.id}/ranking`)">순위 보기</button>
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

      <!-- 챔피언 (동네) -->
      <div class="flex items-center gap-3 py-5 border-b border-line">
        <span class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" :class="rule.currentChampion ? 'bg-signal-soft text-signal-fg' : 'bg-surface-2 text-fg-subtle'" aria-hidden="true">
          <UiIcon name="fas fa-crown" />
        </span>
        <span class="flex-1 min-w-0">
          <!-- 챔피언 자리는 동네마다 (보는 사람의 지금 동네) -->
          <span class="block t-heading truncate">{{ rule.currentChampion ? `${area}챔피언 ${rule.currentChampion.nickname}` : `${area || '이 규칙에 '}아직 챔피언이 없어요` }}</span>
          <span class="block t-caption mt-0.5">{{ rule.currentChampion ? '챔피언을 이기면 자리를 가져와요' : rule.championAreaName ? `${rule.championAreaName}에서 이 규칙으로 처음 경기를 열면 챔피언이 돼요` : '동네를 인증하면 내 동네 챔피언 자리가 보여요' }}</span>
        </span>
      </div>

      <!-- 카테고리 (분류한 규칙만) -->
      <RuleCategory v-if="rule.category" :category="rule.category" />

      <!-- 규칙 내용 -->
      <div class="pt-8">
        <h2 class="t-heading mb-4">규칙</h2>
        <RuleBody :rule="rule" />
      </div>

      <!-- 랭킹 미리보기 -->
      <section v-if="top.length" class="mt-10 pt-8 border-t border-line">
        <h2 class="t-heading mb-3">{{ rankingArea ? `${rankingArea} 랭킹` : '랭킹' }}</h2>
        <UiList>
          <UiListItem
            v-for="r in top"
            :key="r.userId"
            :title="r.userName"
            :subtitle="`${r.rating}점 · 경기 ${r.playCount}번`"
            @click="router.push('/profile/' + r.userId)"
          >
            <template #leading>
              <span class="w-6 text-center t-heading tabular-nums">{{ r.rank }}</span>
              <UiAvatar :src="r.userAvatar" :name="r.userName" :user-id="r.userId" size="sm" />
            </template>
          </UiListItem>
        </UiList>
        <UiButton block variant="secondary" class="mt-4" :to="`/rules/${rule.id}/ranking`">랭킹 전체 보기</UiButton>
      </section>

      <div v-if="!isMine" class="mt-10 flex items-center gap-5">
        <button type="button" class="flex items-center gap-2 t-caption underline underline-offset-2" @click="openSuggest">
          <UiIcon name="far fa-comment" aria-hidden="true" /> 수정 제안하기
        </button>
        <button type="button" class="flex items-center gap-2 t-caption underline underline-offset-2" @click="openReport">
          <UiIcon name="far fa-flag" aria-hidden="true" /> 이 규칙 신고하기
        </button>
      </div>
    </main>

    <!-- 아래 고정: 요약 + 경기 열기 -->
    <div v-if="rule" class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
      <div class="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <div class="flex-1 min-w-0">
          <p class="t-heading truncate">{{ winSummary(rule) }}</p>
          <p class="t-micro truncate">{{ rule.playCount ? `${rule.playCount}번 겨뤘어요` : '첫 경기를 열어보세요' }}</p>
        </div>
        <UiButton v-if="rule.appGameKey" size="lg" :to="`/play/${rule.appGameKey}`">한 판 하기</UiButton>
        <UiButton v-else size="lg" :to="`/create-game?ruleId=${rule.id}`">경기 열기</UiButton>
      </div>
    </div>

    <!-- 더보기 -->
    <UiSheet v-model="menuOpen">
      <UiList>
        <UiListItem icon="fas fa-arrow-up-from-bracket" title="공유하기" subtitle="링크를 복사해요" @click="share" />
        <UiListItem v-if="isMine" icon="fas fa-pen" title="수정 요청하기" subtitle="관리자가 확인한 뒤 바뀌어요" @click="goEdit" />
        <UiListItem icon="fas fa-ranking-star" title="랭킹 보기" @click="goRanking" />
        <UiListItem v-if="!isMine" icon="far fa-comment" title="수정 제안하기" subtitle="만든 사람에게 DM으로 보내요" @click="openSuggest" />
        <UiListItem v-if="!isMine" icon="far fa-flag" title="신고하기" danger @click="openReport" />
      </UiList>
    </UiSheet>

    <!-- 수정 제안: 만든 사람에게 DM으로 -->
    <UiSheet v-model="suggestOpen" title="수정 제안하기">
      <p class="t-caption mb-4">{{ rule?.createdBy?.nickname || '만든 사람' }}님에게 DM으로 보내요. 답이 오면 메시지에서 이어서 이야기할 수 있어요.</p>
      <UiInput v-model="suggestText" multiline :rows="4" :maxlength="1000" placeholder="예: 3세트는 길어요. 2세트 선승으로 바꾸면 어때요?" />
      <template #footer>
        <UiButton block :disabled="suggestText.trim().length < 5" :loading="suggesting" @click="submitSuggest">보내기</UiButton>
      </template>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet v-model="reportOpen" title="이 규칙을 신고할까요?">
      <p class="t-caption mb-4">어떤 문제인지 알려 주시면 확인하고 처리할게요.</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어 주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고하기</UiButton>
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
import { useToast } from '../../composable/useToast'
import { copyText } from '../../utils/clipboard'
import { timeAgo } from '../../utils/format'
import { ratingText, ruleKind, winSummary } from '../../utils/rule'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import RuleCategory from '../../components/rule/RuleCategory.vue'

const REPORT_REASONS = ['욕설·비방', '위험한 규칙', '광고·스팸', '기타']

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const rule = ref(null)
const loading = ref(true)
const myId = ref(null)
const top = ref([])
const myRank = ref(null)
const rankingArea = ref('') // 동네 순위면 '합정동 근처'
const area = computed(() => (rule.value?.championAreaName ? `${rule.value.championAreaName} ` : ''))
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
  if (navigator.share) {
    try {
      await navigator.share({ title: rule.value.ruleTitle, url })
      return
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
  }
  showToast((await copyText(url)) ? '링크를 복사했어요' : '복사하지 못했어요')
}
function goEdit() {
  menuOpen.value = false
  router.push(`/rules/edit/${rule.value.id}`)
}
function goRanking() {
  menuOpen.value = false
  router.push(`/rules/${rule.value.id}/ranking`)
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
    showToast(`${data.targetNickname}님에게 DM으로 보냈어요`)
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
    await api.post('/api/reports', { targetType: 'RULE', targetId: rule.value.id, reason })
    showToast('신고를 접수했어요. 확인하고 처리할게요')
  } catch (e) {
    showToast(e.response?.data?.message || '이미 신고한 규칙이에요')
  } finally {
    reporting.value = false
    reportOpen.value = false
  }
}

onMounted(async () => {
  const id = route.params.ruleId
  const [ruleRes, meRes, rankRes] = await Promise.allSettled([
    api.get(`/api/rules/${id}`),
    getMyId(),
    api.get(`/api/rules/${id}/rankings`),
  ])
  if (ruleRes.status === 'fulfilled') rule.value = ruleRes.value.data
  if (meRes.status === 'fulfilled') myId.value = meRes.value
  if (rankRes.status === 'fulfilled') {
    top.value = (rankRes.value.data.rankings || []).slice(0, 3)
    myRank.value = rankRes.value.data.currentUserRanking?.rank || null
    rankingArea.value = rankRes.value.data.scope === 'dong' ? rankRes.value.data.areaName : ''
  }
  loading.value = false
})
</script>
