<template>
  <div @click="openModal"
  @click.stop
    :class="[
      'relative rounded-2xl shadow-lg px-6 py-7 flex flex-col gap-3 bg-white border-l-4',
      isWin
        ? 'border-orange-400'
        : isDraw
          ? 'border-gray-400'
          : 'border-blue-400'
    ]"
  >
    <!-- 우상단 승패 강조배지 -->
    <div class="absolute right-6 top-6 z-10">
      <span
        v-if="isWin"
        class="bg-orange-500 text-white text-base px-4 py-1.5 rounded-full font-extrabold shadow-lg border-2 border-orange-500 drop-shadow"
        style="letter-spacing:0.06em;"
        >승리</span>
      <span
        v-else-if="isDraw"
        class="bg-gray-300 text-gray-700 text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing:0.05em;"
        >무승부</span>
      <span
        v-else
        class="bg-blue-400 text-white text-base px-4 py-1.5 rounded-full font-extrabold border shadow"
        style="letter-spacing:0.05em;"
        >패배</span>
    </div>
    <!-- 상단: 룰정보/경기일시장소 -->
    <div class="flex items-center gap-3 min-w-0">
    <div class="flex items-center justify-between mt-0 mb-0">
      <div class="flex flex-col items-start gap-1">
                 <div class="font-bold text-xl text-gray-800">
                    {{ game.rule.ruleTitle }}
                  </div>
                    <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
                      {{ game.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ game.rule.minorCategory }}
                    </div>   
      </div>
    </div>
    </div>

    <!-- 총 점수 -->
    <div class="flex flex-col items-center mt-0">
      <div
        class="flex flex-col items-center justify-center  px-6 "
      >
        <span
          class="text-4xl font-black"
          :class="isWin ? 'text-orange-500' : isDraw ? 'text-gray-500' : 'text-blue-500'"
        >

    <div class="flex items-center gap-4">
  <!-- 왼쪽 영역 (1) -->
  <div class="flex items-center gap-3 flex-[1]">
    <!-- 유저 정보 및 점수 -->
    <div class="flex flex-col items-center pt-7">
      <router-link :to="'/profile/' + game.me.id" class="shrink-0">
        <img :src="game.me.avatar == null ? Default : game.me.avatar" class="w-12 h-12 rounded-full border-2 border-orange-400 shadow" />
      </router-link>
      <router-link :to="'/profile/' + game.me.id">
        <div class="font-semibold text-gray-800 text-[0.88rem] mt-[-5px] truncate max-w-[160px]">
          @{{ game.me.nickname }}
        </div>
      </router-link>
    </div>
    <div class="font-extrabold ml-[4.8dvw]">
      {{ game.myScore }}
    </div>
  </div>

  <!-- 가운데 콜론 (2) -->
  <div class="flex justify-center flex-[2] font-extrabold text-xl">
    :
  </div>

  <!-- 오른쪽 영역 (1) -->
  <div class="flex items-center gap-3 justify-end flex-[1]">
    <div class="font-extrabold mr-[4.8dvw]">
      {{ game.opponentScore }}
    </div>
    <div class="flex flex-col items-center pt-7">
      <router-link :to="'/profile/' + game.opponent.id" class="shrink-0">
        <img :src="game.opponent.avatar == null ? Default : game.opponent.avatar" class="w-12 h-12 rounded-full border-2 border-orange-400 shadow" />
      </router-link>
      <router-link :to="'/profile/' + game.opponent.id">
        <div class="font-semibold text-gray-800 text-[0.88rem] mt-[-5px] truncate max-w-[160px]">
          @{{ game.opponent.nickname }}
        </div>
      </router-link>
    </div>
  </div>
