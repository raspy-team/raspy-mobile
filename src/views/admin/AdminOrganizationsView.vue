<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="소속 인증" back="/admin" />

    <main class="px-4 pt-4 pb-16 max-w-xl mx-auto space-y-8">
      <UiSection title="신청">
        <UiTabs v-model="tab" :options="tabs" class="mb-3" />
        <UiListSkeleton v-if="loading" :rows="3" />
        <UiCard v-else-if="!requests.length">
          <UiEmptyState mascot="match" mood="smile" :title="tab === 'PENDING' ? '확인할 신청이 없어요' : '처리한 신청이 없어요'" />
        </UiCard>
        <ul v-else class="space-y-2">
          <li v-for="r in requests" :key="r.id">
            <UiCard class="space-y-3">
              <div class="flex items-center gap-2 flex-wrap">
                <UiBadge tone="neutral">{{ TYPE_LABEL[r.type] }}</UiBadge>
                <UiBadge v-if="!r.orgId && r.status === 'PENDING'" tone="neutral">새 이름</UiBadge>
                <UiBadge v-if="r.status !== 'PENDING'" :tone="r.status === 'APPROVED' ? 'neutral' : 'danger'">{{ STATUS_LABEL[r.status] }}</UiBadge>
                <span class="t-micro ml-auto">{{ timeAgo(r.decidedAt || r.createdAt) }}</span>
              </div>
              <div class="min-w-0">
                <p class="t-body text-fg break-words">{{ r.name }}</p>
                <p class="t-caption mt-1">
                  <RouterLink :to="`/profile/${r.userId}`" class="underline">{{ r.nickname }}</RouterLink> @{{ r.username }}
                  · 소속 {{ r.memberships }}개
                </p>
                <p v-if="r.rejectReason" class="t-caption mt-1">"{{ r.rejectReason }}"</p>
              </div>
              <div v-if="r.status === 'PENDING'" class="flex gap-2 flex-wrap">
                <UiButton variant="secondary" size="sm" icon="file-lines" :disabled="!r.hasFile" :loading="fileLoadingId === r.id" @click="viewFile(r)">
                  서류 보기<span v-if="r.fileBytes" class="ml-1 text-fg-subtle">{{ sizeText(r.fileBytes) }}</span>
                </UiButton>
                <UiButton size="sm" @click="openApprove(r)">승인</UiButton>
                <UiButton variant="danger" size="sm" @click="openReject(r)">거절</UiButton>
              </div>
            </UiCard>
          </li>
        </ul>
        <p class="t-micro mt-3">볼 것: 조직 이름, 발급일 3개월 안, 재학·재직 상태. 승인·거절하면 서류는 바로 지워져요.</p>
      </UiSection>

      <UiSection title="조직">
        <UiInput v-model="orgQuery" placeholder="이름으로 찾기" icon="magnifying-glass" @update:model-value="loadOrgs" />
        <UiList v-if="orgList.length" class="mt-3">
          <UiListItem
            v-for="o in orgList"
            :key="o.id"
            icon="building"
            :title="o.name"
            :subtitle="`${TYPE_LABEL[o.type]} · 회원 ${o.members}명`"
            chevron
            @click="openOrg(o)"
          />
        </UiList>
        <p v-else class="t-caption mt-3">조직이 없어요.</p>
      </UiSection>
    </main>

    <!-- 서류 -->
    <UiSheet :model-value="!!fileView" title="서류" @update:model-value="closeFile">
      <template v-if="fileView">
        <img v-if="fileView.type.startsWith('image/')" :src="fileView.url" alt="소속 확인 서류" class="w-full rounded-xl" />
        <iframe v-else :src="fileView.url" title="소속 확인 서류" class="w-full h-[70vh] rounded-xl bg-surface-2"></iframe>
        <UiButton variant="ghost" size="sm" class="mt-2" @click="openInNewTab">새 창으로 열기</UiButton>
      </template>
    </UiSheet>

    <!-- 승인: 기존 조직에 붙이거나 새로 만든다 -->
    <UiSheet :model-value="!!approving" title="승인" @update:model-value="approving = null">
      <div v-if="approving" class="space-y-4">
        <p class="t-caption">{{ approving.nickname }}님 · 신청한 이름 "{{ approving.name }}"</p>
        <UiInput v-model="approveName" label="조직 이름" maxlength="60" @update:model-value="searchApprove" />
        <UiList v-if="approveMatches.length">
          <UiListItem
            v-for="o in approveMatches"
            :key="o.id"
            icon="building"
            :title="o.name"
            :subtitle="`${TYPE_LABEL[o.type]} · 회원 ${o.members}명`"
            @click="approveOrgId = approveOrgId === o.id ? null : o.id"
          >
            <template #trailing><UiIcon v-if="approveOrgId === o.id" name="check" class="text-lg" /></template>
          </UiListItem>
        </UiList>
        <div v-if="!approveOrgId">
          <p class="t-caption mb-2">새 조직으로 만들어요. 종류</p>
          <div class="flex gap-2">
            <UiChip v-for="t in TYPE_ORDER" :key="t" :selected="approveType === t" @click="approveType = t">{{ TYPE_LABEL[t] }}</UiChip>
          </div>
        </div>
        <UiButton block :loading="acting" :disabled="!approveOrgId && approveName.trim().length < 2" @click="approve">
          {{ approveOrgId ? '이 조직에 붙이기' : '새 조직으로 승인' }}
        </UiButton>
      </div>
    </UiSheet>

    <!-- 거절 -->
    <UiSheet :model-value="!!rejecting" title="거절" @update:model-value="rejecting = null">
      <div v-if="rejecting" class="space-y-4">
        <p class="t-caption">사유는 {{ rejecting.nickname }}님에게 알림으로 가요.</p>
        <div class="flex gap-2 flex-wrap">
          <UiChip v-for="reason in REJECT_REASONS" :key="reason" :selected="rejectReason === reason" @click="rejectReason = reason">{{ reason }}</UiChip>
        </div>
        <UiInput v-model="rejectReason" label="사유" maxlength="200" />
        <UiButton block variant="danger" :loading="acting" :disabled="!rejectReason.trim()" @click="reject">거절하기</UiButton>
      </div>
    </UiSheet>

    <!-- 조직 고치기·합치기 -->
    <UiSheet :model-value="!!editing" :title="editing?.name" @update:model-value="editing = null">
      <div v-if="editing" class="space-y-4">
        <UiInput v-model="editName" label="이름" maxlength="60" />
        <div class="flex gap-2">
          <UiChip v-for="t in TYPE_ORDER" :key="t" :selected="editType === t" @click="editType = t">{{ TYPE_LABEL[t] }}</UiChip>
        </div>
        <UiButton block :loading="acting" :disabled="editName.trim().length < 2" @click="rename">저장</UiButton>

        <div class="pt-2">
          <p class="t-label text-fg mb-1">다른 조직으로 합치기</p>
          <p class="t-caption mb-2">이 조직 회원을 고른 조직으로 옮기고, 이 조직은 지워요. ('서울대' → '서울대학교')</p>
          <UiInput v-model="mergeQuery" placeholder="합칠 조직 이름" @update:model-value="searchMerge" />
          <UiList v-if="mergeMatches.length" class="mt-2">
            <UiListItem
              v-for="o in mergeMatches"
              :key="o.id"
              :title="o.name"
              :subtitle="`회원 ${o.members}명`"
              @click="merge(o)"
            />
          </UiList>
        </div>
      </div>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 관리자 > 소속 인증 (docs/organizations.md 2절): 대기 목록 → 서류 보기 → 승인(조직 고르기/만들기)·거절(사유).
