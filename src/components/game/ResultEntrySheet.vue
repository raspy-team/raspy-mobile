<template>
  <UiSheet :model-value="modelValue" :title="counter ? '내가 생각하는 점수' : '점수만 적기'" @update:model-value="emit('update:modelValue', $event)">
    <p v-if="counter" class="t-caption mb-4">고친 결과가 새 결과가 되고, 이번엔 {{ isGroup ? '다른 사람' : opponentName + (format === 'TEAMS' ? '' : '님') }}이 확인해요. 24시간 안에 답이 없으면 그대로 확정돼요.</p>
    <!-- 상대가 확인하지 않아도 24시간 뒤 확정된다는 것을 처음 낼 때도 (고쳐 낼 때만 말했다: 상대가 답하지 않으면 끝없이 기다리는 줄 알았다, 11/11 다른 사람 전수표) -->
    <p v-else-if="isGroup" class="t-caption mb-4">다른 사람 한 명이 확인하면 기록돼요. 24시간 안에 답이 없으면 그대로 확정돼요.</p>
    <p v-else class="t-caption mb-4">한 세트만 해도 돼요. 안 한 세트는 비워 두세요. {{ opponentName }}{{ format === 'TEAMS' ? '' : '님' }}이 확인하면 기록되고, 24시간 안에 답이 없으면 그대로 확정돼요.</p>
    <p v-if="warning" class="text-sm text-danger-fg mb-4">{{ warning }}</p>

    <!-- 셋 이상이 각자: 등수로 또는 점수로 -->
    <template v-if="isGroup">
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip :selected="groupMode === 'place'" @click="groupMode = 'place'">등수로</UiChip>
        <UiChip :selected="groupMode === 'score'" @click="groupMode = 'score'">점수로</UiChip>
        <UiChip v-if="!counter" :selected="groupMode === 'vote'" @click="groupMode = 'vote'">투표로</UiChip>
      </div>
      <p v-if="groupMode === 'vote'" class="t-caption">점수 없이 함께 한 사람들이 '누가 제일 잘했나'를 뽑아요. 자기는 못 뽑고, 모두 뽑거나 24시간이 지나면 표가 많은 순서로 등수가 정해져요.</p>
      <ol v-if="groupMode !== 'vote'" class="space-y-2">
        <li v-for="p in people" :key="p.id" class="grid grid-cols-[1fr_6rem] items-center gap-3">
          <span class="text-sm text-fg truncate">{{ p.nickname }}</span>
          <select v-if="groupMode === 'place'" v-model.number="p.place" class="ui-control h-12 text-center" :aria-label="`${p.nickname} 등수`">
            <option :value="null" disabled>등수</option>
            <option v-for="n in people.length" :key="n" :value="n">{{ n }}등</option>
          </select>
          <input
            v-else
            v-model.number="p.score"
            type="number"
            inputmode="numeric"
            min="0"
            max="999"
            class="ui-control h-12 text-center tabular-nums"
            :aria-label="`${p.nickname} 점수`"
          />
        </li>
      </ol>
      <p v-if="groupMode !== 'vote'" class="t-caption mt-3">{{ groupMode === 'place' ? '같이 들어오면 같은 등수를 고르세요.' : '점수가 높은 순서로 등수가 매겨져요.' }}</p>
    </template>

    <template v-else>
    <div class="grid grid-cols-[3rem_1fr_1fr_2.75rem] items-center gap-2 mb-1">
      <span></span>
      <span class="t-label text-center truncate">{{ myName }}</span>
      <span class="t-label text-center truncate">{{ opponentName }}</span>
      <span></span>
    </div>
    <ol class="space-y-2">
      <li v-for="(set, i) in sets" :key="set.key" class="grid grid-cols-[3rem_1fr_1fr_2.75rem] items-center gap-2">
        <span class="t-caption">{{ i + 1 }}세트</span>
        <input
          v-model.number="set.my"
          type="number"
          inputmode="numeric"
          min="0"
          max="999"
          class="ui-control h-12 text-center tabular-nums"
          :aria-label="`${i + 1}세트 내 점수`"
        />
        <input
          v-model.number="set.opponent"
          type="number"
          inputmode="numeric"
          min="0"
          max="999"
          class="ui-control h-12 text-center tabular-nums"
          :aria-label="`${i + 1}세트 ${opponentName} 점수`"
        />
        <UiIconButton v-if="sets.length > 1" icon="fas fa-xmark" :label="`${i + 1}세트 지우기`" @click="sets.splice(i, 1)" />
      </li>
    </ol>
    <UiButton v-if="sets.length < 9" variant="ghost" icon="fas fa-plus" class="mt-2" @click="addSet">세트 추가</UiButton>
    </template>
    <!-- 다른 게임 안에서 한 경기: 결과 화면 스크린샷 (상대가 확인할 때 본다, 9번) -->
    <div v-if="proof && !counter" class="mt-5">
      <label class="flex items-center gap-3 min-h-12 px-4 rounded-xl bg-surface-2 cursor-pointer">
        <UiIcon name="images" aria-hidden="true" />
        <span class="flex-1 min-w-0 text-sm truncate">{{ proofFile ? proofFile.name : '결과 화면 스크린샷 붙이기 (선택)' }}</span>
        <input type="file" accept="image/*" class="sr-only" @change="onProof" />
      </label>
      <p class="t-caption mt-1.5">붙이면 상대가 결과를 확인할 때 같이 봐요.</p>
    </div>
    <p v-if="error" class="text-sm text-danger-fg mt-3" role="alert">{{ error }}</p>

    <template #footer>
      <UiButton block size="lg" :loading="submitting" @click="submit">{{ counter ? '이 점수로 돌려보내기' : isGroup && groupMode === 'vote' ? '투표 열기' : '결과 내기' }}</UiButton>
    </template>
  </UiSheet>
