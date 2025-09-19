<template>
  <div
    class="w-screen h-screen flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 pointer-events-none"
  >
    <!-- 배경 패턴 및 오버레이 -->
    <div class="absolute inset-0 opacity-20">
      <div
        class="absolute inset-0"
        style="
          background-image:
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 60px 60px, 30px 30px;
        "
      ></div>
    </div>
    <!-- 그라데이션 오버레이 -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

    <!-- 상단 헤더 -->
    <div class="absolute top-0 left-0 right-0 z-20 p-4 pt-12">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img
            :src="post.author.avatar"
            class="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
          />
          <div>
            <div class="text-white font-semibold text-sm">{{ post.author.name }}</div>
            <div class="text-white/70 text-xs">{{ formatTimeAgo(post.createdAt) }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="bg-blue-500/30 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs font-medium border border-blue-400/50"
          >
            예정된 경기
          </span>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="absolute inset-0 flex items-center justify-center z-10">
      <div class="w-[90%] max-w-sm pointer-events-auto">
        <!-- 경기 정보 카드 -->
        <div class="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
          <!-- 스포츠 종목 -->
          <div class="flex items-center gap-3 mb-6">
            <img
              class="w-14 h-14 rounded-xl border border-white/30"
              :src="`/category-picture/${post.rule?.minorCategory || '미분류'}.png`"
              :alt="post.rule?.minorCategory"
            />
            <div class="flex-1">
              <div class="text-white font-bold text-lg truncate">{{ post.rule?.ruleTitle }}</div>
              <div class="text-white/70 text-sm">
                {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }}
              </div>
            </div>
          </div>

          <!-- 대전 정보 -->
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6">
            <div class="text-center">
              <img
                :src="post.author.avatar"
                class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
              />
              <div class="text-white font-semibold text-sm">{{ post.author.name }}</div>
              <div class="text-blue-300 text-xs font-medium">주최자</div>
            </div>

            <div class="text-center">
              <div class="text-2xl font-black text-white/90">VS</div>
              <div class="text-xs text-white/60 mt-1">예정</div>
            </div>

            <div class="text-center">
              <div
                class="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
              >
                <i class="fas fa-user-plus text-gray-600 text-xl"></i>
              </div>
              <div class="text-white/70 text-sm">참가자 모집</div>
            </div>
          </div>

          <!-- 경기 상세 정보 -->
          <div class="space-y-3">
            <div class="flex items-center gap-3 text-white/90">
              <i class="fas fa-calendar text-blue-400 w-4"></i>
              <span class="text-sm">{{ formatScheduledDate(post.scheduledDate) }}</span>
            </div>
            <div class="flex items-center gap-3 text-white/90">
              <i class="fas fa-map-marker-alt text-blue-400 w-4"></i>
              <span class="text-sm">{{ post.location || '장소 미정' }}</span>
            </div>
            <div class="flex items-center gap-3 text-white/90">
              <i class="fas fa-users text-blue-400 w-4"></i>
              <span class="text-sm">{{ post.maxPlayers || 2 }}명 매치</span>
            </div>
          </div>

          <!-- 참가 버튼 -->
          <div class="mt-6">
            <button
              @click="$emit('join', post.id)"
              class="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              경기 참가하기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측 액션 버튼들 -->
    <div class="absolute right-4 bottom-[20%] flex flex-col items-center gap-6 z-20 pointer-events-auto">
      <button @click="$emit('like', post.id)" class="flex flex-col items-center group">
        <div
          class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-active:scale-95 transition-transform"
        >
          <i class="fas fa-heart text-white text-xl"></i>
        </div>
        <span class="text-white/80 text-xs mt-1">관심</span>
      </button>

      <button @click="$emit('comment', post.id)" class="flex flex-col items-center group">
        <div
          class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-active:scale-95 transition-transform"
        >
          <i class="fas fa-comment text-white text-xl"></i>
        </div>
        <span class="text-white/80 text-xs mt-1">댓글</span>
      </button>

      <button @click="$emit('share', post.id)" class="flex flex-col items-center group">
        <div
          class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-active:scale-95 transition-transform"
        >
          <i class="fas fa-share text-white text-xl"></i>
        </div>
        <span class="text-white/80 text-xs mt-1">공유</span>
      </button>
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

defineEmits(['like', 'comment', 'share', 'join'])

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

const formatScheduledDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.group:active .group-active\:scale-95 {
  transform: scale(0.95);
}
</style>
