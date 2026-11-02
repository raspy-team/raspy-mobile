<template>
  <UiCard class="flex items-center gap-3 py-3 cursor-pointer active:bg-surface-2" role="button" @click="emit('click')">
    <span class="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-fg-muted flex-shrink-0" aria-hidden="true">
      <UiIcon name="users" />
    </span>
    <div class="flex-1 min-w-0">
      <p class="t-heading truncate">{{ club.name }}</p>
      <p class="t-caption truncate">{{ [club.dongName, `${club.memberCount}명`, club.intro].filter(Boolean).join(' · ') }}</p>
    </div>
    <slot />
  </UiCard>
</template>

<script setup lang="ts">
import type { components } from '@/api/schema'
import { UiCard, UiIcon } from '../ui'

defineProps<{ club: components['schemas']['ClubSummary'] }>()
const emit = defineEmits<{ click: [] }>()
</script>