</template>

<script setup>
// 점수판 없이, 경기가 끝난 뒤 세트별 점수만 낸다. 상대가 확인하면 확정된다
// counter: 상대가 낸 결과를 돌려보내며 내가 생각하는 점수를 낸다 (initial: 지금 결과를 [내 점수, 상대 점수]로)
import { computed, ref, watch, defineProps, defineEmits } from 'vue'
import { POST } from '../../api/client'
import api from '../../api/api'
import { UiButton, UiChip, UiIcon, UiIconButton, UiSheet } from '../ui'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  gameId: { type: [Number, String], required: true },
  opponentName: { type: String, default: '상대' },
  setCount: { type: Number, default: 1 }, // 규칙의 총 세트 수. 처음 칸 수로만 쓴다
  counter: { type: Boolean, default: false },
  initial: { type: Array, default: () => [] },
  warning: { type: String, default: '' },
  // 팀·각자 경기: 서버 detail·result의 sides 순서 그대로 ({ members: [{ id, nickname }] }), 내 편의 자리
  format: { type: String, default: 'DUEL' },
  sides: { type: Array, default: () => [] },
  mySide: { type: Number, default: 0 },
  myName: { type: String, default: '나' },
  // 결과 스크린샷 칸을 보일까 (다른 게임 안에서 하는 규칙, 9번)
  proof: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'submitted'])

let nextKey = 0
const blank = () => ({ key: nextKey++, my: null, opponent: null })
const sets = ref([])
const error = ref('')
const submitting = ref(false)

// 열 때마다 비워서 시작. 과반만 이기면 끝나므로 처음엔 과반 수만큼 칸을 둔다
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    const first = Math.max(1, Math.min(9, Math.floor(props.setCount / 2) + 1))
    sets.value = props.initial.length
      ? props.initial.map(([my, opponent]) => ({ key: nextKey++, my, opponent }))
      : Array.from({ length: first }, blank)
    error.value = ''
  },
  { immediate: true },
)

const addSet = () => sets.value.push(blank())

