<template>
  <div class="w-screen h-screen flex-shrink-0 relative overflow-hidden bg-black">
    <!-- 배경 이미지 -->
    <div class="absolute inset-0">
      <img
        v-if="post.photos?.length > 0"
        :src="post.photos[0]"
        class="w-full h-full object-cover"
        draggable="false"
      />
      <div
        class="absolute inset-0 bg-gradient-to-br from-emerald-600/60 via-cyan-600/40 to-blue-700/60"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
    </div>

    <!-- 상단 헤더 -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 pt-12">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img
            :src="post.players[0]?.avatar"
            class="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
          />
          <div>
            <div class="text-white font-semibold text-sm">{{ post.players[0]?.name }}</div>
            <div class="text-white/70 text-xs">{{ formatTimeAgo(post.date) }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-medium"
          >
            완료된 경기
          </span>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="absolute inset-0 flex items-center justify-center z-10">
      <div class="w-[90%] max-w-sm">
        <!-- 경기 정보 카드 -->
        <div class="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
          <!-- 스포츠 종목 -->
          <div class="flex items-center gap-3 mb-4">
            <img
              class="w-12 h-12 rounded-xl"
              :src="`/category-picture/${post.rule?.minorCategory || '미분류'}.png`"
              :alt="post.rule?.minorCategory"
            />
            <div>
              <div class="text-white font-bold text-lg truncate">{{ post.rule?.ruleTitle }}</div>
              <div class="text-white/70 text-xs">
                {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }}
              </div>
            </div>
          </div>

          <!-- 경기 결과 -->
          <div class="grid grid-cols-[auto_1fr_auto] items-center gap-4 mb-6">
            <div class="text-center">
              <img
                :src="post.players[0].avatar"
                class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2"
                :class="
                  post.result.winner === post.players[0].name
                    ? 'border-amber-400'
                    : 'border-white/30'
                "
              />
              <div class="text-white font-semibold text-sm">{{ post.players[0].name }}</div>
            </div>
            <div class="text-center">
              <div class="font-extrabold text-white tracking-wide leading-none text-4xl">
                {{ post.result.scoreA }}<span class="text-white/50"> : </span
                >{{ post.result.scoreB }}
              </div>
              <div class="mt-1 text-xs text-emerald-300 font-medium">
                Winner · {{ post.result.winner }}
              </div>
            </div>
            <div class="text-center">
              <img
                :src="post.players[1].avatar"
                class="w-14 h-14 rounded-full mx-auto mb-2 object-cover border-2"
                :class="
                  post.result.winner === post.players[1].name
                    ? 'border-amber-400'
                    : 'border-white/30'
                "
              />
              <div class="text-white font-semibold text-sm">{{ post.players[1].name }}</div>
            </div>
          </div>

          <!-- 경기 규칙 -->
          <div
            @click="$emit('showRules')"
            class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200 group mb-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                  <i class="fas fa-book text-emerald-400 text-lg"></i>
                </div>
                <div>
                  <div class="text-white font-semibold text-sm">경기 규칙</div>
                  <div class="text-white/70 text-xs">
                    {{ post.rule?.ruleTitle || post.rule?.title }}
                  </div>
                </div>
              </div>
              <div class="text-white/50 group-hover:text-white/80 transition-colors">
                <i class="fas fa-chevron-right text-sm"></i>
              </div>
            </div>
            <div class="mt-3 text-white/60 text-xs">
              {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }} • 자세히 보기
            </div>
          </div>

          <!-- 메타 정보 -->
          <div class="text-center space-y-1">
            <div class="text-white/80 text-sm">{{ post.meta?.place }}</div>
            <div class="text-white/60 text-xs">{{ post.meta?.time }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  post: {
    type: Object,
    required: true,
  },
})

defineEmits(['showRules'])

const formatTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diff = (now - date) / 1000

  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}일 전`
  return `${Math.floor(diff / 2592000)}개월 전`
}
</script>

<style scoped>
.group:active .group-active\:scale-95 {
  transform: scale(0.95);
}
</style>
