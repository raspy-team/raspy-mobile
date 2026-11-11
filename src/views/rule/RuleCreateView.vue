<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="editId ? '규칙 수정 요청' : '규칙 만들기'" back />

    <!-- 다 만들었을 때: 바로 경기로 이어지게 -->
    <main v-if="done" class="max-w-xl mx-auto px-4 pt-16">
      <UiEmptyState
        mascot="match"
        mood="cheer"
        :title="editId ? '수정 요청을 보냈어요' : '규칙을 만들었어요'"
        :description="editId ? '관리자가 확인하면 바뀌어요. 내 규칙에서 상태를 볼 수 있어요' : [done.ruleTitle, ...(done.category?.abilities ?? []).map((a) => a.label)].join(' · ')"
      >
        <div class="w-full space-y-2">
          <!-- 끝난 만들기 화면은 기록에서 바꿔 끼운다(replace): 다음 화면에서 뒤로를 누르면 빈 만들기 칸으로 돌아왔다 -->
          <UiButton v-if="!editId" block size="lg" @click="router.replace(gameTo)">이 규칙으로 경기 만들기</UiButton>
          <UiButton block :variant="editId ? 'primary' : 'ghost'" @click="router.replace(editId ? '/rules/my-rules' : `/rules/${done.id}`)">
            {{ editId ? '내 규칙 보기' : '규칙 보기' }}
          </UiButton>
        </div>
      </UiEmptyState>
    </main>

    <!-- 2단계: AI가 채운 분류를 확인하고 고친다 (만들 때만) -->
    <form v-else-if="step === 'confirm'" class="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-8" novalidate @submit.prevent="submit">
      <UiCard v-if="blocked" class="border border-danger">
        <p class="t-heading">이 규칙은 올릴 수 없어요</p>
        <p class="t-caption mt-1">{{ blocked }}</p>
        <UiButton variant="secondary" size="sm" class="mt-3" @click="step = 'write'">설명 고치기</UiButton>
      </UiCard>
      <template v-else>
        <div>
          <p class="t-title">{{ aiAvailable ? '이렇게 분류했어요' : '어떤 게임인지 골라 주세요' }}</p>
          <p v-if="aiAvailable" class="t-caption mt-1">틀린 곳만 고치면 돼요</p>
        </div>
        <UiInput v-model="form.ruleTitle" label="규칙 이름" :maxlength="20" placeholder="예: 탁구 11점 3판 2선승" />
        <!-- AI가 다 채웠으면 아홉 칸을 펼치지 않고 한 줄로. 만드는 사람의 목적은 규칙을 올리는 것이고 "틀린 곳만 고치면" 된다 (목적 판정 6) -->
        <UiCard v-if="aiSummary && !editingCategory">
          <p class="t-micro">분류</p>
          <p class="t-body mt-1 break-keep">{{ aiSummary }}</p>
          <UiButton variant="secondary" size="sm" class="mt-3" @click="editingCategory = true">고치기</UiButton>
        </UiCard>
        <CategoryEditor v-else v-model="category" />
        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>
        <div class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
          <div class="max-w-xl mx-auto px-4 py-3 flex gap-2">
            <UiButton variant="secondary" size="lg" @click="step = 'write'">이전</UiButton>
            <UiButton type="submit" class="flex-1" size="lg" :loading="submitting">규칙 만들기</UiButton>
          </div>
        </div>
      </template>
    </form>

    <main v-else-if="loading" class="max-w-xl mx-auto px-4 pt-4 space-y-6">
      <UiSkeleton v-for="n in 4" :key="n" class="h-16 w-full" />
    </main>

    <!-- 한 화면에서 끝나는 규칙 만들기. 꼭 필요한 것만 위에, 나머지는 '더 자세히' 안에 -->
    <form v-else class="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-8" novalidate @submit.prevent="editId ? submit() : next()">
      <p v-if="editId" class="t-caption">바꿀 부분만 고치면 돼요. 관리자가 확인한 뒤 반영돼요.</p>

      <UiInput v-if="editId" v-model="form.ruleTitle" label="규칙 이름" :maxlength="20" placeholder="예: 탁구 11점 3판 2선승" />

      <UiInput v-model="form.ruleGoal" label="어떤 경기인가요?" multiline :rows="3" placeholder="예: 탁구대에서 공을 주고받아 11점을 먼저 내는 사람이 세트를 가져가요" />
      <UiInput v-model="form.ruleScoreDefinition" label="점수는 어떻게 얻나요?" placeholder="예: 상대가 공을 못 넘기면 1점" />

      <!-- 이기는 방법: 서버의 승리 조건 두 가지를 쉬운 말로 -->
      <UiField label="어떻게 이기나요?">
        <div class="grid grid-cols-2 gap-2" role="radiogroup">
          <button
            v-for="o in WIN_MODES"
            :key="o.value"
            type="button"
            role="radio"
            :aria-checked="winMode === o.value"
            class="p-4 rounded-xl text-left border transition-colors"
            :class="winMode === o.value ? 'border-fg bg-surface-2' : 'border-line bg-surface'"
            @click="winMode = o.value"
          >
            <span class="block t-heading">{{ o.title }}</span>
            <span class="block t-caption mt-1">{{ o.body }}</span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <UiInput v-if="winMode === 'points'" v-model="points" label="세트 승리 점수" type="number" inputmode="numeric" />
          <UiInput v-else v-model="minutes" label="세트 시간(분)" type="number" inputmode="numeric" />
          <UiInput v-model="sets" label="세트 수" type="number" inputmode="numeric" />
        </div>
        <p class="t-caption mt-2">{{ sets > 1 ? `${sets}세트 중 ${Math.floor(sets / 2) + 1}세트를 먼저 이기면 경기 승리예요.` : '한 세트로 승부를 내요.' }}</p>
      </UiField>

      <div>
        <UiButton variant="ghost" size="sm" class="-ml-2" @click="showMore = !showMore">
          더 자세히 적기 (선택) <UiIcon :name="showMore ? 'chevron-up' : 'chevron-down'" class="text-xs" />
        </UiButton>
        <div v-if="showMore" class="space-y-5 mt-4">
          <UiInput v-model="form.rulePreparation" label="준비물" optional placeholder="예: 라켓, 공" />
          <UiInput v-model="form.ruleOrder" label="진행 순서" optional placeholder="예: 서브 2번씩 교대" />
          <UiInput v-model="form.ruleDecision" label="판정" optional placeholder="예: 애매하면 다시" />
          <UiInput v-model="form.ruleFoul" label="반칙" optional placeholder="예: 라인 밟으면 실점" />
          <UiInput v-model="form.ruleExtraInfo" label="그 밖에" optional multiline :rows="2" />
        </div>
      </div>

      <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

      <div class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
        <div class="max-w-xl mx-auto px-4 py-3">
          <UiButton type="submit" block size="lg" :loading="submitting">{{ editId ? '수정 요청 보내기' : '다음' }}</UiButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
