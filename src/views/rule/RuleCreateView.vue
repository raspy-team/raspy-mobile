<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="editId ? '규칙 수정 요청' : '규칙 만들기'" back />

    <!-- 다 만들었을 때: 바로 경기로 이어지게 -->
    <main v-if="done" class="max-w-xl mx-auto px-4 pt-16">
      <UiEmptyState
        icon="fas fa-check"
        :title="editId ? '수정 요청을 보냈어요' : '규칙을 만들었어요'"
        :description="editId ? '관리자가 확인하면 바뀌어요. 내 규칙에서 상태를 볼 수 있어요' : `${done.ruleTitle} · ${done.minorCategory}`"
      >
        <div class="w-full space-y-2">
          <UiButton v-if="!editId" block size="lg" :to="`/create-game?ruleId=${done.id}`">이 규칙으로 경기 열기</UiButton>
          <UiButton block :variant="editId ? 'primary' : 'ghost'" :to="editId ? '/rules/my-rules' : `/rules/${done.id}`">
            {{ editId ? '내 규칙 보기' : '규칙 보기' }}
          </UiButton>
        </div>
      </UiEmptyState>
    </main>

    <main v-else-if="loading" class="max-w-xl mx-auto px-4 pt-4 space-y-6">
      <UiSkeleton v-for="n in 4" :key="n" class="h-16 w-full" />
    </main>

    <!-- 한 화면에서 끝나는 규칙 만들기. 꼭 필요한 것만 위에, 나머지는 '더 자세히' 안에 -->
    <form v-else class="max-w-xl mx-auto px-4 pt-4 pb-32 space-y-8" novalidate @submit.prevent="submit">
      <p v-if="editId" class="t-caption">바꿀 부분만 고치면 돼요. 관리자가 확인한 뒤 반영돼요.</p>

      <UiInput v-model="form.ruleTitle" label="규칙 이름" :maxlength="20" placeholder="예: 탁구 11점 3판 2선승" />

      <UiField label="종류">
        <div class="flex flex-wrap gap-2">
          <UiChip v-for="m in majors" :key="m" :selected="form.majorCategory === m" @click="pickMajor(m)">{{ m }}</UiChip>
        </div>
        <div v-if="minors.length" class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
          <UiChip v-for="m in minors" :key="m" :selected="form.minorCategory === m" @click="form.minorCategory = m">{{ m }}</UiChip>
        </div>
      </UiField>

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
          더 자세히 적기 (선택) <i class="fas text-xs" :class="showMore ? 'fa-chevron-up' : 'fa-chevron-down'" aria-hidden="true"></i>
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
          <UiButton type="submit" block size="lg" :loading="submitting">{{ editId ? '수정 요청 보내기' : '규칙 만들기' }}</UiButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
// 규칙 만들기 / 수정 요청 (한 화면). 이름·종류는 만든 사람이 고르고, 꼭 필요한 것만 위에 둔다.
// 수정(editId)은 기존 값을 채워 두고 /api/rules/edit-requests로 보낸다 (관리자 승인 후 반영)
import { ref, reactive, onMounted, defineProps } from 'vue'
import api from '../../api/api'
import { UiButton, UiChip, UiEmptyState, UiField, UiInput, UiSkeleton, UiTopBar } from '../../components/ui'
import { containsProfanity } from '../../utils/profanity'

const props = defineProps({ editId: { type: Number, default: 0 } })

const WIN_MODES = [
  { value: 'points', title: '먼저 점수 내기', body: '정한 점수에 먼저 닿으면 세트 승리' },
  { value: 'time', title: '시간 안에 더 많이', body: '시간이 끝났을 때 점수가 높으면 승리' },
]

const form = reactive({
  ruleTitle: '',
  majorCategory: '',
  minorCategory: '',
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
const majors = ref([])
const minors = ref([])
const error = ref('')
const submitting = ref(false)
const loading = ref(!!props.editId)
const done = ref(null)

async function loadMinors(major) {
  minors.value = major ? (await api.get(`/api/rules/categories/${major}`).catch(() => ({ data: [] }))).data || [] : []
}
function pickMajor(m) {
  if (form.majorCategory === m) return
  form.majorCategory = m
  form.minorCategory = ''
  loadMinors(m)
}

function validate() {
  if (!form.ruleTitle.trim()) return '규칙 이름을 적어주세요'
  if (!form.majorCategory || !form.minorCategory) return '종류를 골라주세요'
  if (!form.ruleGoal.trim()) return '어떤 경기인지 적어주세요'
  if (winMode.value === 'points' && !(points.value >= 1)) return '세트 승리 점수를 1 이상으로 적어주세요'
  if (winMode.value === 'time' && !(minutes.value >= 1)) return '세트 시간을 1분 이상으로 적어주세요'
  if (!(sets.value >= 1 && sets.value <= 9)) return '세트 수는 1~9로 적어주세요'
  if (containsProfanity(Object.values(form).join(' '))) return '쓰면 안 되는 말이 들어 있어요. 고쳐서 다시 보내주세요'
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return
  submitting.value = true
  const body = {
    ...form,
    ruleTitle: form.ruleTitle.trim(),
    pointsToWin: winMode.value === 'points' ? points.value : -1,
    duration: winMode.value === 'time' ? minutes.value * 60 : -1,
    setsToWin: sets.value,
    winBy: winMode.value === 'points' ? 'SETS_HALF_WIN' : 'MOST_SETS_AND_POINTS',
  }
  try {
    if (props.editId) {
      await api.post('/api/rules/edit-requests', { ...body, originalRuleId: props.editId })
      done.value = { id: props.editId }
    } else {
      done.value = (await api.post('/api/rules', body)).data
    }
    window.scrollTo(0, 0)
  } catch (e) {
    error.value = e.response?.data?.message || '보내지 못했어요. 잠시 뒤 다시 시도해주세요'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  majors.value = (await api.get('/api/rules/categories').catch(() => ({ data: {} }))).data.majors || []
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
    // 지금 목록에 없는 옛 종류여도 고른 상태로 보이게
    if (form.majorCategory && !majors.value.includes(form.majorCategory)) majors.value.push(form.majorCategory)
    await loadMinors(form.majorCategory)
    if (form.minorCategory && !minors.value.includes(form.minorCategory)) minors.value.push(form.minorCategory)
  } catch {
    error.value = '규칙을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
})
</script>
