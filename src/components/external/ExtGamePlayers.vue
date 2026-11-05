<template>
  <!-- 다른 게임 안에서 하는 경기: 선수마다 그 게임 아이디. 눌러서 복사해 그 게임에서 친구 추가 (9번) -->
  <section v-if="info" class="py-4" :aria-label="`${info.game.label} 아이디`">
    <h3 class="t-caption mb-2">{{ info.game.label }}에서 서로 찾기 · {{ info.game.handleLabel }}</h3>
    <ul class="divide-y divide-line">
      <li v-for="p in info.players" :key="p.userId" class="flex items-center gap-3 py-2.5">
        <span class="flex-1 min-w-0">
          <span class="block t-body truncate">{{ p.nickname }}<span v-if="p.userId === myId" class="t-caption"> (나)</span></span>
          <span class="block t-caption truncate">
            <template v-if="p.handle">{{ p.handle }}<template v-if="p.tier"> · {{ p.tier }}</template></template>
            <template v-else>아직 안 적었어요</template>
          </span>
        </span>
        <UiButton v-if="p.handle" variant="ghost" size="sm" @click="copy(p.handle)">복사</UiButton>
        <UiButton v-else-if="p.userId === myId" variant="ghost" size="sm" :to="editTo">입력</UiButton>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// 경기 화면의 '그 게임에서 서로 찾기' (9번, 11/6). 그 게임 안에서 하는 규칙의 경기가 아니면 아무것도 그리지 않는다
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '../../api/client'
import type { components } from '../../api/schema'
import { UiButton } from '../ui'
import { useToast } from '../../composables/useToast'
import { copyText } from '../../utils/clipboard'
import { getMyId } from '../../utils/me'

const props = defineProps<{ gameId: number | string }>()
const route = useRoute()
const { showToast } = useToast()
const info = ref<components['schemas']['GameAccounts'] | null>(null)
const myId = ref<number | null>(null)
const editTo = computed(() => (info.value ? `/settings/game-accounts?game=${info.value.game.key}&from=${encodeURIComponent(route.fullPath)}` : '/settings/game-accounts'))

async function copy(text: string) {
  showToast((await copyText(text)) ? '복사했어요. 그 게임에서 친구 추가해 보세요' : '복사하지 못했어요')
}

onMounted(async () => {
  try {
    myId.value = Number(await getMyId()) || null
  } catch {
    myId.value = null
  }
  try {
    const { data } = await GET('/api/games/{gameId}/game-accounts', { path: { gameId: Number(props.gameId) } })
    info.value = data && typeof data === 'object' ? data : null
  } catch {
    info.value = null
  }
})
</script>