// 규칙 만들기: ① 경기를 설명한다 → ② AI가 이름·분류를 채워 보여 주고 만든 사람이 고친다 → 저장.
// 올릴 수 없는 규칙(외모·동의 없는 대상·실력 없음)은 ②에서 이유를 보여 준다. 서버도 저장할 때 다시 거른다.
// 수정(editId)은 한 화면: 기존 값을 채워 두고 /api/rules/edit-requests로 보낸다 (관리자 승인 때 다시 분류)
import { ref, reactive, computed, onMounted, defineProps } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { confirmDialog } from '../../composables/useConfirm'
import api from '../../api/api'
import { POST } from '@/api/client'
import CategoryEditor from '../../components/rule/CategoryEditor.vue'
import { emptyCategory, toInput, missing } from '@/utils/category'
import { UiButton, UiCard, UiEmptyState, UiField, UiInput, UiSkeleton, UiTopBar } from '../../components/ui'
import { containsProfanity } from '../../utils/profanity'

const props = defineProps({ editId: { type: Number, default: 0 } })

const WIN_MODES = [
  { value: 'points', title: '먼저 점수 내기', body: '정한 점수에 먼저 닿으면 세트 승리' },
  { value: 'time', title: '시간 안에 더 많이', body: '시간이 끝났을 때 점수가 높으면 승리' },
]

const form = reactive({
  ruleTitle: '',
  ruleGoal: '',
  ruleScoreDefinition: '',
  rulePreparation: '',
  ruleOrder: '',
  ruleDecision: '',
  ruleFoul: '',
  ruleExtraInfo: '',
})
const winMode = ref('points') // points: 먼저 N점(SETS_HALF_WIN) / time: 시간 안에 더 많이(MOST_SETS_AND_POINTS)
const points = ref(11)
const minutes = ref(10)
const sets = ref(3)
const showMore = ref(false)
const error = ref('')
const step = ref('write') // write: 설명 쓰기 / confirm: 분류 확인
const category = ref(emptyCategory())
const blocked = ref('')
const aiAvailable = ref(true)
const submitting = ref(false)
const loading = ref(!!props.editId)
const done = ref(null)
const route = useRoute()
const router = useRouter()
// AI가 채운 분류를 한 줄로 (빠진 칸이 있으면 펼친다)
const aiSummary = ref('')
const editingCategory = ref(false)
// 경기 만들기에서 규칙을 고르다 왔으면 넘겨 둔 때·장소·방식·인원을 그대로 들고 돌아간다 (목적 판정 6)
// exact·venueDetail도 싣는다: 규칙을 바꾸러 다녀오면 고른 날짜·시간과 화상·게임 칸 글이 사라졌다 (목적 판정 11/11 4번)
const CARRY = ['when', 'exact', 'venue', 'venueDetail', 'format', 'size']
const gameTo = computed(() => ({
  path: '/create-game',
  query: { ruleId: String(done.value?.id ?? ''), ...Object.fromEntries(CARRY.filter((k) => route.query[k]).map((k) => [k, String(route.query[k])])) },
}))

