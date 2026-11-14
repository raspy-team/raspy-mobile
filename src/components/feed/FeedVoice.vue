<template>
  <!-- 오른 실력 점수 + 사람 목소리: 공개된 한마디가 있으면 그것, 없으면 AI 기자 한 줄 (셋이 다 쌓이면 무거워서) -->
  <div v-if="gains.length || quote || ai" class="mt-3 space-y-2">
    <p v-if="gains.length" class="t-micro tabular-nums">
      실력 점수 <span v-for="(g, i) in gains" :key="g.userId">{{ i ? ' · ' : '' }}{{ g.name }} {{ g.ratingAfter }} <span class="text-fg">+{{ g.gain }}</span></span>
    </p>
    <p v-if="quote" class="t-body break-words">“{{ quote.text }}” <span class="t-micro">{{ quote.name }}</span></p>
    <p v-else-if="ai" class="t-body break-words"><span class="t-micro mr-1">AI 기자</span>{{ ai }}</p>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({ post: { type: Object, required: true } })
const names = computed(() => Object.fromEntries((props.post.players || []).map((p) => [p.id, p.name])))
// 오른 사람만 온다 (진 쪽 하락은 소식에 싣지 않는다)
const gains = computed(() => (props.post.story?.gains || []).filter((g) => names.value[g.userId]).map((g) => ({ ...g, name: names.value[g.userId] })))
const quote = computed(() => props.post.story?.quotes?.[0])
const ai = computed(() => props.post.story?.aiSummary)
</script>
