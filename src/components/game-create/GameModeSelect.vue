<template>
  <div class="flex flex-col min-h-full px-5 pt-10 bg-gray-900">
    <div class="mb-8 pt-[10%]">
      <div class="text-2xl font-bold text-white mb-2 mt-7">누구와 겨룰까요?</div>
      <div class="text-gray-400 text-base">장소와 시간은 상대가 정해진 뒤 함께 정해요.</div>
    </div>
    <div class="flex flex-col gap-3">
      <button
        @click="$emit('mode', 'random')"
        class="w-full py-4 px-5 bg-primary active:bg-primary-press text-primary-on text-left rounded-xl"
      >
        <div class="text-lg font-bold">아무나</div>
        <div class="text-sm text-white/80 mt-1">경기 목록에 올려서 신청을 받아요</div>
      </button>
      <button
        @click="showModal = true"
        class="w-full py-4 px-5 bg-gray-800 active:bg-gray-700 text-white text-left rounded-xl border border-gray-700"
      >
        <div class="text-lg font-bold">친구 지정</div>
        <div class="text-sm text-gray-400 mt-1">친구 한 명과 바로 경기를 잡아요</div>
      </button>
    </div>
  </div>

  <div class="fixed bottom-10 w-full p-5">
    <button
      v-if="!isContest"
      @click="router.push('/rules')"
      class="w-full py-4 bg-gray-800 text-gray-300 text-lg font-medium rounded-xl border border-gray-600 shadow-lg hover:bg-gray-700 active:scale-98 transition-all duration-200"
    >
      규칙 다시 선택하기
    </button>
    <button
      v-else
      @click="router.back()"
      class="w-full py-4 bg-gray-800 text-gray-300 text-lg font-medium rounded-xl border border-gray-600 shadow-lg hover:bg-gray-700 active:scale-98 transition-all duration-200"
    >
      <i class="fas fa-arrow-left mr-2"></i>뒤로 가기
    </button>
  </div>

  <friend-modal v-if="showModal" @close="showModal = false" @select="handleFriendSelect" />
</template>

<script setup>
import { ref, defineEmits, defineProps } from 'vue'
import FriendModal from './FriendModal.vue'
import { useRouter } from 'vue-router'
defineProps({
  isContest: {
    type: Boolean,
    default: false,
  },
})

const showModal = ref(false)
const router = useRouter()

const emit = defineEmits(['mode']) // 부모가 또 상위로 이벤트 보낼 경우

function handleFriendSelect(friend) {
  showModal.value = false
  emit('mode', friend.id)
}
</script>
