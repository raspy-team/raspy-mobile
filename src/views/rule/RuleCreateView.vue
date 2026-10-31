<template>
  <HeaderComp :has-referer="true" title="규칙 만들기" :show-bell="false" :show-dm="false" />

  <!-- 다 만들었을 때: 바로 경기로 이어지게 -->
  <div v-if="createdRule" class="min-h-full flex flex-col justify-center px-5 pt-14 pb-10 bg-black">
    <i class="fas fa-check text-3xl text-orange-500 mb-4"></i>
    <div class="text-2xl font-bold text-white">규칙을 만들었어요</div>
    <div class="text-base text-gray-400 mt-2">{{ createdRule.ruleTitle }} · {{ createdRule.majorCategory }} > {{ createdRule.minorCategory }}</div>
    <button
      @click="router.push(`/create-game?ruleId=${createdRule.id}`)"
      class="mt-10 w-full py-4 rounded-xl bg-orange-500 active:bg-orange-600 text-white text-base font-bold"
    >
      이 규칙으로 경기 만들기
    </button>
    <button @click="router.push('/rules')" class="mt-3 w-full py-3 text-sm text-gray-400">다른 규칙 보기</button>
  </div>

  <!-- 한 화면에서 끝나는 규칙 만들기. 꼭 필요한 것만 위에, 나머지는 '더 자세히' 안에 -->
  <form v-else class="min-h-full bg-black px-5 pt-20 pb-32 space-y-7" @submit.prevent="submit">
    <section>
      <label class="block text-sm text-gray-400 mb-2">규칙 이름</label>
      <input
        v-model="form.ruleTitle"
        maxlength="20"
        placeholder="예: 탁구 11점 3판 2선승"
        class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base focus:border-orange-500 outline-none"
      />
    </section>

    <section>
      <label class="block text-sm text-gray-400 mb-2">종류</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in majors"
          :key="m"
          type="button"
          @click="form.majorCategory = m"
          class="px-4 py-2 rounded-full text-sm"
          :class="form.majorCategory === m ? 'bg-white text-black font-medium' : 'bg-gray-900 text-gray-300 border border-gray-800'"
        >
          {{ m }}
        </button>
      </div>
      <div v-if="minors.length" class="flex flex-wrap gap-2 mt-3">
        <button
          v-for="m in minors"
          :key="m"
          type="button"
          @click="form.minorCategory = m"
          class="px-3 py-1.5 rounded-full text-sm"
          :class="form.minorCategory === m ? 'bg-orange-500 text-white font-medium' : 'bg-gray-900 text-gray-400 border border-gray-800'"
        >
          {{ m }}
        </button>
      </div>
    </section>

    <section>
      <label class="block text-sm text-gray-400 mb-2">어떤 경기인가요?</label>
      <textarea
        v-model="form.ruleGoal"
        rows="3"
        placeholder="예: 탁구대에서 공을 주고받아 11점을 먼저 내는 사람이 세트를 가져가요"
        class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base focus:border-orange-500 outline-none resize-none"
      ></textarea>
    </section>

    <section>
      <label class="block text-sm text-gray-400 mb-2">점수는 어떻게 얻나요?</label>
      <input
        v-model="form.ruleScoreDefinition"
        placeholder="예: 상대가 공을 못 넘기면 1점"
        class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base focus:border-orange-500 outline-none"
      />
    </section>

    <!-- 이기는 방법: 백엔드의 승리 조건 두 가지를 쉬운 말로 -->
    <section>
      <label class="block text-sm text-gray-400 mb-2">어떻게 이기나요?</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          @click="winMode = 'points'"
          class="p-4 rounded-xl text-left"
          :class="winMode === 'points' ? 'bg-orange-500 text-white' : 'bg-gray-900 text-gray-300 border border-gray-800'"
        >
          <div class="font-bold">먼저 점수 내기</div>
          <div class="text-xs mt-1 opacity-80">정한 점수에 먼저 닿으면 세트 승리</div>
        </button>
        <button
          type="button"
          @click="winMode = 'time'"
          class="p-4 rounded-xl text-left"
          :class="winMode === 'time' ? 'bg-orange-500 text-white' : 'bg-gray-900 text-gray-300 border border-gray-800'"
        >
          <div class="font-bold">시간 안에 더 많이</div>
          <div class="text-xs mt-1 opacity-80">시간이 끝났을 때 점수가 높으면 승리</div>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-4">
        <label v-if="winMode === 'points'" class="text-sm text-gray-400">
          세트 승리 점수
          <input v-model.number="points" type="number" min="1" class="mt-1 w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base" />
        </label>
        <label v-else class="text-sm text-gray-400">
          세트 시간(분)
          <input v-model.number="minutes" type="number" min="1" class="mt-1 w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base" />
        </label>
        <label class="text-sm text-gray-400">
          세트 수
          <input v-model.number="sets" type="number" min="1" max="9" class="mt-1 w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base" />
        </label>
      </div>
      <p class="text-xs text-gray-500 mt-2">과반 세트를 먼저 이기면 경기 승리예요.</p>
    </section>

    <section>
      <button type="button" @click="showMore = !showMore" class="text-sm text-gray-400">
        더 자세히 적기 (선택) <i class="fas text-xs ml-1" :class="showMore ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
      <div v-if="showMore" class="space-y-4 mt-4">
        <input v-model="form.rulePreparation" placeholder="준비물 (예: 라켓, 공)" class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base outline-none" />
        <input v-model="form.ruleOrder" placeholder="진행 순서 (예: 서브 2번씩 교대)" class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base outline-none" />
        <input v-model="form.ruleDecision" placeholder="판정 (예: 애매하면 다시)" class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base outline-none" />
        <input v-model="form.ruleFoul" placeholder="반칙 (예: 라인 밟으면 실점)" class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base outline-none" />
        <textarea v-model="form.ruleExtraInfo" rows="2" placeholder="기타" class="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white text-base outline-none resize-none"></textarea>
      </div>
    </section>

    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div class="fixed bottom-0 left-0 w-full p-5 bg-black border-t border-gray-800">
      <button
        type="submit"
        :disabled="submitting"
        class="w-full py-4 rounded-xl bg-orange-500 active:bg-orange-600 text-white text-base font-bold disabled:opacity-50"
      >
        {{ submitting ? '만드는 중…' : '규칙 만들기' }}
      </button>
    </div>
  </form>
