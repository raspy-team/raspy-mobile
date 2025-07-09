<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="bg-white w-[90%] max-h-[95%] overflow-auto max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in pt-8">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-600 hover:text-black text-[2rem] font-bold">×</button>
      <h2 class="text-lg font-md text-gray-900 tracking-tight mb-4 flex items-center gap-2">
        <i class="fas fa-bolt text-orange-500"></i>
        규칙 생성하기
      </h2>
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">규칙 설명</label>
          <textarea
            v-model="form.ruleDescription"
            class="modern-input text-sm whitespace-pre-line"
            rows="6"
            maxlength="2000"
            :placeholder="placeholder"
          />
          <div class="flex justify-between items-center mt-1">
            <div class="text-gray-400 text-xs">규칙 설명은 최대한 구체적으로 작성해주세요.</div>
            <div class="text-xs text-gray-500">{{ form.ruleDescription.length }} / 2000</div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">한세트 승리에 필요한 점수</label>
          <div class="flex gap-2 mt-2 mb-3">
            <button type="button" @click="setPointsUnlimited" :class="pointsUnlimited ? activeTab : inactiveTab">제한 없음</button>
            <button type="button" @click="setPointsCustom" :class="!pointsUnlimited ? activeTab : inactiveTab">직접 입력</button>
          </div>
          <input v-if="!pointsUnlimited" v-model.number="form.pointsToWin" type="number" class="modern-input text-xs" placeholder="점수를 입력하세요" />
          <div class="text-gray-400 text-xs mt-2">‘제한없음’으로 설정된 경우 세트 시간 종료시까지 세트가 진행됩니다.</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">총 세트(과반 세트 승리 시 경기 승리)</label>
          <input v-model.number="form.setsToWin" type="number" class="modern-input text-xs" min="1" placeholder="세트 수 입력" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">세트 제한시간 (초)</label>
          <div class="flex gap-2 mt-2 mb-3">
            <button type="button" @click="setTimeUnlimited" :class="timeUnlimited ? activeTab : inactiveTab">제한 없음</button>
            <button type="button" @click="setTimeCustom" :class="!timeUnlimited ? activeTab : inactiveTab">직접 입력</button>
          </div>
          <input v-if="!timeUnlimited" v-model.number="form.duration" type="number" class="modern-input text-xs" placeholder="시간을 입력하세요" />
          <div class="text-gray-400 text-xs mt-2">‘제한없음’으로 설정된 경우 한세트 승리에 필요한 점수 도달시까지 세트가 진행됩니다.</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">세트 승리 기준</label>
          <select v-model="form.winBy" class="modern-input text-xs">
            <option disabled value="">기준 선택</option>
            <option value="SETS_HALF_WIN" :disabled="disableHalfWin">점수 달성 (미달성 시 무승부)</option>
            <option value="MOST_SETS_AND_POINTS" :disabled="disableMostPoints">제한시간 도달 (동점 시 무승부)</option>
          </select>
        </div>

        <div v-if="invalidMessage" class="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0V7zm0 6a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/></svg>
          <span>{{ invalidMessage }}</span>
        </div>

        <div>
          <div class="text-xs text-gray-600 pb-2">[규칙 제목]과 [카테고리]는 설명을 바탕으로 AI로 자동 생성됩니다.</div>
          <button type="submit" :disabled="loading || !isValid" class="w-full bg-orange-500 text-white py-2 rounded-md font-semibold shadow hover:brightness-110 transition disabled:opacity-50">
            {{ showAIGenerating ? '생성 중...' : '생성하기' }}
          </button>
        </div>
      </form>

      <transition name="fade">
        <div v-if="showAIGenerating" class="ai-effect-overlay">
          <div class="ai-circle-loader"></div>
          <p class="ai-shimmer-text">AI가 규칙의 제목과 카테고리를 생성 중입니다…</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits, watch } from 'vue'
import api from '../api/api'
import { useToast } from '../composable/useToast'
const { showToast } = useToast()
const emit = defineEmits(['created', 'close'])

const form = ref({ ruleDescription: '', pointsToWin: -1, setsToWin: 1, duration: -1, winBy: '' })
const pointsUnlimited = ref(true), timeUnlimited = ref(true)
const disableHalfWin = ref(false), disableMostPoints = ref(false)
const showAIGenerating = ref(false), loading = ref(false)

