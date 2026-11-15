<template>
  <!-- 오른 실력 점수 + 사람 목소리: 공개된 한마디가 있으면 그것, 없으면 AI 기자 한 줄. 기자 줄이 맨 위 이야기 줄과 같은 사실이면 제목으로 올라가 여기서는 빠진다 (story/headline.js) -->
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
import { reporterIsHeadline } from './story/headline'

const props = defineProps({ post: { type: Object, required: true } })
const names = computed(() => Object.fromEntries((props.post.players || []).map((p) => [p.id, p.name])))
// 오른 사람만 온다 (진 쪽 하락은 소식에 싣지 않는다)
const gains = computed(() => (props.post.story?.gains || []).filter((g) => names.value[g.userId]).map((g) => ({ ...g, name: names.value[g.userId] })))
const quote = computed(() => props.post.story?.quotes?.[0])
const ai = computed(() => (reporterIsHeadline(props.post.story) ? '' : props.post.story?.aiSummary))
</script>
