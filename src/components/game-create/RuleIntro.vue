<template>
  <div class="flex flex-col items-center justify-center min-h-full px-5">
    <div class="text-center mb-14">
      <h2 class="text-xl font-bold mb-2 text-gray-900">규칙을 선택하거나 직접 만들 수 있습니다</h2>
      <p class="text-base text-gray-500">
        이미 만들어진 규칙을 사용할 수도 있고,<br />
        나만의 규칙을 7단계에 걸쳐 직접 생성할 수도 있습니다.
      </p>
    </div>
    <div class="w-full flex flex-col gap-4">
      <button
        @click="$emit('select', 'create')"
        class="w-full py-4 bg-orange-500 text-white text-lg font-bold rounded-xl shadow active:scale-98 transition"
      >
        새로운 규칙 만들기
      </button>
      <button
        @click="$emit('select', 'select')"
        class="w-full py-4 bg-white text-orange-500 text-lg font-bold rounded-xl border border-orange-300 active:scale-98 transition"
      >
        다른 유저가 생성한 규칙 선택하기
      </button>
    </div>
  </div>

  <div class="fixed bottom-10 w-full p-5">
    <button
      @click="router.go(-1)"
      class="w-full py-4 bg-white text-gray-500 text-lg font-lg rounded-xl border shadow active:scale-98 transition"
    >
      뒤로 가기
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
