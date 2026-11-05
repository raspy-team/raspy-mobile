<template>
  <!-- 다른 게임 안에서 하는 규칙: 어느 게임인지와 내 아이디 (9번). 아이디가 없으면 적으러 간다 -->
  <div class="flex items-center gap-3 py-4">
    <span class="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
      <UiIcon name="gamepad" aria-hidden="true" />
    </span>
    <span class="flex-1 min-w-0">
      <span class="block t-body truncate">{{ label }} 안에서 해요</span>
      <span class="block t-caption mt-0.5 truncate">
        <template v-if="mine?.handle">내 {{ mine.game.handleLabel }} {{ mine.handle }}<template v-if="mine.tier"> · {{ mine.tier }}</template></template>
        <template v-else-if="mine">상대가 나를 찾을 {{ mine.game.handleLabel }}를 적어 두세요</template>
        <template v-else>결과 화면을 찍어 올리면 확인이 빨라요</template>
      </span>
    </span>
    <UiButton v-if="mine" variant="ghost" size="sm" :to="editTo">{{ mine.handle ? '바꾸기' : '입력' }}</UiButton>
  </div>
</template>

<script setup lang="ts">
// 규칙·경기 화면에 붙는 '어느 게임에서 하나 + 내 아이디' 한 줄 (9번, 11/6)
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { GET } from '../../api/client'
import type { components } from '../../api/schema'
import { UiButton, UiIcon } from '../ui'

const props = defineProps<{ game: string; label?: string | null }>()
const route = useRoute()
const mine = ref<components['schemas']['AccountView'] | null>(null)
const label = computed(() => props.label || mine.value?.game.label || '다른 게임')
const editTo = computed(() => `/settings/game-accounts?game=${props.game}&from=${encodeURIComponent(route.fullPath)}`)

onMounted(async () => {
  try {
    const list = (await GET('/api/game-accounts/me')).data || []
    mine.value = list.find((a) => a.game.key === props.game) || null
  } catch {
    mine.value = null
  }
})
</script>
