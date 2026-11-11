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
    <!-- 'n명 신청'을 누른 주최자는 받으러 왔다: 받는 곳(내 경기)으로 (경로 8 P5) -->
    <template v-if="challengers?.ownerId === myId && challengers?.challengers?.length" #footer>
      <UiButton block @click="emit('update:challengers', null); router.push({ path: '/game', query: { id: challengers.id } })">내 경기에서 받기</UiButton>
    </template>
  </UiSheet>

  <!-- 더보기 -->
  <UiSheet :model-value="!!menu" @update:model-value="emit('update:menu', null)">
    <UiList>
      <UiListItem icon="far fa-comment" title="댓글" @click="openComments(menu)" />
      <UiListItem v-if="menu?.ownerId !== myId" icon="far fa-paper-plane" title="주최자에게 메시지" @click="router.push('/chat/' + menu.ownerId)" />
      <UiListItem icon="fas fa-arrow-up-from-bracket" title="공유하기" subtitle="링크를 보내요" @click="share(menu)" />
      <UiListItem v-if="menu?.ownerId !== myId" icon="far fa-flag" title="신고하기" danger @click="openReport(menu)" />
    </UiList>
  </UiSheet>

  <!-- 신고: 공용 신고 시트 (실패하면 열린 채로 쓴 글을 지킨다, 경로 8 P4·가로 훑기 10) -->
  <ReportSheet
    :model-value="!!reportGame"
    title="이 경기를 신고할까요?"
    target-type="GAME"
    :target-id="reportGame?.id"
    :reasons="REPORT_REASONS"
    @update:model-value="(v) => !v && (reportGame = null)"
  />
</template>

<script setup>
// 열린 경기 카드(OpenGameCard)의 '신청자'와 '더보기'(댓글·메시지·공유·신고). 홈 목록과 공유 링크 화면(/games/:id)이 함께 쓴다
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { UiAvatar, UiButton, UiEmptyState, UiList, UiListItem, UiSheet } from '../ui'
import ReportSheet from '../safety/ReportSheet.vue'
import { useToast } from '../../composables/useToast'
import { ratingLine } from '../../utils/format'
import { shareGameInvite } from '../../utils/share'

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

async function share(game) {
  emit('update:menu', null)
  const msg = await shareGameInvite(game.id, `'${game.rule?.ruleTitle ?? '경기'}' 같이 한 판 해요`)
  if (msg) showToast(msg)
}

// 시트를 닫고 바로 다음 시트를 열면 닫은 시트의 기록 칸이 남아 뒤로를 두 번 눌러야 했다: 칸이 걷힌 뒤 연다 (가로 훑기 2)
function afterSheetClosed(cb) {
  let done = false
  const go = () => {
    if (done) return
    done = true
    window.removeEventListener('popstate', go)
    cb()
  }
  window.addEventListener('popstate', go)
  setTimeout(go, 300)
}
function openReport(game) {
  emit('update:menu', null)
  afterSheetClosed(() => (reportGame.value = game))
}

function openComments(game) {
  emit('update:menu', null)
  afterSheetClosed(() => emit('comments', game.id))
}
</script>