// 같은 조직이 둘로 갈리면 조직 목록에서 합친다. 권한이 없으면 서버가 403을 준다
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import { GET, POST, PUT } from '../../api/client'
import type { components } from '../../api/schema'
import { refreshOnChange } from '../../websocket/userChannel'
import { timeAgo } from '../../utils/format'
import { useToast } from '../../composable/useToast'
import { confirmDialog } from '../../composables/useConfirm'
import {
  UiBadge, UiButton, UiCard, UiChip, UiEmptyState, UiIcon, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSection, UiSheet, UiTabs, UiTopBar,
} from '../../components/ui'

type AdminRequest = components['schemas']['AdminOrgRequest']
type AdminOrg = components['schemas']['AdminOrg']
type OrgType = AdminOrg['type']

const TYPE_LABEL: Record<OrgType, string> = { UNIVERSITY: '대학교', COMPANY: '회사', OTHER: '기타' }
const TYPE_ORDER: OrgType[] = ['UNIVERSITY', 'COMPANY', 'OTHER']
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '거절', CANCELED: '취소' }
const REJECT_REASONS = [
  '중고등학교는 받지 않아요',
  '서류에서 조직 이름이 보이지 않아요',
  '3개월이 지난 서류예요',
  '재학·재직 상태를 알 수 없어요',
  '파일을 읽을 수 없어요',
]

