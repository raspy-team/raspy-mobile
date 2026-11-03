<template>
  <UiSheet :model-value="modelValue" title="만나기 전에" @update:model-value="(v) => emit('update:modelValue', v)">
    <p class="t-caption">{{ opponent ? `${opponent}님과 처음 만나요. ` : '' }}안전하게 즐기려면 이것만 지켜 주세요</p>
    <ul class="mt-4 space-y-4">
      <li v-for="t in TIPS" :key="t.title" class="flex gap-3">
        <span class="w-9 h-9 rounded-full bg-surface flex items-center justify-center flex-shrink-0" aria-hidden="true"><UiIcon :name="t.icon" /></span>
        <span class="flex-1 min-w-0">
          <span class="block t-heading">{{ t.title }}</span>
          <span class="block t-caption mt-0.5">{{ t.body }}</span>
        </span>
      </li>
    </ul>
    <template #footer>
      <div class="flex gap-2">
        <UiButton v-if="canTellFriend" class="flex-1" variant="secondary" icon="shield-halved" @click="emit('tell-friend')">친구에게 알리기</UiButton>
        <UiButton class="flex-1" @click="emit('update:modelValue', false)">알겠어요</UiButton>
      </div>
    </template>
  </UiSheet>
</template>

<script setup>
// 만나기 전 안전 수칙 (기능 검토 #1, 사용자 11/3: 틴더·당근의 만나기 전 안내를 그대로).
// 만나서 하는 경기의 상대가 처음 정해졌을 때 한 번 저절로 뜨고, 내 경기 더보기에서 언제든 다시 본다.
// 1시간 전 알림에도 한 줄 붙는다 (서버 PushUtil GAME_REMINDER)
import { defineProps, defineEmits } from 'vue'
import { UiButton, UiIcon, UiSheet } from '../ui'

defineProps({
  modelValue: { type: Boolean, default: false },
  opponent: { type: String, default: '' },
  canTellFriend: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'tell-friend'])

const TIPS = [
  { icon: 'user-group', title: '사람 많은 곳에서 만나요', body: '처음엔 체육관·공원·운동장처럼 열린 곳에서. 집이나 차 안처럼 둘만 있는 곳은 피해요' },
  { icon: 'shield-halved', title: '친구에게 위치를 공유하세요', body: "경기 3시간 전부터 내 경기에서 '친구에게 내 위치 공유'를 켜면 경기 동안 위치와 '잘 끝났어요'가 친구에게 가요" },
  { icon: 'comment', title: '이야기는 앱 메시지로', body: '만나기 전까지는 전화번호나 다른 메신저를 주지 않아도 돼요' },
  { icon: 'triangle-exclamation', title: '불편하면 바로 그만두기', body: '경기 중이라도 언제든 멈춰도 돼요. 이상한 요구를 하면 메시지나 프로필의 신고·차단을 눌러 주세요. 운영진이 바로 확인해요' },
  { icon: 'location-dot', title: "도착하면 '도착했어요'", body: '상대가 안 오면 노쇼로 알릴 수 있어요. 노쇼가 거듭되면 만나서 하는 경기가 막혀요' },
  { icon: 'star', title: '상대의 매치 온도를 확인해요', body: '만나서 한 경기, 매너 평가, 결과 이견이 프로필에 있어요' },
]
</script>
