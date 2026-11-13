<template>
  <!-- 끝난 판 자랑하기 (11/13 고병연: 결과 화면이면 다 있어야 한다). 자랑하고 싶은 순간은 결과가 나온 그때다 (Strava·나이키 런 클럽의 끝 화면처럼).
       소식 카드를 받아 공유 시트(스토리 그림·링크)로. 무효 판처럼 보여 줄 게 없으면 부르는 쪽이 그리지 않는다 -->
  <!-- 다른 결과 화면(앱 게임·동네 경기)과 같이 위 막대의 공유 아이콘 하나 -->
  <UiIconButton icon="share" label="결과 공유" :disabled="loading" @click="open" />
  <ShareSheet v-if="post" :post="post" :my-id="myId" @close="post = null" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { GET } from '@/api/client'
import { UiIconButton } from '../ui'
import { getMyId } from '../../utils/me'
import { useToast } from '../../composables/useToast'

const ShareSheet = defineAsyncComponent(() => import('../feed/story/ShareSheet.vue'))
const props = defineProps<{ gameId: number }>()
const { showToast } = useToast()
const post = ref<unknown>(null)
const loading = ref(false)
const myId = ref<number | null>(null)
getMyId().then((id: number | null) => (myId.value = id))

async function open() {
  loading.value = true
  try {
    post.value = (await GET('/api/feed/game/{gameId}', { path: { gameId: props.gameId } })).data
  } catch {
    showToast('결과를 불러오지 못했어요')
  } finally {
    loading.value = false
  }
}
</script>
