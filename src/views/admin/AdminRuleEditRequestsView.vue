<template>
  <div>
    <UiTopBar title="규칙 수정 요청" back="/admin" />

    <main class="px-4 pt-4 pb-12 max-w-xl mx-auto">
      <UiTabs v-model="selectedTab" :options="tabs" class="mb-4" @update:model-value="loadRequests" />

      <UiListSkeleton v-if="loading" :rows="3" shape="tile" />
      <UiCard v-else-if="!requests.length">
        <UiEmptyState icon="fas fa-inbox" :title="`${STATUS[selectedTab].label} 요청이 없어요`" />
      </UiCard>

      <ul v-else class="space-y-2">
        <li v-for="req in requests" :key="req.id">
          <UiCard
            interactive
            class="space-y-3"
            :class="{ 'border-primary': highlightedRequestId === req.id }"
            @click="selectedRequest = req"
          >
            <div class="flex items-start gap-2">
              <div class="flex-1 min-w-0">
                <p class="t-heading truncate">{{ req.ruleTitle || '제목 없음' }}</p>
                <p class="t-caption mt-0.5">{{ req.requestedBy?.nickname || '알 수 없음' }} · {{ timeAgo(req.createdAt) }}</p>
              </div>
              <UiBadge :tone="STATUS[req.status]?.tone">{{ STATUS[req.status]?.label }}</UiBadge>
            </div>
            <p class="t-caption">{{ [req.majorCategory, req.minorCategory].filter(Boolean).join(' · ') }}</p>

            <p v-if="req.status === 'REJECTED' && req.rejectionReason" class="text-sm text-danger-fg">거절 이유: {{ req.rejectionReason }}</p>
            <p v-if="req.status !== 'PENDING' && req.reviewedBy" class="t-micro">
              {{ req.reviewedBy.nickname }} · {{ timeAgo(req.reviewedAt) }}
            </p>

            <div v-if="req.status === 'PENDING'" class="flex gap-2">
              <UiButton variant="secondary" size="sm" class="flex-1" @click.stop="openReject(req)">거절</UiButton>
              <UiButton variant="secondary" size="sm" class="flex-1" @click.stop="approve(req)">승인</UiButton>
            </div>
          </UiCard>
        </li>
      </ul>
    </main>

    <!-- 원래 규칙과 바꾼 내용 비교 -->
    <RuleComparisonModal
      v-if="selectedRequest"
      :request="selectedRequest"
      @close="selectedRequest = null"
      @approve="(id) => handle(id, 'approve')"
      @reject="(id, reason) => handle(id, 'reject', reason)"
    />

    <!-- 거절 이유 -->
    <UiSheet v-model="rejectOpen" title="거절 이유">
      <p class="t-caption mb-3">요청한 사람에게 그대로 보여요.</p>
      <UiInput v-model="rejectionReason" multiline :rows="4" placeholder="예: 기존 규칙과 내용이 같아요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!rejectionReason.trim()" :loading="processing" @click="confirmReject">거절</UiButton>
      </template>
    </UiSheet>
  </div>
</template>

<script setup>
// 규칙 수정 요청: 상태별 목록 → 눌러서 원래 규칙과 비교 → 승인·거절
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../api/api'
import RuleComparisonModal from '../../components/admin/RuleComparisonModal.vue'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composable/useToast'
import { timeAgo } from '../../utils/format'
import {
  UiBadge, UiButton, UiCard, UiEmptyState, UiInput, UiListSkeleton, UiSheet, UiTabs, UiTopBar,
} from '../../components/ui'

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()

const STATUS = {
  PENDING: { label: '승인 대기', tone: 'primary' },
  APPROVED: { label: '승인', tone: 'success' },
  REJECTED: { label: '거절', tone: 'danger' },
}

const loading = ref(true)
const selectedTab = ref(STATUS[route.query.status] ? route.query.status : 'PENDING')
const requests = ref([])
const highlightedRequestId = ref(route.query.highlight ? Number(route.query.highlight) : null)
const selectedRequest = ref(null)
const rejectOpen = ref(false)
const rejectTarget = ref(null)
const rejectionReason = ref('')
const processing = ref(false)

const tabs = computed(() =>
  Object.entries(STATUS).map(([value, s]) => ({
    value,
    label: s.label,
    count: value === selectedTab.value && requests.value.length ? requests.value.length : undefined,
  })),
)

async function loadRequests() {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/rules/edit-requests', { params: { status: selectedTab.value } })
    requests.value = Array.isArray(data) ? data : []
  } catch {
    showToast('관리자만 볼 수 있어요')
    router.replace('/admin')
  } finally {
    loading.value = false
  }
}

async function approve(req) {
  const ok = await confirmDialog({
    title: '수정 요청을 승인할까요?',
    message: '승인하면 바로 원래 규칙에 반영돼요.',
    confirmText: '승인',
  })
  if (ok) await handle(req.id, 'approve')
}

function openReject(req) {
  rejectTarget.value = req
  rejectionReason.value = ''
  rejectOpen.value = true
}

async function confirmReject() {
  await handle(rejectTarget.value.id, 'reject', rejectionReason.value.trim())
  rejectOpen.value = false
}

async function handle(id, action, reason) {
  processing.value = true
  try {
    if (action === 'approve') await api.post(`/api/admin/rules/edit-requests/${id}/approve`)
    else await api.post(`/api/admin/rules/edit-requests/${id}/reject`, { rejectionReason: reason })
    showToast(action === 'approve' ? '승인했어요' : '거절했어요')
    selectedRequest.value = null
    loadRequests()
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요. 다시 해 주세요')
  } finally {
    processing.value = false
  }
}

onMounted(loadRequests)
watch(
  () => route.query.highlight,
  (h) => (highlightedRequestId.value = h ? Number(h) : null),
)
</script>
