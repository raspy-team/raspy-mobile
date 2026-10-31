<template>
  <section class="w-screen shrink-0 h-full relative flex items-center justify-center">
    <div class="absolute inset-0 bg-black" />
  
    <div
      class="relative z-10 w-[92%] max-w-xl rounded-2xl px-8 py-5 bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl"
    >
      <div class="mb-5 flex justify-center">
        <span
         class="cursor-pointer px-3 py-1 rounded-full bg-orange-400 text-white font-medium shadow-md hover:scale-105 hover:shadow-lg transition-all duration-150"
          @click="emit('rule')"
          title="규칙 상세 보기"
        >
          <i class="fas fa-book-open text-white/90 mr-2"></i>
          <span class="drop-shadow"> {{ post.rule?.ruleTitle || '-' }}</span>
        </span>
      </div>
  
      <div v-if="post.type === 'game' && post.isCompleted" class="space-y-6 mb-4">
        <div class="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div
            class="text-center relative cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.players[0].id)"
          >
            <img
              :src="post.players[0].avatar"
              class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
              :class="
                post.result.winner === post.players[0].name
                  ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
                  : 'border-white/20'
              "
            />
            <div class="text-base font-normal text-white truncate">
              {{ post.players[0].name }}
            </div>
            <div
              v-if="post.ruleStatisticsList && post.ruleStatisticsList[0]"
              class="text-xs text-white/60 mt-1"
            >
              {{ post.ruleStatisticsList[0].wins }}승
              {{ post.ruleStatisticsList[0].losses }}패
              {{ post.ruleStatisticsList[0].draws }}무
            </div>
          </div>
          <div class="text-center">
            <div
             class="font-bold text-white tracking-wide leading-none text-lg whitespace-nowrap"
            >
              {{ post.result.scoreA }}<span class="text-white/50"> : </span
              >{{ post.result.scoreB }}
            </div>
          </div>
          <div
            class="text-center relative cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.players[1].id)"
          >
            <img
              :src="post.players[1].avatar"
              class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2"
              :class="
                post.result.winner === post.players[1].name
                  ? 'border-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]'
                  : 'border-white/20'
              "
            />
            <div class="text-white font-medium text-sm truncate">
              {{ post.players[1].name }}
            </div>
            <div
              v-if="post.ruleStatisticsList && post.ruleStatisticsList[1]"
              class="text-xs text-white/60 mt-1"
            >
              {{ post.ruleStatisticsList[1].wins }}승
              {{ post.ruleStatisticsList[1].losses }}패
              {{ post.ruleStatisticsList[1].draws }}무
            </div>
          </div>
        </div>
      </div>
  
      <div
        v-else-if="
          post.type === 'upcoming_game' || (post.type === 'game' && !post.isCompleted)
        "
        class="space-y-6"
      >
        <div class="flex items-center gap-4">
          <img
            class="w-14 h-14 rounded-xl border border-white/30"
            :src="`/category-picture/${post.rule?.minorCategory || '미분류'}.png`"
            :alt="post.rule?.minorCategory"
          />
          <div class="flex-1">
            <div class="text-white font-bold text-lg">{{ post.rule?.title || '경기' }}</div>
            <div class="text-white/70 text-sm">
              {{ post.rule?.majorCategory }} • {{ post.rule?.minorCategory }}
            </div>
          </div>
        </div>
  
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div
            class="text-center cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.players[0]?.id)"
          >
            <img
              :src="post.players[0]?.avatar"
              class="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-blue-400"
            />
            <div class="text-white font-medium text-sm">{{ post.players[0]?.name }}</div>
            <div class="text-blue-300 text-xs font-medium">주최자</div>
          </div>
  
          <div class="text-center">
            <div class="text-3xl font-bold text-white/90">VS</div>
            <div class="text-xs text-white/60 mt-1">예정</div>
          </div>
  
          <div class="text-center">
            <div
              class="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center border-2 border-white/30"
            >
              <i class="fas fa-user-plus text-gray-400 text-xl"></i>
            </div>
            <div class="text-white/70 text-sm">참가자 모집</div>
          </div>
        </div>
  
        <div class="space-y-3">
          <div class="flex items-center gap-3 text-white/90">
            <i class="fas fa-calendar text-blue-400 w-4"></i>
            <span class="text-sm">{{ post.date }} 예정</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <i class="fas fa-map-marker-alt text-blue-400 w-4"></i>
            <span class="text-sm">{{ post.meta?.place || '장소 미정' }}</span>
          </div>
          <div class="flex items-center gap-3 text-white/90">
            <i class="fas fa-users text-blue-400 w-4"></i>
            <span class="text-sm">2명 매치</span>
          </div>
        </div>
  
        <div class="mt-6">
          <button
            v-if="!post.isAppliedByMe"
            @click="emit('join', post.id)"
           class="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            경기 참가하기
          </button>
          <button
            v-else
            disabled
           class="w-full py-3 bg-gray-500 text-white font-medium rounded-xl cursor-not-allowed opacity-60"
          >
            <i class="fas fa-check mr-2"></i>신청 완료
          </button>
        </div>
      </div>
  
      <div v-if="post.type === 'game' && post.isCompleted" class="mt-4">
        <button
          class="w-full flex items-center justify-center gap-2 text-xs text-white/80 bg-black/30 rounded-lg px-3 py-2 mb-2 focus:outline-none"
          data-allow-swipe
          @click.stop="toggleSetDetails"
        >
          <span v-if="!showSetDetails"><i class="fas fa-chevron-down"></i></span>
          <span v-else><i class="fas fa-chevron-up"></i></span>
        </button>
        <transition name="set-details-transition">
          <div v-if="showSetDetails">
            <div class="grid grid-cols-2 gap-2 text-xs text-white/80 mb-2">
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <i class="fas fa-trophy w-4 text-center"></i>
                <span>세트수 {{ post.result.sets }}</span>
              </div>
              <div class="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <i class="far fa-clock w-4 text-center"></i>
                <span>총 시간 {{ post.result.duration }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <div
                v-for="(sc, idx) in post.result.setScores"
                :key="'set-' + idx"
                class="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90"
              >
                <div class="font-medium">{{ sc.set }}세트</div>
                <div class="font-medium">{{ sc.scoreA }} : {{ sc.scoreB }}</div>
              </div>
            </div>
          </div>
        </transition>
      </div>
  
      <div
        v-if="post.type === 'game' && post.isCompleted"
        class="mt-3 text-xs text-white/70 flex items-center justify-between"
      >
        <span>{{ post.meta.place }}</span>
        <span>
          {{ post.meta.time }}
          <template v-if="post.date"> · {{ formatFeedDate(post.date) }} </template>
        </span>
      </div>
      <!-- 평점 & 리뷰 (경기 정보 박스 아래에 간략하게 표시) -->
      <div
        v-if="
          post.type === 'game' &&
          post.isCompleted &&
          showReviews &&
          post.reviews?.length > 0
        "
        class="mt-7 space-y-3"
      >
        <!-- 첫 번째 리뷰 -->
        <div
          v-if="post.reviews[0]?.author"
          class="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2"
        >
          <div
            class="flex items-center gap-2 cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.reviews[0]?.author?.id)"
          >
            <img
              :src="
                post.reviews[0]?.author?.avatar ||
                'https://d1iimlpplvq3em.cloudfront.net/service/default-profile.png'
              "
              class="w-8 h-8 rounded-full object-cover"
            />
            <div class="text-xs font-medium text-white/90">
              {{ post.reviews[0]?.author?.name || '익명' }}님의 한마디
            </div>
          </div>
          <div class="text-xs text-white/80 leading-relaxed line-clamp-2">
            {{ post.reviews[0]?.text || '' }}
          </div>
        </div>
  
        <!-- 두 번째 리뷰 (있는 경우) -->
        <div
          v-if="post.reviews[1]?.author"
          class="bg-black/30 border border-white/10 rounded-lg p-3 space-y-2"
        >
          <div
            class="flex items-center gap-2 cursor-pointer active:scale-95 transition"
            @click="emit('profile', post.reviews[1]?.author?.id)"
          >
            <img
              :src="
                post.reviews[1]?.author?.avatar ||
                'https://d1iimlpplvq3em.cloudfront.net/service/default-profile.png'
              "
              class="w-8 h-8 rounded-full object-cover"
            />
            <div class="text-xs font-medium text-white/90">
              {{ post.reviews[1]?.author?.name || '익명' }}님의 한마디
            </div>
          </div>
          <div class="text-xs text-white/80 leading-relaxed line-clamp-2">
            {{ post.reviews[1]?.text || '' }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// 경기 정보 슬라이드: 결과(또는 예정 경기), 세트별 점수, 장소·시간, 한마디 리뷰
import { ref, defineProps, defineEmits } from 'vue'
defineProps({
  post: { type: Object, required: true },
  showReviews: { type: Boolean, default: true },
})
const emit = defineEmits(['profile', 'rule', 'join', 'interact'])

// 세트별 점수 펼치기
const showSetDetails = ref(false)
const toggleSetDetails = () => {
  emit('interact')
  showSetDetails.value = !showSetDetails.value
}

function formatFeedDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  // 올해면 월.일, 아니면 연도까지
  return d.getFullYear() === now.getFullYear()
    ? `${d.getMonth() + 1}.${d.getDate()}`
    : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`
}
</script>

<style scoped>
.set-details-transition-enter-active,
.set-details-transition-leave-active {
  transition:
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.25s;
  overflow: hidden;
}
.set-details-transition-enter-from,
.set-details-transition-leave-to {
  height: 0;
  opacity: 0;
}
</style>
