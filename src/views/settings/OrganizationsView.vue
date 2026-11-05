<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="소속" back="/settings" />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-32 space-y-8">
      <p class="t-caption pt-3">학교·회사를 인증하면 프로필에 ✓ 소속이 붙고, 그 안에서 순위와 챔피언을 겨뤄요.</p>

      <UiListSkeleton v-if="loading" :rows="3" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="소속을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <template v-else-if="mine">
        <!-- 인증한 소속 -->
        <UiSection title="인증한 소속">
          <UiList v-if="mine.memberships.length">
            <UiListItem
              v-for="m in mine.memberships"
              :key="m.orgId"
              icon="building"
              :title="`${m.name} ✓`"
              :subtitle="`${TYPE_LABEL[m.type]} · ${VISIBILITY[m.visibility].label}`"
              chevron
              @click="openMember = m"
            />
          </UiList>
          <UiCard v-else>
            <UiEmptyState mascot="kok" title="아직 인증한 소속이 없어요" description="증명서 한 장이면 돼요. 확인이 끝나면 바로 지워요" />
          </UiCard>
        </UiSection>

        <!-- 기다리는 신청 -->
        <UiSection v-if="mine.pending" title="확인을 기다려요">
          <UiCard class="space-y-3">
            <div class="flex items-center gap-2">
              <UiBadge tone="neutral">{{ TYPE_LABEL[mine.pending.type] }}</UiBadge>
              <span class="t-body text-fg flex-1 min-w-0 truncate">{{ mine.pending.name }}</span>
              <span class="t-micro">{{ timeAgo(mine.pending.createdAt) }}</span>
            </div>
            <p class="t-caption">운영진이 서류를 보고 알려 드려요. 보통 하루 안에 끝나요.</p>
            <UiButton variant="secondary" size="sm" :loading="canceling" @click="cancel">신청 취소</UiButton>
          </UiCard>
        </UiSection>

        <!-- 최근 결과가 거절이면 사유를 보여 준다 -->
        <UiCard v-if="!mine.pending && mine.lastDecided?.status === 'REJECTED'" class="space-y-1">
          <p class="t-label text-fg">{{ mine.lastDecided.name }} 인증을 하지 못했어요</p>
          <p class="t-caption">{{ mine.lastDecided.rejectReason }}</p>
        </UiCard>

        <UiButton v-if="mine.canRequest" block size="lg" @click="openForm">소속 인증하기</UiButton>
        <p v-else-if="!mine.pending" class="t-caption text-center">소속은 {{ mine.maxOrgs }}개까지예요. 하나를 떼면 다시 인증할 수 있어요.</p>
      </template>
    </main>

    <!-- 소속 하나: 공개 범위·떼기 -->
    <UiSheet :model-value="!!openMember" :title="openMember?.name" @update:model-value="openMember = null">
      <template v-if="openMember">
        <p class="t-caption mb-3">{{ TYPE_LABEL[openMember.type] }} · {{ dateText(openMember.verifiedAt) }} 인증</p>
        <p class="t-label text-fg mb-2">누가 볼 수 있나요</p>
        <UiList>
          <UiListItem
            v-for="v in VISIBILITY_ORDER"
            :key="v"
            :title="VISIBILITY[v].label"
            :subtitle="VISIBILITY[v].hint"
            @click="setVisibility(openMember, v)"
          >
            <template #trailing>
              <UiSpinner v-if="savingVisibility === v" />
              <UiIcon v-else-if="openMember.visibility === v" name="check" class="text-lg" />
            </template>
          </UiListItem>
        </UiList>
        <UiButton block variant="danger" class="mt-4" :loading="leaving" @click="leave(openMember)">소속 떼기</UiButton>
      </template>
    </UiSheet>

    <!-- 인증하기 -->
    <UiSheet v-model="formOpen" title="소속 인증하기">
      <div class="space-y-5">
        <!-- 1. 조직 -->
        <div>
          <UiInput v-model="query" label="학교·회사 이름" placeholder="예: 연세대학교, 매치주식회사" maxlength="60" @update:model-value="onQuery" />
          <UiList v-if="!picked && results.length" class="mt-2">
            <UiListItem v-for="o in results" :key="o.id" icon="building" :title="o.name" :subtitle="TYPE_LABEL[o.type]" @click="pick(o)" />
          </UiList>
          <div v-if="picked" class="flex items-center gap-2 mt-2">
            <UiBadge tone="neutral">{{ TYPE_LABEL[picked.type] }}</UiBadge>
            <span class="t-body text-fg flex-1 min-w-0 truncate">{{ picked.name }}</span>
            <UiButton variant="ghost" size="sm" @click="unpick">바꾸기</UiButton>
          </div>
          <div v-else-if="query.trim().length >= 2" class="mt-3">
            <p class="t-caption mb-2">목록에 없으면 새 이름으로 신청해요. 종류를 골라 주세요</p>
            <div class="flex gap-2">
              <UiChip v-for="t in TYPE_ORDER" :key="t" :selected="newType === t" @click="newType = t">{{ TYPE_LABEL[t] }}</UiChip>
            </div>
          </div>
          <p class="t-micro mt-2">중고등학교는 받지 않아요.</p>
        </div>

        <!-- 2. 서류 -->
        <div>
          <p class="t-label text-fg mb-1">증명서 한 장</p>
          <p class="t-caption mb-2">
            재학·재직·합격·졸업 증명서(3개월 안에 뗀 것), 학생증·사원증 사진. PDF·JPG·PNG, 10MB까지.
            학번·주민번호 뒷자리는 가려도 돼요. 확인이 끝나면 바로 지워요.
          </p>
          <!-- 아이폰 사진(HEIC)은 받지 않는다 (org-all 결정 7) -->
          <p class="t-caption mb-2">아이폰 사진이 안 올라가면 스크린샷으로 올려 주세요</p>
          <input ref="fileInput" type="file" accept="application/pdf,image/jpeg,image/png" class="hidden" @change="onFile" />
          <UiButton variant="secondary" block icon="file-lines" @click="fileInput?.click()">
            {{ file ? '다른 파일 고르기' : '파일 고르기' }}
          </UiButton>
          <!-- 긴 파일 이름이 버튼을 넘치지 않게 이름은 버튼 아래 한 줄로 -->
          <p v-if="file" class="t-caption text-fg mt-1 truncate">{{ file.name }} ({{ sizeText(file.size) }})</p>
          <p v-if="fileError" class="t-caption text-danger mt-1">{{ fileError }}</p>
        </div>

        <!-- 3. 동의 -->
        <button type="button" role="checkbox" :aria-checked="agreed" class="w-full flex items-start gap-3 text-left" @click="agreed = !agreed">
          <UiIcon name="fas fa-check" class="w-6 text-center mt-0.5" :class="agreed ? 'text-primary' : 'text-line-strong'" aria-hidden="true" />
          <span class="text-sm text-fg">
            소속 확인을 위해 조직 이름·종류와 확인 서류를 받고, 확인이 끝나면 서류를 바로 지우는 데 동의해요 <span class="text-fg-subtle">(필수)</span>
          </span>
        </button>

        <UiButton block size="lg" :disabled="!canSubmit" :loading="submitting" @click="submit">신청하기</UiButton>
      </div>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 설정 > 소속 (docs/organizations.md 2절): 인증한 소속(공개 범위·떼기), 기다리는 신청, 인증하기.
