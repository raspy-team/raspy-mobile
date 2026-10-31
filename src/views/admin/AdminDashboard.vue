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
            class="rounded-xl bg-surface border border-line p-3 text-center active:bg-surface-2"
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
          <template #leading><UiAvatar :src="u.avatar" :name="u.nickname" size="sm" /></template>
        </UiListItem>
      </UiList>
    </UiSheet>
  </div>
</template>

<script setup>
// 관리자: 신고 처리 → 규칙 수정 요청 → 도구. 권한이 없으면 서버가 403을 주고 홈으로 보낸다
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { GET, POST } from '../../api/client'
import { timeAgo } from '../../utils/format'
import { useToast } from '../../composable/useToast'
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSection, UiSheet, UiTabs, UiTopBar,
} from '../../components/ui'

const router = useRouter()
const { showToast } = useToast()

const TYPE_LABEL = { USER: '사람', GAME: '경기', RULE: '규칙', COMMENT: '댓글' }

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
    ruleRes.forEach((res, i) => (ruleStats.value[i].count = Array.isArray(res.data) ? res.data.length : 0))
    recentRequests.value = (Array.isArray(ruleRes[0].data) ? ruleRes[0].data : []).slice(0, 5)
  } catch (e) {
    showToast(e.response?.status === 403 ? '관리자만 볼 수 있어요' : '불러오지 못했어요')
    router.replace('/')
  } finally {
    loading.value = false
  }
}

async function resolve(report) {
  resolvingId.value = report.id
  try {
    await POST('/api/admin/reports/{id}/resolve', { path: { id: report.id } })
    const { data } = await GET('/api/admin/reports')
    reports.value = data
  } catch {
    showToast('처리하지 못했어요. 다시 시도해 주세요')
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

onMounted(load)
</script>
