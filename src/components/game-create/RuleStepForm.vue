<template>
  <div class="py-6 px-5">
    <!-- 1. 어떤 경기인가요? -->
    <div v-if="step === 5">
      <div class="mb-2 text-base font-bold">1. 어떤 경기인가요?</div>
      <div class="mb-2 text-sm text-gray-500">
        참고할 만한 기존 스포츠가 있다면 아래에서 선택해주세요.<br />
        (없다면 아래 입력란에 직접 작성해 주세요.)
      </div>
      <div class="relative w-full mb-3">
        <button
          type="button"
          @click="toggleDropdown"
          class="w-full flex justify-between items-center px-3 py-2 border rounded-lg bg-white shadow-sm text-gray-700 focus:ring-2 focus:ring-orange-400"
        >
          <span class="truncate">{{ selectedMinorLabel || '참고할 스포츠 선택' }}</span>
          <svg
            class="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          v-show="showDropdown"
          class="absolute z-10 bg-white border shadow-lg rounded-xl mt-1 w-full max-h-48 overflow-auto"
        >
          <div
            v-for="minor in minors"
            :key="minor"
            @click="selectMinor(minor)"
            class="cursor-pointer px-4 py-2 hover:bg-orange-100"
          >
            {{ minor }}
          </div>
        </div>
      </div>
      <textarea
        :placeholder="'경기에 대해 자유롭게 설명해주세요.\n(예: 상대와 누가 더 높이 뛸 수 있는지 겨루는 경기입니다.)'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition placeholder:text-gray-400"
        v-model="localInput"
        :maxlength="150"
        :rows="3"
        @input="validateStep5"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localInput.length }}/150</div>
      <div v-if="inputError" class="text-sm text-red-500 mt-1">{{ inputError }}</div>
    </div>

    <!-- 2. 점수 정의 -->
    <div v-else-if="step === 6">
      <div class="mb-3 text-base font-bold">2. 어떻게 점수를 획득하나요?</div>
      <template v-if="selectedMinorLabel">
        <label class="flex items-center gap-3 mb-3 bg-gray-100 p-3 rounded-lg shadow-sm">
          <input
            type="checkbox"
            v-model="checkedScorePreset"
            class="accent-orange-500 w-5 h-5"
            @change="validateStep6"
          />
          <span class="text-base font-semibold text-gray-700"
            >{{ selectedMinorLabel }} 경기 규칙을 따릅니다.</span
          >
        </label>
      </template>
      <textarea
        :placeholder="'예시: 더 높이 뛴 사람이 점수를 가져갑니다.'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localScoreInput"
        :maxlength="120"
        :rows="3"
        @input="validateStep6"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localScoreInput.length }}/120</div>
      <div v-if="scoreInputError" class="text-sm text-red-500 mt-1">{{ scoreInputError }}</div>
    </div>

    <!-- 3. 경기 준비 -->
    <div v-else-if="step === 7">
      <div class="mb-3 text-base font-bold">3. 경기 전 준비할 것이 있나요?</div>
      <textarea
        :placeholder="'예시: 조끼와 축구화, 축구공이 필요합니다.'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localReadyInput"
        :maxlength="100"
        :rows="2"
        @input="validateStep7"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localReadyInput.length }}/100</div>
      <div v-if="readyInputError" class="text-sm text-red-500 mt-1">{{ readyInputError }}</div>
    </div>

    <!-- 4. 경기 순서 -->
    <div v-else-if="step === 8">
      <div class="mb-3 text-base font-bold">4. 경기는 어떤 순서로 진행되나요?</div>
      <template v-if="selectedMinorLabel">
        <label class="flex items-center gap-3 mb-3 bg-gray-100 p-3 rounded-lg shadow-sm">
          <input
            @change="validateStep8"
            type="checkbox"
            v-model="checkedOrderPreset"
            class="accent-orange-500 w-5 h-5"
          />
          <span class="text-base font-semibold text-gray-700"
            >{{ selectedMinorLabel }} 경기 규칙을 따릅니다.</span
          >
        </label>
      </template>
      <textarea
        :placeholder="'예시: 1. 가위바위보로 순서를 정한다. 2. ...'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localOrderInput"
        :maxlength="300"
        :rows="5"
        @input="validateStep8"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localOrderInput.length }}/300</div>
      <div v-if="orderInputError" class="text-sm text-red-500 mt-1">{{ orderInputError }}</div>
    </div>

    <!-- 5. 판정 방식 -->
    <div v-else-if="step === 9">
      <div class="mb-3 text-base font-bold">5. 판정 방식</div>
      <label class="flex items-center gap-3 mb-3 bg-gray-100 p-3 rounded-lg shadow-sm">
        <input
          @change="validateStep9"
          type="checkbox"
          v-model="checkedJudge1"
          class="accent-orange-500 w-5 h-5"
        />
        <span class="text-base font-semibold text-gray-700">상호 합의</span>
      </label>
      <textarea
        :placeholder="'예시: 제3자의 판정이 필요하나, 서로가 기록해주면서 진행도 가능합니다.'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localJudgeInput"
        :maxlength="100"
        :rows="2"
        @input="validateStep9"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localJudgeInput.length }}/100</div>
      <div v-if="judgeInputError" class="text-sm text-red-500 mt-1">{{ judgeInputError }}</div>
    </div>

    <!-- 6. 반칙 -->
    <div v-else-if="step === 10">
      <div class="mb-3 text-base font-bold">6. 반칙</div>
      <template v-if="selectedMinorLabel">
        <label class="flex items-center gap-3 mb-3 bg-gray-100 p-3 rounded-lg shadow-sm">
          <input
            @change="validateStep10"
            type="checkbox"
            v-model="checkedFoulPreset"
            class="accent-orange-500 w-5 h-5"
          />
          <span class="text-base font-semibold text-gray-700"
            >{{ selectedMinorLabel }} 경기 규칙을 따릅니다.</span
          >
        </label>
      </template>
      <textarea
        :placeholder="'예시: 도움닫기 금지, 신발 벗고 진행이 원칙입니다.'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localFoulInput"
        :maxlength="100"
        :rows="2"
        @input="validateStep10"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localFoulInput.length }}/100</div>
      <div v-if="foulInputError" class="text-sm text-red-500 mt-1">{{ foulInputError }}</div>
    </div>

    <!-- 7. 기타 정보 -->
    <div v-else-if="step === 11">
      <div class="mb-3 text-base font-bold">7. 기타 정보</div>
      <textarea
        :placeholder="'(선택)'"
        class="w-full border border-gray-200 rounded-xl p-3 mb-1 text-gray-700 resize-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
        v-model="localExtraInput"
        :maxlength="60"
        :rows="2"
        @input="validateStep11"
      />
      <div class="flex justify-end text-xs text-gray-400">{{ localExtraInput.length }}/60</div>
    </div>

    <!-- 8, 한 세트 승리 점수 / 제한시간 (설명 텍스트 추가된 버전) -->
    <div v-else-if="step === 12" class="bg-white rounded-2xl w-full max-w-2xl mx-auto">
      <div class="mb-3 text-base font-bold tracking-tight text-gray-900">
        8. 한 세트 승리 점수 / 제한 시간
      </div>
      <div class="mb-4 text-xs font-medium text-orange-500">
        둘 다 ‘제한 없음’으로 설정할 수 없습니다.
      </div>
      <div class="flex flex-col gap-8 md:flex-row md:gap-12 mt-6">
        <!-- 점수 -->
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2 text-gray-800">점수</div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="setPointsUnlimited"
              :class="[
                pointsUnlimited
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 font-semibold',
                'rounded-full px-6 py-2 text-sm transition-all focus:outline-none',
              ]"
            >
              제한 없음
            </button>
            <button
              type="button"
              @click="setPointsCustom"
              :class="[
                !pointsUnlimited
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 font-semibold',
                'rounded-full px-6 py-2 text-sm transition-all focus:outline-none',
              ]"
            >
              직접 입력
            </button>
          </div>
          <div v-if="!pointsUnlimited" class="mt-4">
            <CustomInputNumber
              v-model="localPointsToWin"
              :min="1"
              placeholder="점수 입력"
              class="w-32 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500"
              @change="validateStep12"
            />
            <div class="text-gray-400 text-xs mt-4 ml-1">
              한 세트를 승리하기 위해 필요한 점수를 입력해주세요.
            </div>
          </div>
        </div>
        <!-- 제한시간 -->
        <div class="flex-1">
          <div class="text-sm font-semibold mb-2 text-gray-800">제한 시간</div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="setTimeUnlimited"
              :class="[
                timeUnlimited
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 font-semibold',
                'rounded-full px-6 py-2 text-sm transition-all focus:outline-none',
              ]"
            >
              제한 없음
            </button>
            <button
              type="button"
              @click="setTimeCustom"
              :class="[
                !timeUnlimited
                  ? 'bg-orange-500 text-white font-bold'
                  : 'bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 font-semibold',
                'rounded-full px-6 py-2 text-sm transition-all focus:outline-none',
              ]"
            >
              직접 입력
            </button>
          </div>
          <div v-if="!timeUnlimited" class="mt-4 grid grid-cols-2 gap-3 items-start justify-start">
            <div class="flex items-center space-x-1">
              <CustomInputNumber
                v-model="localMinutes"
                :min="0"
                :max="999"
                placeholder="분"
                class="w-full border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                @change="validateStep12"
              />
              <span class="text-xs font-semibold text-gray-500">분</span>
            </div>
            <div class="flex items-center space-x-1">
              <CustomInputNumber
                v-model="localSeconds"
                :min="0"
                :max="59"
                placeholder="초"
                class="w-full border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                @change="validateStep12"
              />
              <span class="text-xs font-semibold text-gray-500">초</span>
            </div>
          </div>
        </div>
      </div>
      <div class="text-gray-400 text-xs mt-4 ml-1">
        제한 없음인 경우, 세트 시간 종료 또는 점수 도달까지 진행됩니다.
      </div>
      <div v-if="pointsTimeError" class="text-sm text-red-500 mt-3">{{ pointsTimeError }}</div>
    </div>

    <!-- 9. 총 세트 수 -->
    <div v-else-if="step === 13">
      <div class="mb-3 text-base font-bold">9. 총 세트 수</div>
      <CustomInputNumber
        v-model="localSetsToWin"
        :min="1"
        placeholder="세트 수 입력"
        class="w-32"
        @change="validateStep13"
      />
      <div class="text-gray-400 text-xs mt-2">과반 세트를 먼저 이기면 자동 승리 처리됩니다.</div>
      <div v-if="setsError" class="text-sm text-red-500 mt-1">{{ setsError }}</div>
    </div>

    <!-- 10. 세트 승리 기준 -->
    <div v-else-if="step === 14">
      <div class="mb-3 text-base font-bold">10. 세트 승리 기준</div>
      <select v-model="localWinBy" class="modern-input text-xs w-full" @change="validateStep14">
        <option disabled value="">기준 선택</option>
        <option value="SETS_HALF_WIN" :disabled="pointsUnlimited">
          점수 달성(미달성 시 무승부)
        </option>
        <option value="MOST_SETS_AND_POINTS" :disabled="timeUnlimited">
          제한시간 도달(동점 시 무승부)
        </option>
      </select>
      <div class="text-gray-400 text-xs mt-2">점수/시간 조합에 따라 선택 불가 옵션이 있습니다.</div>
      <div v-if="winByError" class="text-sm text-red-500 mt-1">{{ winByError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, watch, nextTick } from 'vue'
import api from '../../api/api'
import CustomInputNumber from './CustomInputNumber.vue'

const props = defineProps(['step', 'form', 'isEditMode'])
const emit = defineEmits(['input', 'validation'])

const minors = ref([])
const showDropdown = ref(false)
const selectedMinorLabel = ref('')
const localInput = ref(props.form.ruleGoal || '')
const inputError = ref('')

const localScoreInput = ref(props.form.ruleScoreDefinition || '')
const checkedScorePreset = ref(false)
const scoreInputError = ref('')

const localReadyInput = ref(props.form.rulePreparation || '')
const readyInputError = ref('')

const localOrderInput = ref(props.form.ruleOrder || '')
const checkedOrderPreset = ref(false)
const orderInputError = ref('')

const checkedJudge1 = ref(false)
const localJudgeInput = ref(props.form.ruleDecision || '')
const judgeInputError = ref('')

const checkedFoulPreset = ref(false)
const localFoulInput = ref(props.form.ruleFoul || '')
const foulInputError = ref('')

const localExtraInput = ref(props.form.ruleExtraInfo || '')

// 12단계
const localPointsToWin = ref(props.form.pointsToWin ?? -1)
const pointsUnlimited = ref(localPointsToWin.value === -1)
const timeUnlimited = ref(
  props.form.duration === -1 || (!props.form.duration && props.form.duration !== 0),
)
const localMinutes = ref(props.form.duration > 0 ? Math.floor(props.form.duration / 60) : 0)
const localSeconds = ref(props.form.duration > 0 ? props.form.duration % 60 : 0)
const pointsTimeError = ref('')

// 13, 14단계
const localSetsToWin = ref(props.form.setsToWin ?? 1)
const setsError = ref('')
const localWinBy = ref(props.form.winBy ?? '')
const winByError = ref('')

// ====== 욕설 검사 함수 ======
function containsProfanity(text) {
  const bannedWords = [
    // 영어 비속어
    'fuck',
    'shit',
    'asshole',
    'bitch',
    'bastard',
    'dick',
    'fucking',
    'fucker',
    'cunt',
    'nigger',
    'slut',
    'whore',
    'sex',
    'sexy',
    'nazi',
    'motherfucker',

    // 한글 비속어 (변형 포함)
    '씨발',
    '시발',
    '씨바',
    'ㅆㅂ',
    'ㅅㅂ',
    'ㅂㅅ',
    '병신',
    '새끼',
    '좆',
    '애미',
    '개새끼',
    '지랄',
    '염병',
    '꺼져',
    '죽어',
    '멍청',
    '저능',
    '존나',
    'ㅄ',
    'ㄱㅐ',
    'ㅈㄴ',
    '개같',
    '더럽',
    '섹스',
    '자지',
    '보지',
    '딸딸이',
    '빨아',
    '꼬추',
    '보빨',
    '조까',
    '좇',
    '애비',
    '년놈',
    '암캐',
    '걸레',
    '쓰레기',
    '창녀',
    '미친놈',
    '미친년',
  ]

  const lower = text.toLowerCase()
  const found = bannedWords.find((word) => lower.includes(word))
  return found || null
}

// 커스텀 드롭다운
onMounted(async () => {
  if (props.step === 5) {
    const res = await api.get('/api/rules/categories/기존 스포츠')
    minors.value = (res.data || []).filter((minor) => minor !== '기타')
  }
})
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    document.addEventListener('mousedown', handleClickOutside)
  }
}
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    showDropdown.value = false
    document.removeEventListener('mousedown', handleClickOutside)
  }
}
function selectMinor(minor) {
  selectedMinorLabel.value = minor
  showDropdown.value = false
  validateStep5()
}