// 결과는 알림으로 오고, 열려 있으면 refreshOnChange로 바로 다시 불러온다
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '../../api/api'
import { GET, PUT, DELETE } from '../../api/client'
import type { components } from '../../api/schema'
import { refreshOnChange } from '../../websocket/userChannel'
import { timeAgo } from '../../utils/format'
import { useToast } from '../../composable/useToast'
import { confirmDialog } from '../../composables/useConfirm'
import {
  UiBadge, UiButton, UiCard, UiChip, UiEmptyState, UiIcon, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSection, UiSheet, UiSpinner, UiTopBar,
} from '../../components/ui'

type Mine = components['schemas']['OrgMine']
type Membership = components['schemas']['OrgMembership']
type OrgSummary = components['schemas']['OrgSummary']
type OrgType = OrgSummary['type']
type Visibility = Membership['visibility']

const TYPE_LABEL: Record<OrgType, string> = { UNIVERSITY: '대학교', COMPANY: '회사', OTHER: '기타' }
const TYPE_ORDER: OrgType[] = ['UNIVERSITY', 'COMPANY', 'OTHER']
const VISIBILITY: Record<Visibility, { label: string; hint: string }> = {
  ALL: { label: '모두', hint: '내 프로필을 보는 누구에게나 보여요' },
  SAME_ORG: { label: '같은 조직만', hint: '이 소속을 인증한 사람에게만 보여요' },
  HIDDEN: { label: '숨김', hint: '아무에게도 안 보이고, 이 소속 순위와 챔피언 자리에서도 빠져요' },
}
const VISIBILITY_ORDER: Visibility[] = ['ALL', 'SAME_ORG', 'HIDDEN']
const MAX_BYTES = 10 * 1024 * 1024

const { showToast } = useToast()
const mine = ref<Mine | null>(null)
const loading = ref(true)
const error = ref(false)

