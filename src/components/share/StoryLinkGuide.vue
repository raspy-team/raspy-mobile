<template>
  <!-- 스토리에 링크 스티커를 붙이게 (11/14, README 3-6): 인스타는 링크 스티커를 미리 붙여 주지 않는다. 그림만 올라가면 친구가 누를 수 없다.
       예전엔 버튼 밑 한 줄 안내뿐이라 대부분 그림만 올렸다. 처음 두 번은 인스타를 열기 전에 세 단계를 보여 준다(링크는 이미 복사돼 있다).
       '왜'를 먼저 말한다: 붙여야 친구가 같은 상황으로 들어오고, 친구 답과 승패가 나에게 온다 -->
  <UiSheet :model-value="modelValue" title="링크를 붙여야 친구가 들어와요" @update:model-value="emit('update:modelValue', $event)">
    <p class="t-body break-keep">그림만 올리면 친구가 누를 수 없어요. <b>링크는 방금 복사해 뒀어요.</b></p>
    <ol class="mt-4 space-y-3">
      <li v-for="(s, i) in STEPS" :key="i" class="flex items-center gap-3">
        <span class="w-9 h-9 shrink-0 rounded-full bg-surface-2 flex items-center justify-center t-label tabular-nums">{{ i + 1 }}</span>
        <span class="flex-1 t-body text-fg break-keep" v-html="s" />
      </li>
    </ol>
    <p class="t-caption mt-4 break-keep">친구가 그 링크로 풀면 같은 상황으로 1:1이 돼요. 친구가 뭐라고 답했는지도 볼 수 있어요</p>
    <template #footer>
      <!-- 인스타·카톡 앱 안 브라우저는 스토리 편집기를 바로 못 연다: 그림을 저장하게 되니 그렇게 말한다 (11/14: 스토리 링크로 온 사람은 대부분 여기다) -->
      <UiButton block size="lg" icon="instagram" @click="emit('go')">{{ inAppBrowser ? '그림 저장하기' : hasNativeInstagram ? '스토리 열기' : '공유 창 열기' }}</UiButton>
    </template>
  </UiSheet>
</template>

<script setup lang="ts">
import { UiButton, UiSheet } from '../ui'
import { inAppBrowser, hasNativeInstagram } from '@/utils/nativeBridge'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'go'): void }>()

// 인스타 스토리 편집 화면의 실제 순서 (스티커 버튼은 위쪽 네모 웃는 얼굴)
const STEPS = [
  ...(inAppBrowser ? ['그림을 <b>길게 눌러 저장</b>하고, 인스타에서 <b>스토리 만들기</b>로 그 그림 고르기'] : hasNativeInstagram ? [] : ['공유 창에서 <b>Instagram → 스토리</b> 고르기']),  // 웹은 인스타 편집기를 바로 열 수 없다: 공유 창을 거친다 (11/14)
  '스토리 화면 위쪽 <b>스티커</b> 버튼(네모 웃는 얼굴) 누르기',
  '<b>링크</b> 스티커 고르기',
  '주소 칸을 길게 눌러 <b>붙여넣기</b> → 완료',
]
</script>

<script lang="ts">
// 안내를 몇 번 봤나 (이 기기). 두 번 본 뒤로는 바로 인스타를 연다: 판마다 같은 안내는 피로다 (11/11 쌓이는 피로)
const KEY = 'story_guide_seen'
export function storyGuideNeeded(): boolean {
  try { return Number(localStorage.getItem(KEY) || 0) < 2 } catch { return false }
}
export function storyGuideSeen() {
  try { localStorage.setItem(KEY, String(Number(localStorage.getItem(KEY) || 0) + 1)) } catch { /* 다음에도 안내가 뜰 뿐 */ }
}
</script>