const activeTab = 'px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-full shadow'
const inactiveTab = 'px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full'

const placeholder = `예시)
목표:
- 300초 동안 동일 난이도 볼더 라우트를 번갈아 등반하여 점수 겨루기

시작/세팅:
- 동일 난이도의 볼더 문제 여러 개 선택
- 타이머 300초, '3,2,1 시작!' 후 A부터 시작

플레이 방법:
1. A가 완등 시 B에게 차례 넘김
2. 실패 시 차례 소모
3. 300초 동안 반복하며 완등 시 1점 부여

승리 조건:
- 시간 종료 시 점수 많은 선수 승리

반칙:
- 쉬운 문제 시도 시 무효
- 동일 반칙 2회 시 상대 1점 부여`

const setPointsUnlimited = () => { pointsUnlimited.value = true; form.value.pointsToWin = -1; validateRuleOptions() }
const setPointsCustom = () => { pointsUnlimited.value = false; form.value.pointsToWin = 1; validateRuleOptions() }
const setTimeUnlimited = () => { timeUnlimited.value = true; form.value.duration = -1; validateRuleOptions() }
const setTimeCustom = () => { timeUnlimited.value = false; form.value.duration = 1; validateRuleOptions() }

function validateRuleOptions() {
  const p = form.value.pointsToWin, t = form.value.duration
  disableHalfWin.value = p === -1
  disableMostPoints.value = t === -1
  if (p === -1 && t !== -1) form.value.winBy = 'MOST_SETS_AND_POINTS'
  if (t === -1 && p !== -1) form.value.winBy = 'SETS_HALF_WIN'
  if (p === -1 && t === -1) form.value.winBy = ''
}
watch(() => form.value.pointsToWin, validateRuleOptions)
watch(() => form.value.duration, validateRuleOptions)

const invalidMessage = computed(() => {
  if (!form.value.ruleDescription) return '규칙 설명을 입력하세요.'
  if (form.value.setsToWin < 1) return '세트 수는 1 이상이어야 합니다.'
  if (form.value.pointsToWin === 0 || form.value.duration === 0) return '점수 및 시간은 0일 수 없습니다.'
  if (form.value.pointsToWin === -1 && form.value.duration === -1) return '점수와 시간을 동시에 제한없음으로 설정할 수 없습니다.'
  if (!form.value.winBy) return '세트 승리 기준을 선택하세요.'
  return ''
})
const isValid = computed(() => invalidMessage.value === '')

const handleSubmit = async () => {
  if (!isValid.value || loading.value) return
  loading.value = true
  showAIGenerating.value = true
  try {
    const dto = { referencedRuleId: null, ...form.value }
    const { data } = await api.post('/api/rules', dto)
    setTimeout(() => {
      showAIGenerating.value = false
      emit('created', data)
    }, 2500)
  } catch (e) {
    if (e.response?.status === 429) showToast('잠시 뒤 시도해주세요')
    else alert('규칙 생성 실패. 입력값을 확인하세요.')
  }
  loading.value = false
}
</script>

<style scoped>
.animate-fade-in { animation: fade-in .4s ease forwards }
@keyframes fade-in { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }

.modern-input {
  @apply w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400;
}

.ai-effect-overlay {
  position: fixed; inset:0; z-index:1000;
  left:0;
  top:0;
  width: 100dvw;
  height: 100dvh;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(255,255,255,0.9);
}
.ai-circle-loader {
  width:64px; height:64px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #F97316;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
}
.ai-shimmer-text {
  margin-top: 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #F97316;
}
/* 기존 스타일 유지 + transition 추가 */
.ai-effect-overlay {
  position: fixed; inset:0; z-index:1000;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:rgba(255,255,255,0.95);
  opacity: 0;
  animation: overlayFadeIn 0.4s ease-out forwards;
}

@keyframes overlayFadeIn {
  to { opacity: 1; }
}

/* 퇴장 애니메이션 */
.fade-leave-active {
  animation: overlayFadeOut 0.3s ease-in forwards;
}

@keyframes overlayFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.ai-circle-loader {
  width:64px; height:64px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #F97316;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
}

.ai-shimmer-text {
  margin-top: 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #F97316;
  opacity: 0;
  animation: textFadeIn 0.6s ease 0.4s forwards;
}

@keyframes textFadeIn {
  to { opacity: 1; }
}

</style>
