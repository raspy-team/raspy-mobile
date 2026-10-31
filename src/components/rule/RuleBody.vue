<template>
  <div class="space-y-8">
    <!-- 이기는 법: 아이콘 줄 -->
    <ul class="space-y-5">
      <li v-for="f in facts" :key="f.title" class="flex items-start gap-4">
        <i :class="f.icon" class="w-6 text-center text-lg text-fg mt-0.5" aria-hidden="true"></i>
        <span>
          <span class="block t-heading">{{ f.title }}</span>
          <span class="block t-caption mt-0.5">{{ f.body }}</span>
        </span>
      </li>
    </ul>

    <!-- 글로 적힌 규칙 -->
    <div v-if="sections.length" class="border-t border-line pt-8 space-y-6">
      <section v-for="s in sections" :key="s.key">
        <h3 class="t-label text-fg">{{ s.title }}</h3>
        <p class="t-body text-fg-muted mt-1.5 whitespace-pre-line break-words">{{ s.body }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
// 규칙 내용: 이기는 법(숫자) + 글로 적힌 항목. 상세 화면과 경기 중 규칙 시트가 같이 쓴다
import { computed, defineProps } from 'vue'
import { ruleFacts, ruleSections } from '../../utils/rule'

const props = defineProps({ rule: { type: Object, required: true } })
const facts = computed(() => ruleFacts(props.rule))
const sections = computed(() => ruleSections(props.rule))
</script>
