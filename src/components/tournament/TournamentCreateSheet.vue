<template>
  <UiSheet :model-value="modelValue" title="대회 열기" @update:model-value="(v) => emit('update:modelValue', v)">
    <div class="space-y-4">
      <UiInput v-model="f.title" :maxlength="40" placeholder="대회 이름 (예: 11월 망원 탁구 월례대회)" />

      <div>
        <p class="t-heading">종목</p>
        <p class="t-caption mt-0.5">{{ ruleTitle ? `고른 규칙: ${ruleTitle}` : '규칙을 골라 주세요' }}</p>
        <ClubRulePicker class="mt-2" with-app @pick="pickRule" />
        <p v-if="appGame" class="t-caption mt-1">앱 게임 대회예요. 판마다 두 사람이 기간 안에 '경기하기'를 눌러 앱에서 겨뤄요</p>
      </div>

      <div>
        <p class="t-heading">방식</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <UiChip :selected="f.format === 'LEAGUE'" @click="f.format = 'LEAGUE'">리그 · 모두와 한 번씩</UiChip>
          <UiChip :selected="f.format === 'KNOCKOUT'" @click="f.format = 'KNOCKOUT'">토너먼트 · 지면 끝</UiChip>
        </div>
        <label v-if="f.format === 'KNOCKOUT'" class="flex items-center justify-between mt-3">
          <span class="t-body">3·4위전</span><UiSwitch v-model="f.thirdPlace" />
        </label>
      </div>

      <div>
        <p class="t-heading">누가 나가나</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <UiChip :selected="f.entrantType === 'USER'" @click="f.entrantType = 'USER'">개인</UiChip>
          <UiChip v-if="!appGame" :selected="f.entrantType === 'CLUB'" @click="f.entrantType = 'CLUB'">동호회끼리</UiChip>
        </div>
        <template v-if="f.entrantType === 'CLUB'">
          <p class="t-caption mt-2">한 판이 교류전이에요. 판마다 운영진이 선수를 내요</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <UiChip v-for="n in [1, 3, 5]" :key="n" :selected="f.boards === n" @click="f.boards = n">{{ n }}판</UiChip>
            <UiChip :selected="f.perBoard === 1" @click="f.perBoard = 1">1:1</UiChip>
            <UiChip :selected="f.perBoard === 2" @click="f.perBoard = 2">2:2</UiChip>
          </div>
        </template>
      </div>

      <div v-if="hostClubs.length || isAdmin">
        <p class="t-heading">주최</p>
        <div class="flex gap-2 mt-2 flex-wrap">
          <UiChip :selected="!f.hostClubId && !f.official" @click="f.hostClubId = null; f.membersOnly = false; f.official = false">나</UiChip>
          <UiChip v-for="c in hostClubs" :key="c.id" :selected="f.hostClubId === c.id" @click="f.hostClubId = c.id; f.official = false">{{ c.name }}</UiChip>
          <UiChip v-if="isAdmin" :selected="f.official" @click="f.official = true; f.hostClubId = null; f.membersOnly = false">매치 공식 대회</UiChip>
        </div>
        <p v-if="f.official" class="t-caption mt-2">동네와 상관없이 모두의 대회 목록에 보여요</p>
        <label v-if="f.hostClubId && f.entrantType === 'USER'" class="flex items-center justify-between mt-3">
          <span class="t-body">멤버만 (월례대회)</span><UiSwitch v-model="f.membersOnly" />
        </label>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <UiInput v-model="f.maxEntrants" type="number" inputmode="numeric" placeholder="정원" />
        <UiInput v-model="f.startsAt" type="datetime-local" />
      </div>
      <div>
        <p class="t-heading">라운드 기간</p>
        <p class="t-caption mt-0.5">기간 안에 두 쪽이 시간·장소를 잡아 경기해요</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <UiChip v-for="d in [1, 3, 7, 14]" :key="d" :selected="f.roundDays === d" @click="f.roundDays = d">{{ d === 1 ? '하루' : `${d}일` }}</UiChip>
        </div>
      </div>
      <div>
        <p class="t-heading">실력 점수 범위 (선택)</p>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <UiInput v-model="f.minRating" type="number" inputmode="numeric" placeholder="이상" />
          <UiInput v-model="f.maxRating" type="number" inputmode="numeric" placeholder="이하" />
        </div>
      </div>
      <label class="flex items-center justify-between">
        <span class="t-body">신청을 내가 받기</span><UiSwitch v-model="approval" />
      </label>
      <UiInput v-model="f.description" :maxlength="300" placeholder="안내 (선택: 상품, 장소 등)" />

      <UiButton block :loading="busy" :disabled="!canCreate" @click="create">열기</UiButton>
      <p class="t-caption">신청은 시작 때까지, 시작 24시간 전부터 체크인해요. 체크인한 참가자로 시작 때 대진이 나와요</p>
    </div>
  </UiSheet>