const router = useRouter()
const { showToast } = useToast()
const tab = ref<'PENDING' | 'DONE'>('PENDING')
const tabs = ref([{ value: 'PENDING', label: '대기', count: 0 }, { value: 'DONE', label: '처리함' }])
const requests = ref<AdminRequest[]>([])
const loading = ref(true)
const acting = ref(false)

async function load() {
  try {
    const status = tab.value === 'PENDING' ? 'PENDING' : 'APPROVED'
    requests.value = (await GET('/api/admin/organizations/requests', { query: { status } })).data || []
    if (tab.value === 'PENDING') tabs.value[0].count = requests.value.length
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } }).response?.status
    showToast(status === 403 ? '관리자만 볼 수 있어요' : '불러오지 못했어요')
    if (status === 403) router.replace('/')
  } finally {
    loading.value = false
  }
}
watch(tab, () => { loading.value = true; load() })

// 조직 목록
const orgQuery = ref('')
const orgList = ref<AdminOrg[]>([])
async function findOrgs(q: string) {
  return (await GET('/api/admin/organizations', { query: { q } }).catch(() => ({ data: [] }))).data || []
}
let orgTimer: ReturnType<typeof setTimeout> | undefined
function loadOrgs() {
  clearTimeout(orgTimer)
  orgTimer = setTimeout(async () => { orgList.value = await findOrgs(orgQuery.value.trim()) }, 250)
}

// 서류 보기: 관리자 토큰이 필요해 주소를 바로 열 수 없다. 받아서 이 기기에서만 연다
const fileView = ref<{ url: string; type: string } | null>(null)
const fileLoadingId = ref<number | null>(null)
async function viewFile(r: AdminRequest) {
  fileLoadingId.value = r.id
  try {
    const res = await api.get(`/api/admin/organizations/requests/${r.id}/file`, { responseType: 'blob' })
    const blob = res.data as Blob
    fileView.value = { url: URL.createObjectURL(blob), type: blob.type || r.fileType || '' }
  } catch {
    showToast('서류를 열지 못했어요. 이미 처리한 신청일 수 있어요')
  } finally {
    fileLoadingId.value = null
  }
}
function closeFile() {
  if (fileView.value) URL.revokeObjectURL(fileView.value.url)
  fileView.value = null
}
function openInNewTab(e: Event) {
  e.preventDefault()
  if (fileView.value) window.open(fileView.value.url, '_blank', 'noopener')
}