async function load() {
  error.value = false
  try {
    mine.value = (await GET('/api/organizations/me')).data
  } catch {
    if (!mine.value) error.value = true
  } finally {
    loading.value = false
  }
}

// 소속 하나
const openMember = ref<Membership | null>(null)
const savingVisibility = ref<Visibility | ''>('')
const leaving = ref(false)

async function setVisibility(m: Membership, v: Visibility) {
  if (m.visibility === v) return
  if (v === 'HIDDEN' && !(await confirmDialog({ title: '숨길까요?', message: `${m.name} 순위와 챔피언 자리에서도 빠져요. 언제든 다시 바꿀 수 있어요.`, confirmText: '숨기기' }))) return
  savingVisibility.value = v
  try {
    await PUT('/api/organizations/{orgId}/visibility', { path: { orgId: m.orgId }, body: { visibility: v } })
    m.visibility = v
  } catch {
    showToast('바꾸지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    savingVisibility.value = ''
  }
}

async function leave(m: Membership) {
  if (!(await confirmDialog({ title: `${m.name} 소속을 뗄까요?`, message: '다시 붙이려면 서류로 다시 인증해야 해요.', confirmText: '떼기', danger: true }))) return
  leaving.value = true
  try {
    await DELETE('/api/organizations/{orgId}/membership', { path: { orgId: m.orgId } })
    openMember.value = null
    await load()
  } catch {
    showToast('떼지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    leaving.value = false
  }
}

// 기다리는 신청 취소
const canceling = ref(false)
async function cancel() {
  const p = mine.value?.pending
  if (!p || !(await confirmDialog({ title: '신청을 취소할까요?', message: '올린 서류도 바로 지워요.', confirmText: '취소하기' }))) return
  canceling.value = true
  try {
    await DELETE('/api/organizations/requests/{id}', { path: { id: p.id } })
    await load()
  } catch {
    showToast('취소하지 못했어요')
  } finally {
    canceling.value = false
  }
}

// 인증하기
const formOpen = ref(false)
const query = ref('')
const results = ref<OrgSummary[]>([])
const picked = ref<OrgSummary | null>(null)
const newType = ref<OrgType | null>(null)
const file = ref<File | null>(null)
const fileError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const agreed = ref(false)
const submitting = ref(false)

function openForm() {
  query.value = ''
  results.value = []
  picked.value = null
  newType.value = null
  file.value = null
  fileError.value = ''
  agreed.value = false
  formOpen.value = true
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchSeq = 0
function onQuery() {
  picked.value = null
  clearTimeout(searchTimer)
  const term = query.value.trim()
  if (!term) { results.value = []; return }
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq
    const data = (await GET('/api/organizations/search', { query: { q: term } }).catch(() => ({ data: [] }))).data || []
    if (seq === searchSeq) results.value = data
  }, 250)
}

function pick(o: OrgSummary) {
  picked.value = o
  query.value = o.name
  results.value = []
}
function unpick() {
  picked.value = null
  onQuery()
}

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] || null
  input.value = ''
  fileError.value = ''
  if (!f) return
  if (f.size > MAX_BYTES) { file.value = null; fileError.value = '10MB까지 올릴 수 있어요'; return }
  if (!/^(application\/pdf|image\/jpeg|image\/png)$/.test(f.type)) { file.value = null; fileError.value = 'PDF·JPG·PNG 파일만 올릴 수 있어요. 아이폰 사진이면 스크린샷으로 올려 주세요'; return }
  file.value = f
}

const canSubmit = computed(() =>
  !!file.value && agreed.value && (!!picked.value || (query.value.trim().length >= 2 && !!newType.value)))

async function submit() {
  if (!canSubmit.value || !file.value) return
  const form = new FormData()
  if (picked.value) form.append('orgId', String(picked.value.id))
  else {
    form.append('name', query.value.trim())
    form.append('type', newType.value as string)
  }
  form.append('agree', 'true')
  form.append('file', file.value)
  submitting.value = true
  try {
    // 파일을 보내는 요청이라 타입 검사 client(JSON 본문) 대신 api로 보낸다. 주소는 check-api가 검사한다
    await api.post('/api/organizations/requests', form)
    formOpen.value = false
    showToast('신청했어요. 결과는 알림으로 알려 드려요')
    await load()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message
    showToast(msg || '신청하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    submitting.value = false
  }
}

function sizeText(n: number) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`
}
function dateText(v: string) {
  const d = new Date(v)
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}

let off: (() => void) | undefined
onMounted(() => {
  load()
  off = refreshOnChange(load)
})
onBeforeUnmount(() => off?.())
</script>