</div>

        </span>
      </div>
    </div>
    <!-- 세트별 결과 세로 리스트 -->
    <div class="max-h-64 overflow-y-auto flex flex-col gap-2">
      <div
        v-for="(set, i) in setResults"
        :key="i"
        class="w-full px-3 py-2 rounded-xl flex items-center justify-between border bg-gray-50 font-semibold shadow-sm"
        :class="set.winnerIdx === 1 ? 'border-orange-200' : set.winnerIdx === 2 ? 'border-blue-200' : 'border-gray-200'"
      >
        <span class="text-xs font-bold text-gray-400 flex-1">{{ set.setIdx }}세트</span>
        <span class="text-lg font-extrabold"
          :class="set.winnerIdx === 1 ? 'text-orange-500' : set.winnerIdx === 2 ? 'text-blue-500' : 'text-gray-400'">
          {{ set.user1Score }} : {{ set.user2SCore }}
        </span>
        <span class="flex items-center gap-1 font-semibold flex-1 justify-end">
          <i
            :class="set.winnerIdx === 1 ? 'fas fa-trophy text-orange-500' : set.winnerIdx === 2 ? 'fas fa-times text-blue-500' : 'fas fa-handshake text-gray-400'"
          ></i>
          <span class="text-xs font-bold"
            :class="set.winnerIdx === 1 ? 'text-orange-500' : set.winnerIdx === 2 ? 'text-blue-500' : 'text-gray-400'">
            {{
              set.winnerIdx === 1
                ? '승리'
                : set.winnerIdx === 2
                  ? '패배'
                  : '무승부'
            }}
          </span>
        </span>
      </div>
    </div>
    <!-- 경기 리뷰 및 매너점수 -->
    <div v-if="game.review || game.mannerScore || game.performanceScore" class="bg-gray-50 rounded-xl mt-5 p-4 flex flex-col gap-0 border border-gray-100">
      <div v-if="game.review" class="flex items-start gap-2 mb-4">
        <i class="fas fa-quote-left text-orange-400 mt-0.5"></i>
        <span class="text-sm text-gray-700 font-medium leading-snug">{{ game.review }}</span>
      </div>
      <div v-if="game.mannerScore !== undefined" class="flex items-center gap-2">
        <span class="text-xs text-gray-500">상대가 남긴 매너 점수:</span>
        <span class="text-base font-bold"
          :class="[
            game.mannerScore >= 4
              ? 'text-green-500'
              : game.mannerScore >= 2
                ? 'text-yellow-500'
                : game.mannerScore > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
          ]"
        >{{ game.mannerScore?.toFixed(1) ?? '-' }}</span>
      </div>
      <div v-if="game.performanceScore !== undefined" class="flex items-center gap-2 mt-0">
        <span class="text-xs text-gray-500">상대가 남긴 퍼포먼스 점수:</span>
        <span class="text-base font-bold"
          :class="[
            game.performanceScore >= 4
              ? 'text-green-500'
              : game.performanceScore >= 2
                ? 'text-yellow-500'
                : game.performanceScore > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
          ]"
        >{{ game.performanceScore?.toFixed(1) ?? '-' }}</span>
      </div>
    </div>

        
      <div class="min-w-0 flex flex-col justify-center">

        <div class="flex flex-col gap-2 text-xs text-gray-500 mt-1 min-w-0">
          <span class="flex items-center gap-1 min-w-0">
            <i class="far fa-calendar"></i>
            <span class="truncate">{{ formatDate(game.date) }}</span>
          </span>
          <span class="flex items-center gap-1 min-w-0">
            <i class="fas fa-map-marker-alt"></i>
            <span class="truncate">{{ game.location ? game.location : "미정"}}</span>
          </span>
        </div>
      </div>


    <!-- 하단 액션 버튼 -->
    <div class="flex justify-end gap-3 pt-2 mt-2 border-t border-gray-100">
      <button
        class="flex items-center gap-2 text-gray-500 hover:text-orange-500 font-md text-sm px-3 py-2 transition"
        @click.self="toggleComment(game.id)"
        @click.stop
        title="댓글"
      >
        <i class="far fa-comment-dots text-base"></i>
        댓글
      </button>
      <button
        class="flex items-center gap-2 text-gray-500 hover:text-blue-500 font-md text-sm px-3 py-2 transition"
        @click.self="openInstaModal"
        @click.stop
        title="결과 공유"
      >
        <i class="fas fa-share-alt text-base"></i>
        결과 공유
      </button>
    </div>
  </div>

  <!-- 인스타그램 공유 모달 -->
  <InstagramModal
    v-if="isOpenInsta"
    :game="game"
    :me="game.me"
    @close="isOpenInsta = false"
  />

          <transition name="fade">
        <div
            v-if="showRuleDetail"
              class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-5 z-[10000000]"
              @click.self="closeModal(game)"
              @click.stop
            >
              <!-- 모달 Content -->
              <div @click.stop class="bg-white rounded-xl p-6 max-w-lg w-full relative z-[1000000000]">
                <!-- 닫기 버튼 -->
                <button
                  @click="closeModal(game)"
                  class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>

                <div class="flex flex-col gap-1 mb-3 items-start">
                  <div class="font-semibold text-gray-700">
                    {{ game.rule.ruleTitle }}
                  </div>
                    <div class="text-xs text-orange-500 font-medium flex gap-1 items-center">
                      {{ game.rule.majorCategory }} <span class="mx-1 text-orange-500">&gt;</span> {{ game.rule.minorCategory }}
                    </div>                
                </div>
                <div class="text-sm text-gray-700 space-y-4">
                  <p class="leading-relaxed whitespace-pre-line border-b pb-4 overflow-auto">{{ game.rule.ruleDescription }}</p>

                  <div class="flex justify-between">
                    <span class="text-gray-500">세트 승리 기준</span>
                    <span>{{ game.rule.winCondition === 'SETS_HALF_WIN' ? '점수 달성' : '시간 도달' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">한세트 승리에 필요한 점수</span>
                    <span>{{ game.rule.pointsToWin === -1 ? '제한 없음' : game.rule.pointsToWin + '점' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">총 세트 수</span>
                    <span>{{ game.rule.setsToWin }}세트</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">세트 제한 시간</span>
                    <span>
                      {{ game.rule.duration === -1 ? '제한 없음' :
                        game.rule.duration >= 60
                          ? Math.floor(game.rule.duration / 60) + '분 ' + (game.rule.duration % 60) + '초'
                          : game.rule.duration + '초' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </transition>

        <Comment v-if='commentId!=0' :id="commentId" @close="commentId = 0" />

</template>

<script setup>
import { defineProps, ref, onMounted } from 'vue'
// import { useRouter } from 'vue-router'
import InstagramModal from "../../components/InstagramShare.vue"
import Default from "../../assets/default.png"
import Comment from "../GameCommentView.vue"
const commentId = ref(0)
const toggleComment = (id)=>{
  commentId.value = id;
}
const setResults = ref([])

const showRuleDetail = ref(false)
function openModal() {
  showRuleDetail.value= true
}
function closeModal() {
  showRuleDetail.value =false
}

// const router = useRouter()

const isOpenInsta = ref(false)
const openInstaModal = () => { isOpenInsta.value = true }

const props = defineProps({
  game: Object,
  isWin: Boolean,
  isDraw: Boolean,
})

function formatDate(str) {
  if (!str) return "미정"
  const d = new Date(str)
  return d.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })
}

function isWinner1More(results) {
  let winner1 = 0, winner2 = 0;
  for (const r of results) {
    if (r.winnerIdx === 1) winner1++;
    else if (r.winnerIdx === 2) winner2++;
  }
  return winner1 > winner2;
}

onMounted(()=>{
  if(props.game.myScore >= props.game.opponentScore) { // 내 점수가 더 높음
    if(isWinner1More(props.game.setResults)) { // 내가 유저 1임 (미변화)
      setResults.value = props.game.setResults
    } else { 
      props.game.setResults.forEach(item => { // 내가 유저 2임 (재졍렬)
        setResults.value.push({
          setIdx: item.setIdx,
          user1Score: item.user2SCore,
          user2SCore: item.user1Score,
          winnerIdx: item.winnerIdx === 1 ? 2 : item.winnerIdx === 2 ? 1 : item.winnerIdx
        });
      });
    }
  } else { // 내가 점수가 더 적음.
      if(isWinner1More(props.game.setResults)) { // 상대가 유저 1임 (재정렬)
          props.game.setResults.forEach(item => { 
            setResults.value.push({
              setIdx: item.setIdx,
              user1Score: item.user2SCore,
              user2SCore: item.user1Score,
              winnerIdx: item.winnerIdx === 1 ? 2 : item.winnerIdx === 2 ? 1 : item.winnerIdx
            });

            console.log(item)
          })
      } 
      else { // 내가 유저 2임 (미변화)
          setResults.value = props.game.setResults
        }
  }


})


</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
