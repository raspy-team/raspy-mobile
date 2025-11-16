<template>
  <div class="flex flex-col min-h-full px-5 pt-10 bg-gray-900">
    <div class="text-center mb-7 pt-[10%]">
      <div class="text-xl font-bold text-white mb-3 mt-7">친구를 상대로 지정하시겠어요?</div>
      <div class="text-gray-300 text-base mb-8 leading-relaxed">
        친구를 지정하면 해당 친구와 경기를 생성할 수 있습니다.
      </div>
    </div>
    <div class="flex flex-col gap-3 mb-6">
      <button
        @click="$emit('mode', 'random')"
        class="w-full py-4 bg-gray-800 text-orange-400 text-lg font-semibold rounded-xl border border-gray-600 hover:bg-gray-700 active:scale-98 transition-all duration-200"
      >
        건너뛰기
      </button>
    </div>
    <div class="w-full mb-8">
      <button
        @click="showModal = true"
        class="w-full py-4 bg-orange-500 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-orange-600 active:scale-98 transition-all duration-200"
      >
        친구 선택하기
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
