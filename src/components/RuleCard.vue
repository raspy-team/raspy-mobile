<template>
  <div class="card-style group">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-2">
      <div class="min-w-0">
        <span class="text-base font-extrabold text-gray-900 truncate block">{{ rule.ruleTitle }}</span>
        <div class="flex gap-1 items-center mt-1 text-xs text-orange-500 font-medium">
          {{ rule.majorCategory }}
          <span v-if="rule.minorCategory" class="mx-1 text-orange-500">&gt;</span>
          <span v-if="rule.minorCategory">{{ rule.minorCategory }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 min-w-0">
        <img
          :src="rule.createdBy.profile?.profilePicture"
          class="w-7 h-7 rounded-full border border-orange-100 object-cover"
          :alt="rule.createdBy.nickname"
        />
        <span class="text-xs text-gray-500 font-medium max-w-[60px] truncate">{{ rule.createdBy.nickname }}</span>
      </div>
    </div>
    <!-- 설명 & 펼치기 & 복사 -->
    <div class="desc-block relative mt-1.5 mb-1" :class="expanded.includes(rule.id) ? 'expanded' : ''">
      <p
        class="desc-text leading-relaxed line-clmap-2 whitespace-pre-line"
        :class="expanded.includes(rule.id) ? 'desc-text-expanded' : 'line-clamp-2'"
        v-html="highlightKeyword(rule.ruleDescription)"
      ></p>
      <div class="absolute flex gap-1 bottom-2 right-2 z-10">
        <button
          v-if="rule.ruleDescription && rule.ruleDescription.length > 30"
          @click="$emit('toggleExpand', rule.id)"
          class="desc-mini-btn whitespace-pre-line leading-relaxed "
        >
          <i :class="expanded.includes(rule.id) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          <span>{{ expanded.includes(rule.id) ? '접기' : '펼치기' }}</span>
        </button>
        <button
          @click.stop="$emit('copyDescription', rule)"
          :class="['desc-mini-btn', copiedId === rule.id ? 'copied' : '']"
        >
          <i v-if="copiedId === rule.id" class="fas fa-check"></i>
          <i v-else class="fas fa-copy"></i>
          <span>{{ copiedId === rule.id ? '복사됨' : '복사' }}</span>
        </button>
      </div>
    </div>
    <!-- 메타 정보 -->
    <div class="flex flex-col gap-1 mt-2 text-[13px]">
      <div class="flex items-center gap-2 p-2 rounded-lg">
        <i class="fas fa-trophy text-orange-400 text-base"></i>
        <span class="text-gray-500 font-light w-28 shrink-0">한세트 승점</span>
        <span class="text-gray-700 font-normal flex-1">
          <template v-if="rule.pointsToWin === -1">제한 없음</template>
          <template v-else>{{ rule.pointsToWin }}<span class="text-gray-400">점</span></template>
        </span>
      </div>
      <div class="flex items-center gap-2 p-2 rounded-lg">
        <i class="fas fa-th-large text-orange-400 text-base"></i>
        <span class="text-gray-500 font-light w-28 shrink-0">총 세트</span>
        <span class="text-gray-700 font-normal flex-1">
          <template v-if="rule.setsToWin === -1">제한 없음</template>
          <template v-else>{{ rule.setsToWin }}<span class="text-gray-400">세트</span></template>
        </span>
      </div>
      <div class="flex items-center gap-2 p-2 rounded-lg">
        <i class="fas fa-clock text-orange-400 text-base"></i>
        <span class="text-gray-500 font-light w-28 shrink-0">제한 시간</span>
        <span class="text-gray-700 font-normal flex-1">
          <template v-if="rule.duration === -1">제한 없음</template>
          <template v-else>{{ formatDuration(rule.duration) }}</template>
        </span>
      </div>
      <div class="flex items-center gap-2 p-2 rounded-lg">
        <i class="fas fa-crown text-orange-400 text-base"></i>
        <span class="text-gray-500 font-light w-28 shrink-0">승리 조건</span>
        <span class="text-gray-700 font-normal flex-1">{{ formatWinBy(rule.winBy) }}</span>
      </div>
      <div class="flex items-center gap-2 p-2 rounded-lg">
        <i class="fas fa-fire text-orange-400 text-base"></i>
        <span class="text-gray-500 font-light w-28 shrink-0">사용됨</span>
        <span class="text-gray-700 font-normal flex-1">{{ rule.useCount }}<span class="text-gray-400">회</span></span>
      </div>
    </div>
    <!-- CTA -->
    <div class="flex justify-center text-center mt-4">
      <button
        class="game-cta w-full text-center"
        @click="selectRuleForGame"
      >
        <div class="text-center flex justify-center w-full items-center font-semibold gap-2">
        <i class="fas fa-play mr-1"></i>
            {{ rule.ruleTitle }} 게임 생성하기
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps(['rule', 'search', 'copiedId', 'expanded'])
 defineEmits(['toggleExpand', 'copyDescription', 'selectedForGame'])
const router = useRouter()

const highlightKeyword = (text) => {
  if (!props.search) return text
  const re = new RegExp(`(${props.search})`, 'gi')
  return text.replace(re, '<mark class="bg-orange-100 text-orange-600 rounded">$1</mark>')
}
const formatDuration = (duration) => {
  if (!duration || duration < 0) return '제한 없음'
  const h = Math.floor(duration / 3600)
  const m = Math.floor((duration % 3600) / 60)
  const s = duration % 60
  let out = []
  if (h > 0) out.push(`${h}시간`)
  if (m > 0) out.push(`${m}분`)
  if (s > 0) out.push(`${s}초`)
  return out.join(' ')
}
const formatWinBy = (winBy) => {
  if (winBy === 'SETS_HALF_WIN') return '점수 달성'
  return '제한 시간동안 더 많은 점수 획득'
}

const selectRuleForGame = () => {
  router.push({ path: '/create-game', query: { ruleId: props.rule.id } })
}
</script>

<style scoped>
.card-style {
  background: #fafafb;
  border-radius: 1.3rem;
  box-shadow: 0 2px 14px 0 rgba(31,41,55,.04), 0 2px 8px 0 rgba(251,146,60,0.06);
  padding: 1.45rem 1.15rem 1.4rem 1.15rem;
  margin-bottom: 1.05rem;
  border: 1.2px solid #f6f6f6;
  transition: box-shadow .2s, border .15s;
  position: relative;
}
.card-style:hover {
  box-shadow: 0 8px 36px 0 rgba(251,146,60,0.10), 0 2px 8px 0 rgba(0,0,0,0.05);
  border-color: #fed7aa;
}
.desc-block {
  background: #f8fafc;
  border-radius: 0.75em;
  min-height: 2.3em;
  position: relative;
  padding: 1.08em 0em 2.05em 0em;
  margin-bottom: 0.15em;
  transition: background 0.16s;
}
.desc-block.expanded {
}
.desc-text {
  font-size: 15px;
  color: #363636;
  letter-spacing: -0.008em;
  line-height: 1.65;
  transition: color .12s;
  margin-bottom: 0;
  word-break: break-word;
}
.desc-text-expanded {
  color: #ce7a1c;
  font-weight: 500;
}
.desc-mini-btn {
  background: #f3f4f6;
  color: #f59e42;
  border-radius: 2rem;
  font-size: 12px;
  border: 1px solid #ffe4bb;
  font-weight: 500;
  padding: 0.2rem 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.22rem;
  cursor: pointer;
  transition: background .12s, border .12s, color .1s;
}
.desc-mini-btn:hover,
.desc-mini-btn.copied {
  background: #ffe7c7;
  color: #f97316;
  border-color: #f97316;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.game-cta {
  background: linear-gradient(to right, #fb923c, #f59e42 85%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 0.83rem 1.1rem;
  text-align:center;
  border-radius: 15px;
  border: none;
  box-shadow: 0 2px 8px 0 rgba(251,146,60,0.08);
  transition: background .16s, transform .13s;
  display: inline-flex;
  align-items: center;
  gap: 0.22rem;
}
.game-cta:hover { background: linear-gradient(to right, #f59e42 80%, #fb923c 120%); transform: translateY(-1.5px) scale(1.025); }
.fade-enter-active, .fade-leave-active { transition: opacity .19s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
mark { background: #fff7ed; color: #f97316; padding: 0 2px; border-radius: 2px; }
</style>