// 승인
const approving = ref<AdminRequest | null>(null)
const approveName = ref('')
const approveType = ref<OrgType>('UNIVERSITY')
const approveOrgId = ref<number | null>(null)
const approveMatches = ref<AdminOrg[]>([])
let approveTimer: ReturnType<typeof setTimeout> | undefined
function searchApprove() {
  clearTimeout(approveTimer)
  approveTimer = setTimeout(async () => {
    const term = approveName.value.trim()
    approveMatches.value = term ? (await findOrgs(term)).slice(0, 6) : []
    if (approveOrgId.value && !approveMatches.value.some((o) => o.id === approveOrgId.value)) approveOrgId.value = null
  }, 250)
}
function openApprove(r: AdminRequest) {
  approving.value = r
  approveName.value = r.name
  approveType.value = r.type
  approveOrgId.value = r.orgId ?? null
  approveMatches.value = []
  searchApprove()
}
async function approve() {
  const r = approving.value
  if (!r) return
  acting.value = true
  try {
    await POST('/api/admin/organizations/requests/{id}/approve', {
      path: { id: r.id },
      body: approveOrgId.value ? { orgId: approveOrgId.value } : { name: approveName.value.trim(), type: approveType.value },
    })
    approving.value = null
    closeFile()
    showToast('승인했어요. 서류는 지웠어요')
    await Promise.all([load(), loadOrgs()])
  } catch (e: unknown) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '승인하지 못했어요')
  } finally {
    acting.value = false
  }
}

// 거절
const rejecting = ref<AdminRequest | null>(null)
const rejectReason = ref('')
function openReject(r: AdminRequest) {
  rejecting.value = r
  rejectReason.value = ''
}
async function reject() {
  const r = rejecting.value
  if (!r) return
  acting.value = true
  try {
    await POST('/api/admin/organizations/requests/{id}/reject', { path: { id: r.id }, body: { reason: rejectReason.value.trim() } })
    rejecting.value = null
    closeFile()
    showToast('거절했어요. 서류는 지웠어요')
    await load()
  } catch (e: unknown) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '거절하지 못했어요')
  } finally {
    acting.value = false
  }
}

// 조직 고치기·합치기
const editing = ref<AdminOrg | null>(null)
const editName = ref('')
const editType = ref<OrgType>('UNIVERSITY')
const mergeQuery = ref('')
const mergeMatches = ref<AdminOrg[]>([])
function openOrg(o: AdminOrg) {
  editing.value = o
  editName.value = o.name
  editType.value = o.type
  mergeQuery.value = ''
  mergeMatches.value = []
}
async function rename() {
  const o = editing.value
  if (!o) return
  acting.value = true
  try {
    await PUT('/api/admin/organizations/{orgId}', { path: { orgId: o.id }, body: { name: editName.value.trim(), type: editType.value } })
    editing.value = null
    loadOrgs()
  } catch (e: unknown) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '저장하지 못했어요')
  } finally {
    acting.value = false
  }
}
let mergeTimer: ReturnType<typeof setTimeout> | undefined
function searchMerge() {
  clearTimeout(mergeTimer)
  mergeTimer = setTimeout(async () => {
    const term = mergeQuery.value.trim()
    mergeMatches.value = term ? (await findOrgs(term)).filter((o) => o.id !== editing.value?.id).slice(0, 6) : []
  }, 250)
}
async function merge(into: AdminOrg) {
  const from = editing.value
  if (!from) return
  if (!(await confirmDialog({ title: `${from.name} → ${into.name}`, message: `회원 ${from.members}명을 옮기고 '${from.name}'을 지워요. 되돌릴 수 없어요.`, confirmText: '합치기', danger: true }))) return
  acting.value = true
  try {
    await POST('/api/admin/organizations/{orgId}/merge-into/{intoId}', { path: { orgId: from.id, intoId: into.id } })
    editing.value = null
    showToast('합쳤어요')
    loadOrgs()
  } catch (e: unknown) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '합치지 못했어요')
  } finally {
    acting.value = false
  }
}

function sizeText(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`
}

let off: (() => void) | undefined
onMounted(() => {
  load()
  loadOrgs()
  off = refreshOnChange(load)
})
onBeforeUnmount(() => { off?.(); closeFile() })
</script>
