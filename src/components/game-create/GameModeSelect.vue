<template>
  <div class="flex flex-col min-h-full px-5 pt-10">
    <div class="text-center mb-7 pt-[10%]">
      <div class="text-lg font-bold text-gray-900 mb-2">누구와 플레이할까요?</div>
      <div class="text-gray-500 text-base">
        친구와 플레이하기는 친구를 지정하여 바로 게임을 시작할 수 있습니다.
      </div>
    </div>
    <div class="flex flex-col gap-4 mb-10">
      <button
        @click="$emit('mode', 'friend')"
        class="w-full py-4 bg-orange-500 text-white text-lg font-bold rounded-xl shadow"
      >
        친구와 바로 시작하기
      </button>
      <button
        @click="$emit('mode', 'random')"
        class="w-full py-4 bg-white text-orange-500 text-lg font-bold rounded-xl border border-orange-300"
      >
        다른 유저들과 경기하기
      </button>
    </div>
  </div>
</template>