// ====== 단계별 검증 & 입력 ======
function validateStep5() {
  let val = ''
  let valid = false
  if (selectedMinorLabel.value) {
    val = `${selectedMinorLabel.value} 경기입니다.`
    if (localInput.value.trim()) val += '\n' + localInput.value.trim()
    valid = true
  } else {
    val = localInput.value.trim()
    valid = !!val
  }

  if (containsProfanity(val) != null) {
    inputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  inputError.value = valid ? '' : '경기 설명을 입력해주세요.'
  emit('input', { ruleGoal: val })
  emit('validation', valid)
}

function validateStep6() {
  let val = ''
  if (selectedMinorLabel.value && checkedScorePreset.value) {
    val = `${selectedMinorLabel.value} 경기 규칙을 따릅니다.`
    if (localScoreInput.value.trim()) val += '\n' + localScoreInput.value.trim()
  } else {
    val = localScoreInput.value.trim()
  }

  if (containsProfanity(val) != null) {
    scoreInputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  scoreInputError.value = !val ? '점수 획득 방법을 입력해주세요.' : ''
  emit('input', { ruleScoreDefinition: val })
  emit('validation', !!val)
}

function validateStep7() {
  const val = localReadyInput.value.trim()

  if (containsProfanity(val) != null) {
    readyInputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  readyInputError.value = !val ? '경기 준비사항을 입력해주세요.' : ''
  emit('input', { rulePreparation: val })
  emit('validation', !!val)
}

function validateStep8() {
  let val = ''
  if (selectedMinorLabel.value && checkedOrderPreset.value) {
    val = `${selectedMinorLabel.value} 경기 규칙을 따릅니다.`
    if (localOrderInput.value.trim()) val += '\n' + localOrderInput.value.trim()
  } else {
    val = localOrderInput.value.trim()
  }

  if (containsProfanity(val) != null) {
    orderInputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  orderInputError.value = !val ? '경기 진행 순서를 입력해주세요.' : ''
  emit('input', { ruleOrder: val })
  emit('validation', !!val)
}

function validateStep9() {
  let val = ''
  if (checkedJudge1.value) {
    val = '상호 합의\n' + localJudgeInput.value.trim()
  } else {
    val = localJudgeInput.value.trim()
  }

  if (containsProfanity(val) != null) {
    judgeInputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  judgeInputError.value = !val ? '판정방식 설명을 입력해주세요.' : ''
  emit('input', { ruleDecision: val })
  emit('validation', !!val)
}

function validateStep10() {
  let val = ''
  if (selectedMinorLabel.value && checkedFoulPreset.value) {
    val = `${selectedMinorLabel.value} 경기 규칙을 따릅니다.`
    if (localFoulInput.value.trim()) val += '\n' + localFoulInput.value.trim()
  } else {
    val = localFoulInput.value.trim()
  }

  if (containsProfanity(val) != null) {
    foulInputError.value = `"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  foulInputError.value = !val ? '반칙 항목을 입력해주세요.' : ''
  emit('input', { ruleFoul: val })
  emit('validation', !!val)
}

function validateStep11() {
  const val = localExtraInput.value

  if (containsProfanity(val) != null) {
    //`"${containsProfanity(val)}"은 사용할 수 없는 단어입니다.`
    emit('validation', false)
    return
  }

  emit('input', { ruleExtraInfo: val })
  emit('validation', true)
}

function validateStep12() {
  let valid = true
  pointsTimeError.value = ''

  if (pointsUnlimited.value && timeUnlimited.value) {
    pointsTimeError.value = '점수와 시간을 동시에 제한없음으로 할 수 없습니다.'
    valid = false
  } else if (!pointsUnlimited.value && (!localPointsToWin.value || localPointsToWin.value < 1)) {
    pointsTimeError.value = '점수를 1 이상 입력하세요.'
    valid = false
  } else if (
    !timeUnlimited.value &&
    Number(localMinutes.value) === 0 &&
    Number(localSeconds.value) === 0
  ) {
    pointsTimeError.value = '시간을 1초 이상 입력하세요.'
    valid = false
  } else if (!timeUnlimited.value && Number(localSeconds.value) > 59) {
    pointsTimeError.value = '초는 0~59 사이여야 합니다.'
    valid = false
  }

  emit('input', {
    pointsToWin: pointsUnlimited.value ? -1 : Number(localPointsToWin.value),
    duration: timeUnlimited.value
      ? -1
      : Number(localMinutes.value) * 60 + Number(localSeconds.value),
  })
  emit('validation', valid)
}

function setPointsUnlimited() {
  pointsUnlimited.value = true
  localPointsToWin.value = -1
  validateStep12()
}
function setPointsCustom() {
  pointsUnlimited.value = false
  if (localPointsToWin.value === -1) localPointsToWin.value = 1
  validateStep12()
}
function setTimeUnlimited() {
  timeUnlimited.value = true
  localMinutes.value = 0
  localSeconds.value = 0
  validateStep12()
}
function setTimeCustom() {
  timeUnlimited.value = false
  if (localMinutes.value === 0 && localSeconds.value === 0) localMinutes.value = 5
  validateStep12()
}

function validateStep13() {
  const val = localSetsToWin.value
  const valid = !!val && val >= 1
  setsError.value = valid ? '' : '세트 수는 1 이상이어야 합니다.'
  emit('input', { setsToWin: Number(val) })
  emit('validation', valid)
}
function validateStep14() {
  const val = localWinBy.value
  const valid = !!val
  winByError.value = valid ? '' : '세트 승리 기준을 선택하세요.'
  emit('input', { winBy: val })
  emit('validation', valid)
}

const validators = {
  5: validateStep5,
  6: validateStep6,
  7: validateStep7,
  8: validateStep8,
  9: validateStep9,
  10: validateStep10,
  11: validateStep11,
  12: validateStep12,
  13: validateStep13,
  14: validateStep14,
}

watch(
  () => props.step,
  async (newVal) => {
    if (validators[newVal]) {
      await nextTick()
      validators[newVal]()
    }
    // 수정 모드일 때는 항상 검증 통과
    if (props.isEditMode) {
      emit('validation', true)
    }
  },
)
</script>
