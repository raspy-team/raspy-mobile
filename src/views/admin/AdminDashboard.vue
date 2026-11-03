<template>
  <div>
    <UiTopBar title="관리자" back="/settings" />

    <main class="px-4 pt-4 pb-12 max-w-xl mx-auto space-y-8">
      <!-- 신고: 처리할 일이 가장 먼저 -->
      <UiSection title="신고">
        <UiTabs v-model="reportTab" :options="reportTabs" class="mb-3" />

        <UiListSkeleton v-if="loading" :rows="3" />
        <UiCard v-else-if="!shownReports.length">
          <UiEmptyState
            icon="fas fa-flag"
            :title="reportTab === 'open' ? '처리할 신고가 없어요' : '들어온 신고가 없어요'"
          />
        </UiCard>
        <ul v-else class="space-y-2">
          <li v-for="r in shownReports" :key="r.id">
            <UiCard class="space-y-3">
              <div class="flex items-center gap-2 flex-wrap">
                <UiBadge :tone="r.handledAt ? 'neutral' : 'danger'">{{ TYPE_LABEL[r.targetType] }}</UiBadge>
                <UiBadge v-if="r.sameTargetCount > 1" tone="neutral">신고 {{ r.sameTargetCount }}건</UiBadge>
                <span class="t-micro ml-auto">{{ timeAgo(r.reportedAt) }}</span>
              </div>
              <div class="min-w-0">
                <p class="t-body text-fg break-words">{{ r.targetLabel || '지워진 대상이에요' }}</p>
                <p class="t-caption mt-1 break-words">"{{ r.reason }}" · {{ r.reporterNickname }}님</p>
                <p v-if="r.accusedNickname" class="t-caption mt-1">
                  신고당한 사람: <strong class="text-fg">{{ r.accusedNickname }}</strong>
                  <UiBadge v-if="r.accusedSuspendedUntil" tone="danger" class="ml-1">{{ untilText(r.accusedSuspendedUntil) }} 정지</UiBadge>
                </p>
              </div>
              <!-- 제재 (안전·신뢰 A): 신고가 부당하면 풀고, 맞으면 늘리거나 영구 정지. 처리 전 신고도 함께 처리된다 -->
              <div v-if="r.accusedId" class="flex gap-2 flex-wrap">
                <UiButton v-if="isRoom(r.context)" variant="secondary" size="sm" icon="far fa-comment" @click="openChat(r.context)">대화 보기</UiButton>
                <UiButton variant="secondary" size="sm" :loading="sanctioningId === r.id" @click="sanction(r, 7)">7일 정지</UiButton>
                <UiButton variant="danger" size="sm" :loading="sanctioningId === r.id" @click="sanction(r, null)">영구 정지</UiButton>
                <UiButton v-if="r.reason === AGE_REPORT" variant="danger" size="sm" :loading="sanctioningId === r.id" @click="sanctionAge(r)">나이 확인까지 멈추기</UiButton>
                <UiButton v-if="r.accusedSuspendedUntil" variant="secondary" size="sm" :loading="sanctioningId === r.id" @click="lift(r)">정지 풀기</UiButton>
              </div>
              <div class="flex gap-2">
                <UiButton v-if="r.targetPath" variant="secondary" size="sm" class="flex-1" :to="r.targetPath">보러 가기</UiButton>
                <UiButton
                  v-if="!r.handledAt"
                  variant="secondary"
                  size="sm"
                  class="flex-1"
                  :loading="resolvingId === r.id"
                  @click="resolve(r)"
                >
                  처리 완료
                </UiButton>
                <span v-else class="t-caption self-center">{{ timeAgo(r.handledAt) }} 처리함</span>
              </div>
            </UiCard>
          </li>
        </ul>
      </UiSection>

      <!-- 노쇼 이의 (안전·신뢰 C): 맞으면 기록을 지우고 처벌을 다시 센다 -->
      <UiSection v-if="appeals.length" :title="`노쇼 이의 ${appeals.length}`">
        <ul class="space-y-2">
          <li v-for="a in appeals" :key="a.id">
            <UiCard class="space-y-2">
              <p class="t-body text-fg">{{ a.accusedNickname }}님 · {{ a.ruleTitle }}</p>
              <p class="t-caption">보고: {{ a.reporterNickname }}님 · {{ timeAgo(a.createdAt) }}</p>
              <p class="t-caption break-words">"{{ a.appeal }}"</p>
              <UiButton size="sm" variant="secondary" :loading="sanctioningId === 'n' + a.id" @click="cancelNoShow(a)">노쇼 기록 지우기</UiButton>
            </UiCard>
          </li>
        </ul>
      </UiSection>

      <UiSheet v-model="chatOpen" title="신고된 대화">
        <UiListSkeleton v-if="!chatLines" :rows="4" />
        <ul v-else class="space-y-2 max-h-[60vh] overflow-auto">
          <li v-for="(l, i) in chatLines" :key="i" class="t-caption">
            <strong class="text-fg">{{ l.sender }}</strong> · {{ timeAgo(l.sentAt) }}<br />{{ l.message }}
          </li>
        </ul>
      </UiSheet>

      <!-- 유입: 홍보 채널별로 와서 → 가입 → 경기 → 다시 왔는지. 로봇·봇 계정·기존 사용자는 뺀다 -->
      <UiSection title="유입">
        <UiTabs v-model="acqDays" :options="acqTabs" class="mb-3" />
        <UiListSkeleton v-if="!acq" :rows="3" />
        <UiCard v-else-if="!acq.rows.length">
          <UiEmptyState icon="fas fa-chart-simple" title="아직 들어온 사람이 없어요" description="홍보 링크에 ?utm_source=instagram 처럼 꼬리표를 달면 채널별로 나눠 셀 수 있어요" />
        </UiCard>
        <UiCard v-else class="!p-0 overflow-x-auto">
          <table class="w-full text-sm tabular-nums">
            <thead>
              <tr class="t-micro text-left">
                <th class="font-normal py-2.5 pl-4 pr-2">채널</th>
                <th v-for="c in ACQ_COLS" :key="c.key" class="font-normal py-2.5 px-2 text-right last:pr-4">{{ c.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in [...acq.rows, acq.total]" :key="row.channel" class="border-t border-line" :class="row === acq.total ? 'font-semibold' : ''">
                <td class="py-2.5 pl-4 pr-2 max-w-[8rem] truncate">{{ row.channel }}</td>
                <td v-for="c in ACQ_COLS" :key="c.key" class="py-2.5 px-2 text-right last:pr-4 whitespace-nowrap">
                  {{ row[c.key] }}<span v-if="c.key !== 'visitors' && row.visitors" class="t-micro ml-1">{{ pct(row[c.key], row.visitors) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </UiCard>
        <p v-if="acq" class="t-micro mt-2">
          {{ acq.since }}부터 처음 온 사람 · 기존 사용자 {{ acq.existingUsers }}명, 로봇 방문 {{ acq.botVisits }}번은 뺐어요
        </p>
      </UiSection>

      <!-- 안전: 만나서 한 경기가 안전했는지 (안전·신뢰 I). 비율은 몇 중 몇인지도 함께 보여 준다 -->
      <UiSection title="안전">
        <UiTabs v-model="safetyDays" :options="acqTabs" class="mb-3" />
        <UiListSkeleton v-if="!safety" :rows="2" />
        <UiCard v-else-if="!safety.meetings">
          <UiEmptyState icon="fas fa-shield-halved" title="아직 만나서 한 경기가 없어요" description="경기 시간이 지난, 만나서 하는 경기부터 셉니다" />
        </UiCard>
        <template v-else>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="t in safetyTiles" :key="t.label" class="rounded-xl bg-surface p-3">
              <p class="t-title tabular-nums" :class="t.warn ? 'text-danger' : 'text-fg'">{{ t.value }}</p>
              <p class="t-caption mt-0.5">{{ t.label }}</p>
              <p class="t-micro tabular-nums">{{ t.detail }}</p>
            </div>
          </div>
          <p class="t-micro mt-2">
            만남 {{ safety.meetings }}번 기준 (경기 시간이 지난 만나서 하는 경기, 노쇼로 취소된 판 포함). 만남이 적으면 비율이 크게 흔들려요
          </p>
        </template>
      </UiSection>

      <!-- 규칙 수정 요청 -->
      <UiSection title="규칙 수정 요청">
        <template #action>
          <UiButton variant="ghost" size="sm" to="/admin/rule-edit-requests">전체 보기</UiButton>
        </template>
        <div class="grid grid-cols-3 gap-2 mb-3">
          <RouterLink
            v-for="s in ruleStats"
            :key="s.status"
            :to="`/admin/rule-edit-requests?status=${s.status}`"
            class="rounded-xl bg-surface p-3 text-center active:bg-surface-2"
          >
            <p class="t-title tabular-nums" :class="s.status === 'PENDING' && s.count ? 'text-primary' : 'text-fg'">{{ s.count }}</p>
            <p class="t-caption mt-0.5">{{ s.label }}</p>
          </RouterLink>
        </div>
        <UiList v-if="recentRequests.length">
          <UiListItem
            v-for="req in recentRequests"
            :key="req.id"
            :title="req.ruleTitle || '제목 없음'"
            :subtitle="`${req.requestedBy?.nickname || '알 수 없음'} · ${timeAgo(req.createdAt)}`"
            :to="`/admin/rule-edit-requests?highlight=${req.id}`"
            chevron
          />
        </UiList>
      </UiSection>

      <!-- 예전 규칙에 카테고리 붙이기: 미리보기로 AI 답을 보고, 괜찮으면 적용 -->
      <UiSection title="규칙 분류">
        <p class="t-caption mb-3">
          카테고리가 없는 규칙 <span class="t-mono">{{ classify.remaining ?? '-' }}</span>개.
          미리보기는 저장하지 않아요. 적용하면 받지 않을 규칙은 지우지 않고 위 신고 목록에 올려요.
        </p>
        <div class="flex gap-2">
          <UiButton size="sm" variant="secondary" :loading="classify.busy === 'preview'" :disabled="!classify.remaining" @click="runClassify(false)">10개 미리보기</UiButton>
          <UiButton size="sm" :loading="classify.busy === 'apply'" :disabled="!classify.remaining" @click="runClassify(true)">10개 적용</UiButton>
        </div>
        <UiList v-if="classify.items.length" class="mt-3">
          <UiListItem
            v-for="it in classify.items"
            :key="it.ruleId"
            :title="it.title"
            :subtitle="it.blocked || it.error || classifyLine(it.category)"
            :to="`/rules/${it.ruleId}`"
            chevron
          >
            <template #trailing>
              <UiBadge :tone="it.blocked || it.error ? 'neutral' : 'primary'">{{ it.blocked ? '거름' : it.error ? '실패' : classify.applied ? '적용' : '미리보기' }}</UiBadge>
            </template>
          </UiListItem>
        </UiList>
        <p v-if="classify.stopped" class="t-caption mt-2">AI 1분 요청 한도에 걸려 여기까지 했어요. 잠시 뒤 다시 눌러 주세요</p>
      </UiSection>

      <!-- 사람 · 도구 -->
      <UiSection title="도구">
        <UiList>
          <UiListItem icon="fas fa-users" title="사용자 찾기" :subtitle="users.length ? `${users.length}명` : ''" chevron @click="openUsers" />
          <UiListItem icon="fas fa-user-plus" title="그룹 계정 만들기" to="/group/register" chevron />
          <UiListItem icon="fas fa-book-open" title="규칙 둘러보기" to="/rules" chevron />
        </UiList>
      </UiSection>
    </main>

    <!-- 사용자 찾기 -->
    <UiSheet v-model="showUsers" title="사용자 찾기">
      <UiInput v-model="userSearch" icon="fas fa-magnifying-glass" placeholder="닉네임이나 아이디" class="mb-3" />
      <UiListSkeleton v-if="loadingUsers" :rows="5" />
      <UiEmptyState v-else-if="!filteredUsers.length" icon="fas fa-user" title="찾는 사람이 없어요" />
      <UiList v-else>
        <UiListItem
          v-for="u in filteredUsers"
          :key="u.id"
          :title="u.nickname"
          :subtitle="'@' + u.username"
          :to="`/profile/${u.id}`"
          chevron
        >
          <template #leading><UiAvatar :src="u.avatar" :name="u.nickname" :user-id="u.id" size="sm" /></template>
        </UiListItem>
      </UiList>
    </UiSheet>
  </div>
</template>

<script setup>
// 관리자: 신고 처리 → 유입 → 안전 → 규칙 수정 요청 → 도구. 권한이 없으면 서버가 403을 주고 홈으로 보낸다
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { GET, POST } from '../../api/client'
import { timeAgo } from '../../utils/format'
import { useToast } from '../../composable/useToast'
import { confirmDialog } from '../../composables/useConfirm'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSection, UiSheet, UiTabs, UiTopBar,
} from '../../components/ui'

const router = useRouter()
const { showToast } = useToast()

const TYPE_LABEL = { USER: '사람', GAME: '경기', RULE: '규칙', COMMENT: '댓글', CHAT_MESSAGE: '메시지' }

const loading = ref(true)
const reports = ref([])
const reportTab = ref('open')
const resolvingId = ref(null)
const openReports = computed(() => reports.value.filter((r) => !r.handledAt))
const reportTabs = computed(() => [
  { value: 'open', label: '처리 전', count: openReports.value.length },
  { value: 'all', label: '전체' },
])
const shownReports = computed(() => (reportTab.value === 'open' ? openReports.value : reports.value))

const ruleStats = ref([
  { status: 'PENDING', label: '승인 대기', count: 0 },
  { status: 'APPROVED', label: '승인', count: 0 },
  { status: 'REJECTED', label: '거절', count: 0 },
])
const recentRequests = ref([])

const ACQ_COLS = [
  { key: 'visitors', label: '방문' },
  { key: 'signups', label: '가입' },
  { key: 'played', label: '경기' },
  { key: 'returned', label: '재방문' },
  { key: 'homescreen', label: '홈 화면' },
]
const acqTabs = [
  { value: 7, label: '7일' },
  { value: 30, label: '30일' },
  { value: 90, label: '90일' },
]
const acqDays = ref(30)
const acq = ref(null)
const pct = (n, total) => `${Math.round((n / total) * 100)}%`

async function loadAcquisition() {
  acq.value = null
  try {
    acq.value = (await GET('/api/admin/acquisition', { query: { days: acqDays.value } })).data
  } catch {
    showToast('유입을 불러오지 못했어요')
  }
}

watch(acqDays, loadAcquisition)

// 안전 숫자: 신고는 만남 100번당, 나머지는 몇 중 몇
const safetyDays = ref(30)
const safety = ref(null)
const ratio = (r) => (r.total ? pct(r.count, r.total) : '-')
const safetyTiles = computed(() => {
  const s = safety.value
  if (!s) return []
  return [
    { label: '신고 (만남 100번당)', value: ((s.reports / s.meetings) * 100).toFixed(1), detail: `신고 ${s.reports}건` },
    { label: '노쇼', value: ratio(s.noShow), detail: `${s.noShow.count} / ${s.noShow.total} 만남`, warn: s.noShow.total >= 10 && s.noShow.count / s.noShow.total >= 0.1 },
    { label: '도착 확인', value: ratio(s.arrived), detail: `${s.arrived.count} / ${s.arrived.total}명` },
    { label: '위치 공유', value: ratio(s.shared), detail: `${s.shared.count} / ${s.shared.total} 만남` },
    { label: '또 만나고 싶다', value: ratio(s.meetAgain), detail: `${s.meetAgain.count} / ${s.meetAgain.total} 답` },
    { label: '같은 상대와 다시', value: ratio(s.rematch), detail: `${s.rematch.count} / ${s.rematch.total}쌍` },
    { label: '첫 만남 공공장소', value: ratio(s.firstPublic), detail: `${s.firstPublic.count} / ${s.firstPublic.total} 첫 만남` },
  ]
})

async function loadSafety() {
  safety.value = null
  try {
    safety.value = (await GET('/api/admin/safety', { query: { days: safetyDays.value } })).data
  } catch {
    showToast('안전 숫자를 불러오지 못했어요')
  }
}

watch(safetyDays, loadSafety)

// 규칙 분류 (카테고리 개편 전 규칙)
const classify = ref({ remaining: null, items: [], applied: false, stopped: false, busy: '' })
async function loadClassifyRemaining() {
  try {
    classify.value.remaining = (await GET('/api/admin/rules/categories/remaining')).data
  } catch {
    classify.value.remaining = null
  }
}
async function runClassify(apply) {
  classify.value.busy = apply ? 'apply' : 'preview'
  try {
    const { data } = await POST('/api/admin/rules/categories/backfill', { query: { apply, limit: 10 } })
    classify.value = { ...classify.value, items: data.items, applied: data.applied, stopped: data.stoppedByLimit, remaining: data.remaining }
    if (apply) load()
  } catch (e) {
    showToast(e.response?.data?.message || '분류하지 못했어요')
  } finally {
    classify.value.busy = ''
  }
}
/** 분류 한 줄: 맞닿는 방식 · 능력 · 성질 · 운 */
function classifyLine(c) {
  if (!c) return '분류 못 함'
  return [c.face.label, c.abilities.map((a) => a.label).join('·'), c.traits.map((t) => t.label).join('·'), c.luck.key === 'NONE' ? '' : `운 ${c.luck.label}`]
    .filter(Boolean)
    .join(' · ')
}

const showUsers = ref(false)
const loadingUsers = ref(false)
const users = ref([])
const userSearch = ref('')
const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) => u.nickname?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
})

