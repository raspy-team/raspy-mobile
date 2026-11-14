<template>
  <div v-if="options" class="space-y-7">
    <UiField label="상대와 어떻게 하나요?">
      <div class="grid grid-cols-2 gap-2" role="radiogroup">
        <button
          v-for="f in options.faces"
          :key="f.key"
          type="button"
          role="radio"
          :aria-checked="model.face === f.key"
          class="p-3 rounded-xl text-left border transition-colors"
          :class="model.face === f.key ? 'border-fg bg-surface-2' : 'border-line bg-surface'"
          @click="model.face = f.key"
        >
          <span class="block text-body font-semibold text-fg">{{ FACE_HELP[f.key]?.title ?? f.label }}</span>
          <span class="block t-caption mt-0.5">{{ FACE_HELP[f.key]?.example }}</span>
        </button>
      </div>
    </UiField>

    <UiField :label="`무엇이 어려운가요? (${options.maxAbilities}개까지)`">
      <div v-for="g in options.abilityGroups" :key="g.key" class="mb-3 last:mb-0">
        <p class="t-micro mb-1.5">{{ g.label }}</p>
        <div class="flex flex-wrap gap-2">
          <UiChip
            v-for="a in options.abilities.filter((x) => x.group === g.key)"
            :key="a.key"
            :selected="model.abilities.includes(a.key)"
            :disabled="!model.abilities.includes(a.key) && model.abilities.length >= options.maxAbilities"
            @click="toggle('abilities', a.key)"
          >
            {{ a.label }}
          </UiChip>
        </div>
      </div>
    </UiField>

    <UiField label="이런 게 있나요? (있을 때만)">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="t in options.traits" :key="t.key" :selected="model.traits.includes(t.key)" @click="toggle('traits', t.key)">{{ t.label }}</UiChip>
      </div>
    </UiField>

    <UiField label="운이 섞이나요?">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="l in options.lucks" :key="l.key" :selected="model.luck === l.key" @click="model.luck = l.key">{{ l.label }}</UiChip>
      </div>
    </UiField>

    <UiField label="어디서 하나요?">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="p in options.places" :key="p.key" :selected="model.places.includes(p.key)" @click="toggle('places', p.key)">{{ p.label }}</UiChip>
      </div>
    </UiField>

    <UiField label="몇 명이 함께하나요?">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="p in options.parties" :key="p.key" :selected="model.parties.includes(p.key)" @click="toggle('parties', p.key)">{{ p.label }}</UiChip>
      </div>
      <p class="t-caption mt-1.5">상대가 앱 안에 있거나 각자 기록하면 '혼자'예요</p>
    </UiField>

    <UiField label="한 판에 얼마나 걸리나요?">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="l in options.lengths" :key="l.key" :selected="model.length === l.key" @click="model.length = l.key">{{ l.label }}</UiChip>
      </div>
    </UiField>

    <UiField label="준비물은?">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="g in options.gears" :key="g.key" :selected="model.gears.includes(g.key)" @click="toggle('gears', g.key)">{{ g.label }}</UiChip>
      </div>
    </UiField>

    <UiInput v-model="model.sport" label="바탕이 되는 종목" optional :maxlength="40" placeholder="예: 탁구 (없으면 비워 두세요)" />
  </div>
  <!-- 선택지를 못 받으면 회색 상자로 멈추고 '규칙 만들기'는 빠진 분류만 말했다: 다 쓰고도 이유를 몰랐다 (목적 판정 6) -->
  <div v-else-if="failed" class="rounded-xl bg-surface-2 p-4">
    <p class="t-body">분류를 불러오지 못했어요</p>
    <UiButton variant="secondary" size="sm" class="mt-3" @click="loadOptions">다시 시도</UiButton>
  </div>
  <UiSkeleton v-else class="h-64 w-full" />
</template>

<script setup lang="ts">
// 규칙 카테고리 고르기 (만들기 화면의 '이렇게 분류했어요'). AI가 채운 값을 만든 사람이 확인하고 고친다.
// ①맞닿는 방식은 쉬운 질문으로 묻는다 (docs/direction.md '카테고리')
import { ref, onMounted } from 'vue'
import { GET } from '@/api/client'
import type { components } from '@/api/schema'
import { FACE_HELP, type CategoryInput } from '@/utils/category'
import { UiButton, UiChip, UiField, UiInput, UiSkeleton } from '../ui'

const model = defineModel<CategoryInput>({ required: true })
const options = ref<components['schemas']['CategoryOptions'] | null>(null)

type ListKey = 'abilities' | 'traits' | 'places' | 'parties' | 'gears'
function toggle(key: ListKey, value: string) {
  const list = model.value[key] ?? []
  model.value[key] = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

const failed = ref(false)
async function loadOptions() {
  failed.value = false
  try {
    options.value = (await GET('/api/rules/category-options')).data
  } catch {
    failed.value = true
  }
}
onMounted(loadOptions)
</script>
