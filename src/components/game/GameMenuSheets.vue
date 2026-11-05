<template>
  <!-- 신청자 -->
  <UiSheet :model-value="!!challengers" :title="`신청자 ${challengers?.challengers?.length || 0}명`" @update:model-value="emit('update:challengers', null)">
    <UiList v-if="challengers?.challengers?.length">
      <UiListItem
        v-for="c in challengers.challengers"
        :key="c.userId"
        :title="c.applicantNickname"
        :subtitle="ratingLine(c.applicantGameStatisticsDTO) || '첫 경기를 앞두고 있어요'"
        chevron
        @click="router.push('/profile/' + c.userId)"
      >
        <template #leading><UiAvatar :src="c.applicantProfileUrl" :name="c.applicantNickname" :user-id="c.userId" size="sm" /></template>
      </UiListItem>
    </UiList>
    <UiEmptyState v-else mascot="match" title="아직 신청한 사람이 없어요" />
  </UiSheet>

  <!-- 더보기 -->
  <UiSheet :model-value="!!menu" @update:model-value="emit('update:menu', null)">
    <UiList>
      <UiListItem icon="far fa-comment" title="댓글" @click="openComments(menu)" />
      <UiListItem v-if="menu?.ownerId !== myId" icon="far fa-paper-plane" title="주최자에게 메시지" @click="router.push('/chat/' + menu.ownerId)" />
      <UiListItem icon="fas fa-arrow-up-from-bracket" title="공유하기" subtitle="링크를 복사해요" @click="share(menu)" />
      <UiListItem v-if="menu?.ownerId !== myId" icon="far fa-flag" title="신고하기" danger @click="openReport(menu)" />
    </UiList>
  </UiSheet>

  <!-- 신고 -->
  <UiSheet :model-value="!!reportGame" title="이 경기를 신고할까요?" @update:model-value="reportGame = null">
    <p class="t-caption mb-4">어떤 문제인지 알려 주시면 <strong class="text-fg">운영진이 바로 확인하고 처리해요.</strong></p>
    <div class="flex flex-wrap gap-2 mb-4">
      <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
    </div>
    <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어 주세요" />
    <template #footer>
      <UiButton
        block
        variant="danger"
        :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())"
        :loading="reporting"
        @click="submitReport"
      >신고</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 열린 경기 카드(OpenGameCard)의 '신청자'와 '더보기'(댓글·메시지·공유·신고). 홈 목록과 공유 링크 화면(/games/:id)이 함께 쓴다
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { UiAvatar, UiButton, UiChip, UiEmptyState, UiInput, UiList, UiListItem, UiSheet } from '../ui'
import { useToast } from '../../composable/useToast'
import { ratingLine } from '../../utils/format'
import { shareLink } from '../../utils/share'

defineProps({
  menu: { type: Object, default: null },
  challengers: { type: Object, default: null },
  myId: { type: Number, default: null },
})
const emit = defineEmits(['update:menu', 'update:challengers', 'comments'])

const REPORT_REASONS = ['욕설·비방', '거짓 경기', '광고·스팸', '기타']
const router = useRouter()
const { showToast } = useToast()
const reportGame = ref(null)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)

async function share(game) {
  emit('update:menu', null)
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: game.id } })
    const msg = await shareLink(data.url, `'${game.rule?.ruleTitle ?? '경기'}' 같이 한 판 해요`)
    if (msg) showToast(msg)
  } catch {
    showToast('링크를 만들지 못했어요')
  }
}

function openReport(game) {
  emit('update:menu', null)
  reportReason.value = ''
  reportDetail.value = ''
  reportGame.value = game
}

async function submitReport() {
  reporting.value = true
  try {
    const reason = reportReason.value === '기타' ? reportDetail.value.trim() : reportReason.value
    const { data: done } = await api.post('/api/reports', { targetType: 'GAME', targetId: reportGame.value.id, reason })
    showToast(done?.message || '신고가 접수됐어요. 운영진이 바로 확인하고 처리해요')
  } catch (e) {
    showToast(e.response?.data?.message || '이미 신고한 경기예요')
  } finally {
    reporting.value = false
    reportGame.value = null
  }
}

function openComments(game) {
  emit('update:menu', null)
  emit('comments', game.id)
}
</script>