function validate() {
  if (props.editId && !form.ruleTitle.trim()) return '규칙 이름을 적어 주세요'
  if (!form.ruleGoal.trim()) return '어떤 경기인지 적어 주세요'
  if (winMode.value === 'points' && !(points.value >= 1)) return '세트 승리 점수를 1 이상으로 적어 주세요'
  if (winMode.value === 'time' && !(minutes.value >= 1)) return '세트 시간을 1분 이상으로 적어 주세요'
  if (!(sets.value >= 1 && sets.value <= 9)) return '세트 수는 1~9로 적어 주세요'
  if (containsProfanity(Object.values(form).join(' '))) return '쓰면 안 되는 말이 들어 있어요. 고쳐서 다시 보내 주세요'
  return ''
}

function body() {
  return {
    ...form,
    ruleTitle: form.ruleTitle.trim(),
    pointsToWin: winMode.value === 'points' ? points.value : -1,
    duration: winMode.value === 'time' ? minutes.value * 60 : -1,
    setsToWin: sets.value,
    winBy: winMode.value === 'points' ? 'SETS_HALF_WIN' : 'MOST_SETS_AND_POINTS',
  }
}

/** ① → ②: AI가 이름·분류를 미리 채운다. AI를 못 쓰면 빈 칸에서 직접 고른다 */
async function next() {
  error.value = validate()
  if (error.value) return
  submitting.value = true
  try {
    const { data } = await POST('/api/rules/classify', { body: body() })
    aiAvailable.value = data.aiAvailable
    blocked.value = data.blocked ?? ''
    if (data.title && !form.ruleTitle.trim()) form.ruleTitle = data.title
    category.value = data.category ? toInput(data.category) : emptyCategory()
    const c = data.category
    editingCategory.value = false
    aiSummary.value = data.aiAvailable && c && !missing(category.value)
      ? [c.face?.label, c.abilities?.map((a) => a.label).join('·'), c.places?.map((x) => x.label).join('·'), c.parties?.map((x) => x.label).join('·'), c.length?.label].filter(Boolean).join(' · ')
      : ''
    step.value = 'confirm'
    window.scrollTo(0, 0)
  } catch (e) {
    error.value = e.response?.data?.message || '잠시 뒤 다시 해 주세요'
  } finally {
    submitting.value = false
  }
}

async function submit() {
  error.value = props.editId ? validate() : !form.ruleTitle.trim() ? '규칙 이름을 적어 주세요' : missing(category.value)
  if (error.value) {
    if (!props.editId && form.ruleTitle.trim()) editingCategory.value = true // 빠진 분류는 펼쳐서 보이게
    return
  }
  submitting.value = true
  try {
    if (props.editId) {
      await api.post('/api/rules/edit-requests', { ...body(), originalRuleId: props.editId })
      done.value = { id: props.editId }
    } else {
      done.value = (await api.post('/api/rules', { ...body(), category: category.value })).data
    }
    window.scrollTo(0, 0)
  } catch (e) {
    error.value = e.response?.data?.message || '보내지 못했어요. 잠시 뒤 다시 해 주세요'
  } finally {
    submitting.value = false
  }
}

// 뒤로(위 버튼·폰 뒤로 모두): ② 확인 단계면 화면을 떠나지 않고 ① 설명으로. ①에 쓴 글이 있으면 나갈지 묻는다.
// 예전엔 ②에서 뒤로를 누르면 쓴 설명이 경고 없이 다 사라졌다 (목적 판정 6)
onBeforeRouteLeave(async () => {
  if (done.value || submitting.value) return true
  if (step.value === 'confirm') {
    step.value = 'write'
    window.scrollTo(0, 0)
    return false
  }
  const typed = Object.entries(form).some(([k, v]) => k !== 'ruleTitle' && String(v).trim()) || (!props.editId && form.ruleTitle.trim())
  if (!typed || props.editId) return true
  return confirmDialog({ title: '만들던 규칙을 두고 나갈까요?', message: '쓴 설명은 지워져요', confirmText: '나가기', danger: true })
})

onMounted(async () => {
  if (!props.editId) return
  try {
    const { data } = await api.get(`/api/rules/${props.editId}`)
    Object.keys(form).forEach((k) => (form[k] = data[k] || ''))
    if (data.pointsToWin > 0) {
      winMode.value = 'points'
      points.value = data.pointsToWin
    } else if (data.duration > 0) {
      winMode.value = 'time'
      minutes.value = Math.max(1, Math.round(data.duration / 60))
    }
    sets.value = data.setsToWin || 1
    showMore.value = ['rulePreparation', 'ruleOrder', 'ruleDecision', 'ruleFoul', 'ruleExtraInfo'].some((k) => form[k])
  } catch {
    error.value = '규칙을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
})
</script>