</template>

<script setup lang="ts">
// 대회 열기: 이름·종목(앱 게임 포함)·방식·참가(개인/동호회)·주최(나/내가 운영진인 동호회/관리자는 매치 공식)·정원·시작·라운드 기간·실력 범위
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { GET, POST } from '@/api/client'
import { useToast } from '@/composable/useToast'
import ClubRulePicker from '../club/ClubRulePicker.vue'
import { UiButton, UiChip, UiInput, UiSheet, UiSwitch } from '../ui'

const props = defineProps<{ modelValue: boolean; clubId?: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()
const router = useRouter()
const { showToast } = useToast()
const busy = ref(false)
const ruleTitle = ref('')
const approval = ref(false)
const hostClubs = ref<{ id: number; name: string }[]>([])
const isAdmin = ref(false)
const appGame = ref(false)
const f = reactive({
  title: '', ruleId: 0, format: 'KNOCKOUT' as 'LEAGUE' | 'KNOCKOUT', entrantType: 'USER' as 'USER' | 'CLUB', hostClubId: null as number | null,
  membersOnly: false, official: false, maxEntrants: '8', startsAt: '', roundDays: 7, thirdPlace: false, minRating: '', maxRating: '', description: '', boards: 3, perBoard: 1,
})
const canCreate = computed(() => f.title.trim().length >= 2 && f.ruleId > 0 && !!f.startsAt && Number(f.maxEntrants) >= 2)

// 내가 회장·운영진인 동호회를 주최로 고를 수 있다
watch(() => props.modelValue, async (open) => {
  if (!open) return
  GET('/api/auth/onboarding').then(({ data }) => (isAdmin.value = !!data.isAdmin)).catch(() => {})
  const mine = (await GET('/api/clubs/mine')).data
  const details = await Promise.all(mine.map((c) => GET('/api/clubs/{id}', { path: { id: c.id } }).then((r) => r.data).catch(() => null)))
  hostClubs.value = details.filter((d) => d && (d.myRole === 'OWNER' || d.myRole === 'STAFF')).map((d) => ({ id: d!.club.id, name: d!.club.name }))
  if (props.clubId && hostClubs.value.some((c) => c.id === props.clubId)) {
    f.hostClubId = props.clubId
    f.membersOnly = true
    const d = details.find((x) => x?.club.id === props.clubId)
    if (d?.mainRuleId && d.club.mainRuleTitle && !f.ruleId) { f.ruleId = d.mainRuleId; ruleTitle.value = d.club.mainRuleTitle }
  }
})

// 앱 게임은 1:1이라 개인 참가만
function pickRule(r: { id: number; title: string; appGameKey: string | null }) {
  f.ruleId = r.id
  ruleTitle.value = r.title
  appGame.value = !!r.appGameKey
  if (appGame.value) f.entrantType = 'USER'
}

async function create() {
  busy.value = true
  try {
    const { data } = await POST('/api/tournaments', {
      body: {
        title: f.title.trim(), ruleId: f.ruleId, format: f.format, entrantType: f.entrantType, hostClubId: f.hostClubId ?? undefined,
        membersOnly: f.membersOnly && f.entrantType === 'USER', joinMode: approval.value ? 'APPROVAL' : 'OPEN', maxEntrants: Number(f.maxEntrants),
        minRating: f.minRating ? Number(f.minRating) : undefined, maxRating: f.maxRating ? Number(f.maxRating) : undefined,
        startsAt: f.startsAt, roundDays: f.roundDays, thirdPlace: f.format === 'KNOCKOUT' && f.thirdPlace,
        boards: f.boards, perBoard: f.perBoard, description: f.description.trim() || undefined, official: f.official,
      },
    })
    emit('update:modelValue', false)
    router.push(`/tournaments/${data.summary.id}`)
  } catch (e) {
    showToast((e as { response?: { data?: { message?: string } } }).response?.data?.message || '열지 못했어요')
  } finally {
    busy.value = false
  }
}
</script>
