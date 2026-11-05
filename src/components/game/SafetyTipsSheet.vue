<template>
  <UiSheet :model-value="modelValue" title="만나기 전에" @update:model-value="(v) => emit('update:modelValue', v)">
    <ul class="space-y-4">
      <li v-for="t in (more ? TIPS : TIPS.slice(0, 3))" :key="t.title" class="flex gap-3">
        <span class="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0" aria-hidden="true"><UiIcon :name="t.icon" /></span>
        <span class="flex-1 min-w-0">
          <span class="block t-heading">{{ t.title }}</span>
          <span class="block t-caption mt-0.5">{{ t.body }}</span>
        </span>
      </li>
    </ul>
    <button v-if="!more" type="button" class="mt-4 t-caption underline underline-offset-2" @click="more = true">더 보기</button>
    <template #footer>
      <div class="flex gap-2">
        <UiButton v-if="canTellFriend" class="flex-1" variant="secondary" icon="shield-halved" @click="emit('tell-friend')">친구에게 알리기</UiButton>
        <UiButton class="flex-1" @click="emit('update:modelValue', false)">확인</UiButton>
      </div>
    </template>
  </UiSheet>
</template>

<script setup>
// 만나기 전 안전 수칙 (기능 검토 #1, 사용자 11/3: 틴더·당근의 만나기 전 안내를 그대로).
// 만나서 하는 경기의 상대가 처음 정해졌을 때 한 번 저절로 뜨고, 내 경기 더보기에서 언제든 다시 본다.
// 1시간 전 알림에도 한 줄 붙는다 (서버 PushUtil GAME_REMINDER)
import { ref, defineProps, defineEmits } from 'vue'
import { UiButton, UiIcon, UiSheet } from '../ui'

defineProps({
  modelValue: { type: Boolean, default: false },
  opponent: { type: String, default: '' },
  canTellFriend: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'tell-friend'])

const more = ref(false)
// 앞의 셋만 먼저 보인다 (UX ③, 11/5: 확정되자마자 일곱 줄은 길었다)
const TIPS = [
  { icon: 'user-group', title: '사람 많은 곳에서', body: '체육관·공원처럼 열린 곳에서 만나요' },
  { icon: 'shield-halved', title: '위치 공유', body: "경기 3시간 전부터 '내 위치 공유'를 켤 수 있어요" },
  { icon: 'triangle-exclamation', title: '불편하면 그만두기', body: '언제든 멈추고, 메시지나 프로필에서 신고할 수 있어요' },
  { icon: 'comment', title: '이야기는 앱 메시지로', body: '전화번호를 주지 않아도 돼요' },
  { icon: 'location-dot', title: "도착하면 '도착했어요'", body: '상대가 안 오면 노쇼로 알릴 수 있어요' },
  { icon: 'user', title: '상대가 미성년자라면', body: '보호자에게 알리고 동의를 받아요. 만 14세 미만은 매치를 쓸 수 없어요' },
  { icon: 'star', title: '신뢰 온도 보기', body: '만나서 한 경기, 매너, 노쇼가 프로필에 있어요' },
]
</script>