async function load() {
  try {
    const [reportRes, ...ruleRes] = await Promise.all([
      GET('/api/admin/reports'),
      ...ruleStats.value.map((s) => api.get('/api/admin/rules/edit-requests', { params: { status: s.status } })),
    ])
    reports.value = reportRes.data
    loadAppeals()
    ruleRes.forEach((res, i) => (ruleStats.value[i].count = Array.isArray(res.data) ? res.data.length : 0))
    recentRequests.value = (Array.isArray(ruleRes[0].data) ? ruleRes[0].data : []).slice(0, 5)
  } catch (e) {
    showToast(e.response?.status === 403 ? '관리자만 볼 수 있어요' : '불러오지 못했어요')
    router.replace('/')
  } finally {
    loading.value = false
  }
}

// 제재 (안전·신뢰 A)
const sanctioningId = ref(null)
const appeals = ref([])
async function loadAppeals() {
  appeals.value = (await GET('/api/admin/no-show/appeals').catch(() => ({ data: [] }))).data || []
}
async function cancelNoShow(a) {
  if (!(await confirmDialog({ title: `${a.accusedNickname}님의 노쇼 기록을 지울까요?`, message: '처벌을 다시 계산해요', confirmText: '지우기' }))) return
  sanctioningId.value = 'n' + a.id
  try {
    await POST('/api/admin/no-show/{reportId}/cancel', { path: { reportId: a.id } })
    await loadAppeals()
    showToast('노쇼 기록을 지웠어요')
  } catch {
    showToast('처리하지 못했어요')
  } finally {
    sanctioningId.value = null
  }
}
const chatOpen = ref(false)
const chatLines = ref(null)
const isRoom = (c) => /^[0-9a-f-]{36}$/i.test(c || '')
function untilText(t) {
  const d = new Date(t)
  return d.getFullYear() >= 9999 ? '영구' : `${d.getMonth() + 1}/${d.getDate()}까지`
}
async function openChat(roomId) {
  chatOpen.value = true
  chatLines.value = null
  try {
    chatLines.value = (await GET('/api/admin/chat/{roomId}', { path: { roomId } })).data
  } catch {
    chatLines.value = []
    showToast('대화를 불러오지 못했어요')
  }
}
async function sanction(report, days) {
  const what = days ? `${days}일 정지` : '영구 정지'
  if (!(await confirmDialog({ title: `${report.accusedNickname}님을 ${what}할까요?`, message: `사유: ${report.reason}. 이 사람의 처리 전 신고도 함께 처리돼요`, confirmText: what, danger: true }))) return
  sanctioningId.value = report.id
  try {
    await POST('/api/admin/users/{userId}/suspend', { path: { userId: report.accusedId }, body: { days, reason: report.reason } })
    reports.value = (await GET('/api/admin/reports')).data
    showToast(`${what}했어요`)
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요')
  } finally {
    sanctioningId.value = null
  }
}
// 만 14세 미만 신고 (안전·신뢰 F, 당근과 같이): 기한 없이 멈추고, 이동통신사 가입확인서를 받으면 '정지 풀기'
const AGE_REPORT = '만 14세 미만 같아요'
async function sanctionAge(report) {
  if (!(await confirmDialog({ title: `${report.accusedNickname}님을 나이 확인까지 멈출까요?`, message: '만 14세 이상임을 보여 주는 서류(이동통신사 가입확인서 등)를 메일로 받으면 풀어 주세요. 당사자에게는 서류를 보낼 곳이 안내돼요', confirmText: '멈추기', danger: true }))) return
  sanctioningId.value = report.id
  try {
    await POST('/api/admin/users/{userId}/suspend', { path: { userId: report.accusedId }, body: { age: true } })
    reports.value = (await GET('/api/admin/reports')).data
    showToast('나이 확인까지 멈췄어요')
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요')
  } finally {
    sanctioningId.value = null
  }
}
async function lift(report) {
  sanctioningId.value = report.id
  try {
    await POST('/api/admin/users/{userId}/unsuspend', { path: { userId: report.accusedId } })
    reports.value = (await GET('/api/admin/reports')).data
    showToast('정지를 풀었어요')
  } catch {
    showToast('처리하지 못했어요')
  } finally {
    sanctioningId.value = null
  }
}

async function resolve(report) {
  resolvingId.value = report.id
  try {
    await POST('/api/admin/reports/{id}/resolve', { path: { id: report.id } })
    const { data } = await GET('/api/admin/reports')
    reports.value = data
  } catch {
    showToast('처리하지 못했어요. 다시 해 주세요')
  } finally {
    resolvingId.value = null
  }
}

async function openUsers() {
  showUsers.value = true
  if (users.value.length) return
  loadingUsers.value = true
  try {
    users.value = (await api.get('/api/admin/users')).data
  } catch {
    showToast('사용자를 불러오지 못했어요')
  } finally {
    loadingUsers.value = false
  }
}

onMounted(() => {
  load()
  loadAcquisition()
  loadSafety()
  loadClassifyRemaining()
})
</script>