// 셋 이상이 각자 하는 경기: 사람마다 등수나 점수 하나
const isGroup = computed(() => props.format === 'FREE_FOR_ALL')
const groupMode = ref('place')
const people = ref([])
watch(
  () => [props.modelValue, props.sides],
  ([open]) => {
    if (!open || !isGroup.value) return
    people.value = props.sides.map((s) => ({ id: s.members[0].id, nickname: s.members[0].nickname, place: null, score: null }))
  },
  { immediate: true },
)

// 편 순서대로의 점수 [내 편 점수, 상대 편 점수] → 서버의 sideSets 순서로
function toSideSets(played) {
  return played.map((s) => (props.mySide === 0 ? [s.my, s.opponent] : [s.opponent, s.my]))
}

const proofFile = ref(null)
function onProof(e) {
  const f = e.target.files?.[0]
  if (f && f.size > 10 * 1024 * 1024) {
    error.value = '스크린샷은 10MB까지 올릴 수 있어요'
    return
  }
  proofFile.value = f || null
}

async function send(body) {
  submitting.value = true
  error.value = ''
  try {
    // 스크린샷을 먼저 올린다 (결과를 내면 경기가 '확인 기다림'으로 바뀌어도 올릴 수 있지만, 상대가 볼 때 이미 있게)
    if (props.proof && !props.counter && proofFile.value) {
      const form = new FormData()
      form.append('file', proofFile.value)
      try {
        await api.post(`/api/games/${props.gameId}/result/proof`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch (e) {
        error.value = e.response?.data?.message || '스크린샷을 올리지 못했어요. 빼고 내거나 다시 해 주세요'
        proofFile.value = null
        return
      }
    }
    if (props.counter) await POST('/api/games/{id}/result/reject', { path: { id: Number(props.gameId) }, body })
    else await POST('/api/games/{id}/result', { path: { id: Number(props.gameId) }, body })
    emit('update:modelValue', false)
    emit('submitted')
  } catch (e) {
    error.value = e.response?.data?.message || '결과를 내지 못했어요. 다시 해 주세요'
  } finally {
    submitting.value = false
  }
}

async function openVote() {
  submitting.value = true
  error.value = ''
  try {
    await POST('/api/games/{id}/result/peer-vote/open', { path: { id: Number(props.gameId) } })
    emit('update:modelValue', false)
    emit('submitted')
  } catch (e) {
    error.value = e.response?.data?.message || '투표를 열지 못했어요'
  } finally {
    submitting.value = false
  }
}

function submitGroup() {
  if (groupMode.value === 'vote') return openVote()
  const ps = people.value
  if (groupMode.value === 'place') {
    if (ps.some((p) => !p.place)) return (error.value = '모든 사람의 등수를 골라 주세요')
    return send({ places: Object.fromEntries(ps.map((p) => [p.id, p.place])) })
  }
  if (!ps.every((p) => Number.isInteger(p.score) && p.score >= 0 && p.score <= 999)) return (error.value = '모든 사람의 점수를 0~999 사이로 넣어 주세요')
  return send({ sideSets: [ps.map((p) => p.score)] })
}

async function submit() {
  if (isGroup.value) return submitGroup()
  const valid = (n) => Number.isInteger(n) && n >= 0 && n <= 999
  const empty = (n) => n === null || n === ''
  // 두 칸 다 빈 세트는 안 한 세트로 본다 (칸은 넉넉히 두므로)
  const played = sets.value.filter((s) => !(empty(s.my) && empty(s.opponent)))
  if (!played.length || !played.every((s) => valid(s.my) && valid(s.opponent))) {
    error.value = played.length ? '세트마다 두 사람 점수를 0~999 사이로 넣어 주세요' : '한 세트 이상 점수를 넣어 주세요'
    return
  }
  // 팀 경기는 편 순서대로 (sideSets), 1:1은 [내 점수, 상대 점수] (sets)
  await send(props.format === 'TEAMS'
    ? { sideSets: toSideSets(played) }
    : { sets: played.map((s) => ({ myScore: s.my, opponentScore: s.opponent })) })
}
</script>
