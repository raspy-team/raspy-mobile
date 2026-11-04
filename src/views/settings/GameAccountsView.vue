<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="게임 계정" :back="backTo" />

    <main class="max-w-2xl mx-auto px-4 pt-2 pb-16">
      <p class="t-caption py-3">롤·피파·브롤 같은 게임으로 붙을 때, 상대가 이 아이디로 나를 찾아요. 그 게임 경기의 선수에게만 보여요.</p>

      <UiListSkeleton v-if="loading" :rows="6" />
      <UiEmptyState v-else-if="error" icon="fas fa-triangle-exclamation" title="게임 계정을 불러오지 못했어요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>

      <ul v-else class="divide-y divide-line ui-appear">
        <li v-for="a in accounts" :key="a.game.key" class="py-4">
          <button type="button" class="w-full flex items-center gap-4 text-left min-h-11" @click="open(a)">
            <span class="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
              <UiIcon name="gamepad" aria-hidden="true" />
            </span>
            <span class="flex-1 min-w-0">
              <span class="block t-body truncate">{{ a.game.label }}</span>
              <span class="block t-caption mt-0.5 truncate">
                {{ a.handle ? a.handle : `${a.game.handleLabel} 적기` }}<template v-if="a.tier"> · {{ a.tier }}</template>
              </span>
            </span>
            <UiIcon name="fas fa-chevron-right" class="text-fg-subtle text-xs" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </main>

    <UiSheet :model-value="!!editing" :title="editing?.game.label" @update:model-value="(v) => !v && (editing = null)">
      <form v-if="editing" class="space-y-4" @submit.prevent="save">
        <UiInput
          v-model="handle"
          :label="editing.game.handleLabel"
          :hint="formError ? '' : editing.game.platform"
          :error="formError"
          :placeholder="editing.game.handleHint"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <p class="t-caption">
          <template v-if="editing.game.tierAvailable">
            저장하면 공식 정보에서 티어를 가져와요<template v-if="editing.tier"> · 지금 {{ editing.tier }}</template>
          </template>
          <template v-else>티어 연결은 준비 중이에요. 아이디는 바로 상대에게 보여요.</template>
        </p>
        <div class="flex gap-2">
          <UiButton v-if="editing.handle" type="button" variant="secondary" :disabled="busy" @click="remove">지우기</UiButton>
          <UiButton
            v-if="editing.handle && editing.game.tierAvailable"
            type="button"
            variant="secondary"
            :disabled="busy"
            @click="refresh"
          >
            티어 새로
          </UiButton>
          <UiButton type="submit" class="flex-1" :disabled="busy || !handle.trim()">{{ busy ? '저장 중…' : '저장' }}</UiButton>
        </div>
      </form>
    </UiSheet>
  </div>
</template>

<script setup lang="ts">
// 설정 > 게임 계정 (9번, 11/6): 인기 게임마다 내 아이디를 적고, 되는 게임은 공식 정보로 티어를 가져온다
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET, PUT, POST, DELETE } from '../../api/client'
import type { components } from '../../api/schema'
import { UiButton, UiEmptyState, UiIcon, UiInput, UiListSkeleton, UiSheet, UiTopBar } from '../../components/ui'
import { useToast } from '../../composable/useToast'

type Account = components['schemas']['AccountView']

const route = useRoute()
const { showToast } = useToast()
// 규칙·경기 화면에서 왔으면 거기로 돌아간다
const backTo = computed(() => (typeof route.query.from === 'string' && route.query.from.startsWith('/') ? route.query.from : '/settings'))

const accounts = ref<Account[]>([])
const loading = ref(true)
const error = ref(false)
const editing = ref<Account | null>(null)
const handle = ref('')
const formError = ref('')
const busy = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    accounts.value = (await GET('/api/game-accounts/me')).data || []
    const want = route.query.game
    if (typeof want === 'string') {
      const a = accounts.value.find((x) => x.game.key === want)
      if (a) open(a)
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function open(a: Account) {
  editing.value = a
  handle.value = a.handle || ''
  formError.value = ''
}

function replace(next: Account) {
  accounts.value = accounts.value.map((a) => (a.game.key === next.game.key ? next : a))
}

function message(e: unknown, fallback: string) {
  const m = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
  return m || fallback
}

async function save() {
  if (!editing.value) return
  busy.value = true
  formError.value = ''
  try {
    const { data } = await PUT('/api/game-accounts/{game}', {
      path: { game: editing.value.game.key },
      body: { handle: handle.value },
    })
    if (data) {
      replace(data.account)
      showToast(data.tierError ? `저장했어요. ${data.tierError}` : '저장했어요')
    }
    editing.value = null
  } catch (e) {
    formError.value = message(e, '저장하지 못했어요')
  } finally {
    busy.value = false
  }
}

async function refresh() {
  if (!editing.value) return
  busy.value = true
  try {
    const { data } = await POST('/api/game-accounts/{game}/refresh', { path: { game: editing.value.game.key } })
    if (data) {
      replace(data.account)
      editing.value = data.account
      showToast(data.tierError || (data.account.tier ? `티어: ${data.account.tier}` : '랭크 정보가 없어요'))
    }
  } catch (e) {
    showToast(message(e, '티어를 가져오지 못했어요'))
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!editing.value) return
  busy.value = true
  try {
    await DELETE('/api/game-accounts/{game}', { path: { game: editing.value.game.key } })
    replace({ ...editing.value, handle: undefined, tier: undefined, tierCheckedAt: undefined } as Account)
    editing.value = null
    showToast('지웠어요')
  } catch (e) {
    showToast(message(e, '지우지 못했어요'))
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