</template>

<script setup>
// 규칙 만들기 (한 화면). 예전에는 11개 질문을 한 화면에 하나씩 묻고, AI가 이름·카테고리를 정했다.
// 이제 이름·종류는 만든 사람이 고르고, 꼭 필요한 것만 위에 둔다. 서버는 빈 칸만 AI로 채운다.
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HeaderComp from '../../components/HeaderComp.vue'
import api from '../../api/api'
import { containsProfanity } from '../../utils/profanity'

const router = useRouter()

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
const createdRule = ref(null)

onMounted(async () => {
  majors.value = (await api.get('/api/rules/categories')).data.majors || []
})
watch(
  () => form.majorCategory,
  async (major) => {
    form.minorCategory = ''
    minors.value = major ? (await api.get(`/api/rules/categories/${major}`)).data || [] : []
  },
)

function validate() {
  if (!form.ruleTitle.trim()) return '규칙 이름을 적어주세요'
  if (!form.majorCategory || !form.minorCategory) return '종류를 골라주세요'
  if (!form.ruleGoal.trim()) return '어떤 경기인지 적어주세요'
  if (winMode.value === 'points' && !(points.value >= 1)) return '세트 승리 점수를 1 이상으로 적어주세요'
  if (winMode.value === 'time' && !(minutes.value >= 1)) return '세트 시간을 1분 이상으로 적어주세요'
  if (!(sets.value >= 1)) return '세트 수를 1 이상으로 적어주세요'
  const bad = containsProfanity(Object.values(form).join(' '))
  if (bad) return `"${bad}"은(는) 쓸 수 없는 말이에요`
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value) return
  submitting.value = true
  try {
    const { data } = await api.post('/api/rules', {
      ...form,
      ruleTitle: form.ruleTitle.trim(),
      pointsToWin: winMode.value === 'points' ? points.value : -1,
      duration: winMode.value === 'time' ? minutes.value * 60 : -1,
      setsToWin: sets.value,
      winBy: winMode.value === 'points' ? 'SETS_HALF_WIN' : 'MOST_SETS_AND_POINTS',
    })
    createdRule.value = data
  } catch (e) {
    error.value = e.response?.data?.message || '규칙을 만들지 못했어요. 잠시 뒤 다시 시도해주세요'
  } finally {
    submitting.value = false
  }
}
</script>
