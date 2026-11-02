<template>
  <div>
    <UiTopBar title="경기 만들기" back />

    <main class="px-4 pt-4 pb-12 max-w-xl mx-auto">
      <!-- 열렸어요: 서버가 만든 뒤에만 보인다 -->
      <section v-if="created" class="pt-16 text-center ui-appear">
        <span class="mx-auto w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center text-2xl" aria-hidden="true">
          <UiIcon name="fas fa-check" />
        </span>
        <h1 class="t-title mt-5">경기가 열렸어요</h1>
        <p class="t-caption mt-2">
          {{ friend ? `${friend.nickname}님에게 알렸어요. 장소와 시간은 내 경기에서 함께 정해요.` : '열린 경기에 올라갔어요. 링크를 보내면 아는 사람이 바로 신청할 수 있어요.' }}
        </p>
        <!-- 아무나로 열었으면, 기다리기만 하기보다 아는 사람을 먼저 부르게 -->
        <UiButton v-if="!friend && createdId" block size="lg" class="mt-10" icon="share" :loading="sharing" @click="shareGame">링크 보내서 상대 부르기</UiButton>
        <UiButton block size="lg" :variant="!friend && createdId ? 'ghost' : 'primary'" :class="!friend && createdId ? 'mt-2' : 'mt-10'" to="/game">내 경기 보기</UiButton>
      </section>

      <!-- 누구와 -->
      <template v-else>
        <UiCard v-if="rule" class="flex items-center gap-3 mb-8">
          <RuleThumb :rule="rule" :size="36" bare />
          <div class="flex-1 min-w-0">
            <p class="t-micro">규칙</p>
            <p class="t-heading truncate">{{ rule.ruleTitle }}</p>
          </div>
          <UiButton variant="ghost" size="sm" @click="router.push('/rules?fromGameCreate=true')">바꾸기</UiButton>
        </UiCard>

        <!-- 언제쯤: 열린 경기를 보는 사람이 신청할지 정하는 데 가장 필요한 정보. 정확한 시간은 상대와 함께 -->
        <h1 class="t-title">언제쯤 할까요?</h1>
        <div class="flex flex-wrap gap-2 mt-3 mb-8">
          <UiChip v-for="w in WHEN" :key="w.label" :selected="when === w.label" @click="when = w.label">{{ w.label }}</UiChip>
        </div>

        <h1 class="t-title">누구와 겨룰까요?</h1>
        <p class="t-caption mt-1 mb-5">시간·장소는 나중에 내 경기에서 언제든 정하거나 바꿀 수 있어요.</p>

        <div class="space-y-2">
          <button
            v-for="opt in OPTIONS"
            :key="opt.value"
            type="button"
            class="w-full flex items-center gap-4 p-4 rounded-xl bg-surface text-left active:bg-surface-2 disabled:opacity-50"
            :disabled="creating"
            @click="opt.value === 'anyone' ? create(null) : (friendsOpen = true)"
          >
            <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
              <UiIcon :name="opt.icon" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block t-heading">{{ opt.title }}</span>
              <span class="block t-caption mt-0.5">{{ opt.description }}</span>
            </span>
            <UiSpinner v-if="creating && opt.value === 'anyone' && !friend" size="sm" label="여는 중" />
            <UiIcon name="fas fa-chevron-right" class="text-fg-subtle" v-else  aria-hidden="true" />
          </button>
        </div>
      </template>
    </main>

    <!-- 친구 고르기 -->
    <UiSheet v-model="friendsOpen" title="누구와 할까요?">
      <UiInput v-model="q" icon="fas fa-magnifying-glass" placeholder="닉네임이나 아이디" class="mb-3" />
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <UiEmptyState
        v-else-if="!friends.length"
        icon="fas fa-user-group"
        title="아직 친구가 없어요"
        description="'아무나'로 열거나, 경기를 한 상대에게 친구 요청을 보내보세요"
      />
      <UiEmptyState v-else-if="!filteredFriends.length" icon="fas fa-magnifying-glass" title="찾는 친구가 없어요" />
      <UiList v-else>
        <UiListItem
          v-for="f in filteredFriends"
          :key="f.id"
          :title="f.nickname"
          :subtitle="'@' + f.username"
          :disabled="creating"
          @click="create(f)"
        >
          <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" size="sm" /></template>
        </UiListItem>
      </UiList>
    </UiSheet>
  </div>
</template>

<script setup>
// 경기 만들기: 규칙은 /rules에서 고르고 돌아온다. 여기서는 상대(아무나 / 친구)만 정하면 경기가 열린다.
// 장소·시간은 상대가 정해진 뒤 내 경기에서 함께 정한다
import { ref, computed, onMounted } from 'vue'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import { haptic } from '../../utils/haptics'
import { shareLink } from '../../utils/share'
import { quickTimes } from '../../utils/when'
import {
  UiAvatar, UiButton, UiCard, UiChip, UiEmptyState, UiInput, UiList, UiListItem, UiListSkeleton, UiSheet, UiSpinner, UiTopBar,
} from '../../components/ui'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const OPTIONS = [
  { value: 'anyone', icon: 'globe', title: '아무나', description: '경기 목록에 올려서 신청을 받아요' },
  { value: 'friend', icon: 'user-check', title: '친구와', description: '친구 한 명과 바로 경기를 잡아요' },
]

const WHEN = [...quickTimes(), { label: '나중에 정하기', date: () => null }]
const when = ref('나중에 정하기')

const ruleId = Number(route.query.ruleId)
const createdId = ref(null)
const sharing = ref(false)

async function shareGame() {
  sharing.value = true
  try {
    const { data } = await api.post('/api/invite', null, { params: { gameId: createdId.value } })
    const msg = await shareLink(data.url, `${rule.value?.ruleTitle || '경기'} 한 판 할래요? 매치에서 신청해 주세요`)
    if (msg) showToast(msg)
  } catch {
    showToast('링크를 만들지 못했어요')
  } finally {
    sharing.value = false
  }
}
const rule = ref(null)
const friend = ref(null)
const creating = ref(false)
const created = ref(false)

const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])
const q = ref('')
const filteredFriends = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return friends.value
  return friends.value.filter((f) => f.nickname?.toLowerCase().includes(k) || f.username?.toLowerCase().includes(k))
})

async function create(target) {
  if (creating.value) return
  creating.value = true
  friend.value = target
  try {
    const matchDate = WHEN.find((w) => w.label === when.value)?.date() ?? null
    const payload = { referencedRuleId: ruleId, friendId: target?.id ?? null, matchDate }
    const { data } = await api.post(target ? '/api/games/create-friend-game' : '/api/games/create', payload)
    createdId.value = data
    friendsOpen.value = false
    created.value = true
    haptic('success')
  } catch (e) {
    friend.value = null
    showToast(e.response?.data?.message || '경기를 열지 못했어요. 다시 시도해 주세요')
  } finally {
    creating.value = false
  }
}

async function loadFriends() {
  friendsLoading.value = true
  try {
    friends.value = (await api.get('/api/friends/my')).data || []
  } catch {
    showToast('친구 목록을 불러오지 못했어요')
  } finally {
    friendsLoading.value = false
  }
}

onMounted(() => {
  // 규칙 없이 들어오면 규칙부터 고른다
  if (!ruleId) {
    router.replace('/rules?fromGameCreate=true')
    return
  }
  api.get(`/api/rules/${ruleId}`).then(({ data }) => (rule.value = data)).catch(() => {})
  loadFriends()
})
</script>
