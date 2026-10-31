<template>
  <span class="flex items-center">
    <span class="relative">
      <UiIconButton icon="far fa-paper-plane" :label="dmUnread ? `메시지, 안 읽은 ${dmUnread}개` : '메시지'" @click="router.push('/dm')" />
      <span v-if="dmUnread" class="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-fg text-[11px] font-bold leading-[18px] text-center pointer-events-none" aria-hidden="true">{{ dmUnread > 99 ? '99+' : dmUnread }}</span>
    </span>
    <span class="relative">
      <UiIconButton icon="far fa-bell" :label="unreadNotifications ? `알림, 새 알림 ${unreadNotifications}개` : '알림'" @click="router.push('/notifications')" />
      <span v-if="unreadNotifications" class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary pointer-events-none" aria-hidden="true"></span>
    </span>
  </span>
</template>

<script setup>
// 탭 화면 위 오른쪽의 메시지·알림 버튼. 메시지는 개수, 알림은 점으로 표시한다
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UiIconButton } from '../ui'
import { startInbox, useInbox } from '../../stores/inbox'

const router = useRouter()
const { unreadNotifications, dmUnread } = useInbox()
// 로그인 직후(새로고침 없이) 들어와도 시작되게. 이미 시작했으면 아무것도 하지 않는다
onMounted(startInbox)
</script>
