<template>
  <div class="fixed inset-0 bg-canvas flex flex-col">
    <UiTopBar title="꾸미기" back />
    <AvatarEditor class="flex-1 min-h-0" mode="edit" @saved="saved" />
  </div>
</template>

<script setup lang="ts">
// 캐릭터 꾸미기 (/plaza/avatar): 해낸 일로 열린 부품을 입는다(11/13). 저장하면 광장으로 돌아간다
import { useRouter } from 'vue-router'
import AvatarEditor from '../../components/plaza/AvatarEditor.vue'
import { UiTopBar } from '../../components/ui'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { showToast } = useToast()
function saved() {
  showToast('저장했어요')
  if (window.history.state?.back) router.back()
  else router.replace('/plaza')
}
</script>
