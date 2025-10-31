<template>
  <div class="flex flex-col min-h-full px-5 pt-10">
    <div class="text-center mb-7 pt-[10%]">
      <div class="text-lg font-bold text-gray-900 mb-2 mt-7">친구를 상대로 지정하시겠어요?</div>
      <div class="text-gray-500 text-base mb-7">
        친구를 지정하면 해당 친구와 경기를 생성할 수 있습니다.
      </div>
    </div>
    <div class="flex flex-col gap-2 mb-5">
      <button
        @click="$emit('mode', 'random')"
        class="w-full py-4 bg-white text-orange-500 text-lg font-bold rounded-xl border border-orange-300"
      >
        건너뛰기
      </button>
    </div>
    <div class="w-full">
      <button
        @click="showModal = true"
        class="w-full py-4 bg-orange-500 text-white text-lg font-bold rounded-xl shadow"
      >
        친구 선택하기
      </button>
    </div>
  </div>

  <div class="fixed bottom-10 w-full p-5">
    <button
      @click="router.push('/rules')"
      class="w-full py-4 bg-white text-gray-500 text-lg font-lg rounded-xl border shadow active:scale-98 transition"
    >
      규칙 다시 선택하기
    </button>
  </div>

  <friend-modal v-if="showModal" @close="showModal = false" @select="handleFriendSelect" />
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import FriendModal from './FriendModal.vue'
import { useRouter } from 'vue-router'

const showModal = ref(false)
const router = useRouter()

const emit = defineEmits(['mode']) // 부모가 또 상위로 이벤트 보낼 경우

function handleFriendSelect(friend) {
  showModal.value = false
  emit('mode', friend.id)
}
</script>
