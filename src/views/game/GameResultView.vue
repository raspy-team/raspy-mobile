<template>
  <div class="h-dvh w-dvw flex flex-col relative overflow-hidden bg-gray-900">

    <!-- 📌 로딩 오버레이 -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-70"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-t-orange-500"></div>
    </div>

    <!-- 🎉 게임 결과 화면 -->
    <div v-else class="flex-1 overflow-y-auto px-4 py-4">
      <div class="max-w-xl mx-auto space-y-4 text-center pb-20">
        <!-- 승패 결과 -->
        <div v-if="winnerIdx != 0" class="space-y-0.5">
          <div v-if="user1.id == currentUserId">
            <template
              v-if="
                !(
                  (championIdx == 1 && idxCorrect) ||
                  (championIdx == 2 && !idxCorrect) ||
                  (championIdx == 2 && idxCorrect) ||
                  (championIdx == 1 && !idxCorrect)
                )
              "
            >
              <h2
                v-if="winnerIdx == 1"
               class="text-3xl font-bold bg-blue-400 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-x"
                style="animation: gradient-x 2.5s linear infinite"
              >
                승리하셨습니다!
              </h2>
              <h2 v-else class="text-3xl font-bold text-gray-500">패배하셨습니다.</h2>
            </template>
          </div>
          <div v-else-if="user2.id == currentUserId">
            <template
              v-if="
                !(
                  (championIdx == 1 && idxCorrect) ||
                  (championIdx == 2 && !idxCorrect) ||
                  (championIdx == 2 && idxCorrect) ||
                  (championIdx == 1 && !idxCorrect)
                )
              "
            >
              <h2
                v-if="winnerIdx == 2"
               class="text-3xl font-bold bg-blue-400 bg-[length:200%_200%] bg-clip-text text-transparent animate-gradient-x"
                style="animation: gradient-x 2.5s linear infinite"
              >
                승리하셨습니다!
              </h2>
              <h2 v-else class="text-3xl font-bold text-gray-500">패배하셨습니다.</h2>
            </template>
          </div>
        </div>

        <div v-else>
          <i class="fas fa-handshake text-5xl text-gray-400 mb-2"></i>
          <h2 class="text-3xl font-bold text-gray-400">무승부</h2>
        </div>

        <!-- 챔피언 여부 카드: 승/패 모두 동일 문구와 스타일 -->
        <div
          v-if="
            (championIdx == 1 && idxCorrect) ||
            (championIdx == 2 && !idxCorrect) ||
            (championIdx == 2 && idxCorrect) ||
            (championIdx == 1 && !idxCorrect)
          "
          class="relative max-w-md mx-auto my-6 px-6 py-8 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center champion-card-glow"
        >
          <div class="absolute inset-0 z-0 pointer-events-none champion-card-bg"></div>
          <div
            class="absolute inset-0 rounded-2xl border-2 border-white border-opacity-50 z-10"
            style="backdrop-filter: blur(2px)"
          ></div>
          <div class="relative z-20 flex flex-col items-center">
            <i class="fas fa-crown text-5xl mb-3 text-white drop-shadow champion-glow-anim"></i>
            <h2 class="text-2xl font-bold text-white mb-1 drop-shadow champion-glow-anim">
              오늘 새로운 챔피언이 탄생합니다.
            </h2>
          </div>
        </div>

        <!-- 점수판 -->
        <div class="flex justify-around items-center py-4">
          <div class="flex flex-col items-center">
            <p class="text-[7rem] sm:text-[10rem] font-bold text-white mb-3 leading-none">
              {{ user1SetCount }}
            </p>
            <img
              :src="user1.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1"
            />
            <p class="text-sm font-medium text-white">{{ user1.nickname }}</p>
          </div>
          <div class="flex flex-col items-center mx-6 sm:mx-20">
            <span class="text-base sm:text-xl font-medium text-gray-500 mb-2 select-none"
              >경기 종료</span
            >
            <span
             class="text-[5rem] sm:text-[8rem] font-medium text-gray-600 select-none leading-none self-center flex items-center"
              style="line-height: 1"
              >:</span
            >
          </div>
          <div class="flex flex-col items-center">
            <p class="text-[7rem] sm:text-[10rem] font-bold text-white mb-3 leading-none">
              {{ user2SetCount }}
            </p>
            <img
              :src="user2.profileUrl || defaultImg"
              class="w-16 h-16 rounded-full mb-1"
            />
            <p class="text-sm font-medium text-white">{{ user2.nickname }}</p>
          </div>
        </div>

        <!-- 경기 사진/동영상 섹션 -->
        <div class="p-2 space-y-2 text-left">
          <h3 class="text-lg font-bold text-gray-100">
            경기 사진/동영상 (최대 5개)
          </h3>

          <!-- 촬영/선택된 미디어가 없을 때 -->
          <div v-if="allPictures.length === 0" class="text-center py-6 text-gray-400 bg-gray-900 border border-gray-800 rounded-xl">

            <i class="fas fa-images text-4xl mb-2"></i>
            <p class="text-sm mb-3">촬영된 미디어가 없습니다</p>
            <div class="flex gap-2 justify-center">
              <button
                @click="openCamera"
                class="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <i class="fas fa-camera mr-1"></i> 사진 촬영
              </button>
              <button
                @click="openVideoRecorder"
                class="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <i class="fas fa-video mr-1"></i> 동영상 촬영
              </button>
            </div>
          </div>

          <!-- 사진 목록 -->
          <div v-else class="space-y-4">
            <!-- 안내 메시지 -->
            <div v-if="selectedPictures.length === 0 && allPictures.length > 0" class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-3">
              <i class="fas fa-info-circle text-blue-400 text-lg mt-0.5"></i>
              <div class="flex-1">
                <p class="text-sm text-blue-300 font-medium mb-1">사진을 클릭하여 선택해주세요</p>
                <p class="text-xs text-blue-400/70">아래 사진을 탭하면 제출할 미디어로 선택됩니다 (최대 5개)</p>
              </div>
            </div>

            <!-- 선택된 미디어 (드래그로 순서 변경 가능) -->
            <div v-if="selectedPictures.length > 0">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-green-400">
                  <i class="fas fa-check-circle mr-1"></i>
                  선택됨 ({{ selectedPictures.length }}/5)
                </p>
                <p class="text-xs text-gray-500">드래그로 순서 변경</p>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div
                  v-for="(pic, index) in selectedPictures"
                  :key="pic.id"
                  :data-index="index"
                  :class="[
                    'relative aspect-square rounded-lg overflow-hidden border-2 cursor-move touch-none transition-all duration-150',
                    isDragging && draggedIndex === index
                      ? 'opacity-50 scale-95 border-orange-300'
                      : touchCurrentIndex === index && isDragging
                        ? 'border-blue-500 scale-105'
                        : 'border-orange-500',
                  ]"
                  draggable="true"
                  @dragstart="handleDragStart(index)"
                  @dragover.prevent="handleDragOver"
                  @drop="handleDrop(index)"
                  @dragend="handleDragEnd"
                  @touchstart="handleTouchStart(index)"
                  @touchmove.prevent="handleTouchMove($event)"
                  @touchend="handleTouchEnd(index)"
                >
                  <!-- 이미지 -->
                  <img
                    v-if="pic.type === 'image'"
                    :src="pic.dataUrl"
                    class="w-full h-full object-cover pointer-events-none"
                  />

                  <!-- 동영상 -->
                  <div v-else-if="pic.type === 'video'" class="relative w-full h-full">
                    <video
                      :src="pic.dataUrl"
                      class="w-full h-full object-cover pointer-events-none"
                    />
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none"
                    >
                      <i class="fas fa-play-circle text-white text-3xl"></i>
                    </div>
                    <div
                      class="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none"
                    >
                      {{ formatDuration(pic.duration) }}
                    </div>
                  </div>

                  <div
                    class="absolute top-1 left-1 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium pointer-events-none"
                  >
                    {{ index + 1 }}
                  </div>
                  <button
                    @click.stop="deselectPicture(pic.id)"
                    class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition z-10"
                  >
                    <i class="fas fa-times text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 선택 가능한 미디어들 -->
            <div v-if="unselectedPictures.length > 0">
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <i class="fas fa-hand-pointer text-orange-400 text-xs"></i>
                  탭하여 선택
                </p>
                <p class="text-xs text-gray-500">최대 5개</p>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <div
                  v-for="pic in unselectedPictures"
                  :key="pic.id"
                  class="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-600 cursor-pointer hover:border-orange-400 hover:scale-105 transition-all duration-200 group"
                  @click="selectPicture(pic)"
                >
                  <!-- 이미지 -->
                  <img
                    v-if="pic.type === 'image'"
                    :src="pic.dataUrl"
                    class="w-full h-full object-cover"
                  />

                  <!-- 동영상 -->
                  <div v-else-if="pic.type === 'video'" class="relative w-full h-full">
                    <video :src="pic.dataUrl" class="w-full h-full object-cover" />
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
                    >
                      <i class="fas fa-play-circle text-white text-2xl"></i>
                    </div>
                    <div
                      class="absolute bottom-0.5 left-0.5 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded"
                    >
                      {{ formatDuration(pic.duration) }}
                    </div>
                  </div>

                  <!-- 선택하기 오버레이 (hover 시) -->
                  <div class="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/80 transition-all duration-200 flex items-center justify-center">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                      <i class="fas fa-plus-circle text-white text-2xl"></i>
                      <span class="text-white text-xs font-medium">선택</span>
                    </div>
                  </div>

                  <button
                    @click.stop="deletePicture(pic.id)"
                    class="absolute top-1 right-1 bg-gray-800 bg-opacity-70 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition z-10"
                  >
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- 추가 촬영 버튼 (5개 미만일 때만 표시) -->
            <div v-if="allPictures.length < 5" class="flex gap-2">
              <button
                @click="openCamera"
                class="flex-1 border-2 border-dashed border-gray-600 text-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
              >
                <i class="fas fa-camera mr-1"></i> 사진 추가 ({{ allPictures.length }}/5)
              </button>
              <button
                @click="openVideoRecorder"
                class="flex-1 border-2 border-dashed border-gray-600 text-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
              >
                <i class="fas fa-video mr-1"></i> 동영상 추가 ({{ allPictures.length }}/5)
              </button>
            </div>
          </div>
        </div>

        <!-- 상대방 평가 섹션 -->
        <div
          class="p-5 space-y-5 text-left bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
              <i class="fas fa-user-friends text-gray-400 text-sm"></i>
            </div>
            <h3 class="text-base font-bold text-white">
              {{ user1.id == currentUserId ? user2.nickname : user1.nickname }} 님을 평가해주세요
            </h3>
          </div>

          <div class="space-y-4">
            <div class="space-y-2.5">
              <label class="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <i class="fas fa-heart text-gray-400 text-xs"></i>
                매너
              </label>
              <div class="flex gap-2 items-center">
                <i
                  v-for="n in 5"
                  :key="'manner' + n"
                  @click="setManner(n)"
                  :class="
                    n <= review.manner ? 'fas fa-star text-orange-400' : 'far fa-star text-gray-400'
                  "
                  class="text-2xl cursor-pointer hover:scale-110 hover:text-orange-300 transition-all"
                ></i>
                <span v-if="review.manner > 0" class="text-sm font-medium text-orange-400 ml-1"
                  >{{ review.manner }}/5</span
                >
              </div>
            </div>

            <div class="space-y-2.5">
              <label class="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                <i class="fas fa-fire text-gray-400 text-xs"></i>
                퍼포먼스
              </label>
              <div class="flex gap-2 items-center">
                <i
                  v-for="n in 5"
                  :key="'perf' + n"
                  @click="setPerformance(n)"
                  :class="
                    n <= review.performance
                      ? 'fas fa-star text-orange-400'
                      : 'far fa-star text-gray-400'
                  "
                  class="text-2xl cursor-pointer hover:scale-110 hover:text-orange-300 transition-all"
                ></i>
                <span v-if="review.performance > 0" class="text-sm font-medium text-orange-400 ml-1"
                  >{{ review.performance }}/5</span
                >
              </div>
            </div>
          </div>

          <button
            @click="showReviewModal = true"
            class="w-full border border-gray-700 rounded-xl p-3.5 text-sm text-left bg-gray-800/50 hover:bg-gray-700/50 transition-all"
          >
            <div class="flex items-center gap-2.5">
              <i class="fas fa-comment-dots text-gray-400"></i>
              <span v-if="review.text && review.text.length > 0" class="flex-1 text-gray-200">{{
                review.text
              }}</span>
              <span v-else class="text-gray-500 flex-1">텍스트 리뷰 (선택)</span>
            </div>
          </button>

          <!-- Fullscreen review modal -->
          <transition name="modal-fade">
            <div
              v-if="showReviewModal"
              class="fixed inset-0 z-[60]"
            >
              <!-- 블러 배경 -->
              <div class="absolute inset-0 bg-black/90 backdrop-blur-md" @click="showReviewModal = false"></div>

              <!-- 모달 컨텐츠 -->
              <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                <!-- 헤더 -->
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-800/80 ">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
                      <i class="fas fa-comment-dots text-gray-400"></i>
                    </div>
                    <span class="font-bold text-lg text-white">상대방 리뷰</span>
                  </div>
                  <button
                    @click="showReviewModal = false"
                    class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
                  >
                    <i class="fas fa-times text-sm"></i>
                  </button>
                </div>

                <!-- 텍스트 영역 -->
                <div class="flex-1 p-5 overflow-y-auto">
                  <textarea
                    v-model="review.text"
                    class="w-full h-full min-h-[300px] text-base text-white focus:outline-none resize-none bg-transparent placeholder-gray-500"
                    placeholder="상대방에게 남기고 싶은 말을 자유롭게 입력하세요..."
                    autofocus
                  ></textarea>
                </div>

                <!-- 푸터 -->
                <div class="px-5 py-4 border-t border-gray-800 bg-gray-900/50">
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>{{ review.text?.length || 0 }}자</span>
                    <button
                      @click="showReviewModal = false"
                      class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all"
                    >
                      완료
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- 규칙 평가 섹션 -->
        <div
          class="p-5 space-y-5 text-left bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50"
        >
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <i class="fas fa-book text-purple-400 text-sm"></i>
            </div>
            <h3 class="text-base font-bold text-white">이 규칙은 어떠셨나요?</h3>
          </div>
          <p class="text-xs text-gray-400 -mt-2">
            규칙의 재미, 명확성, 밸런스를 평가해주세요. 여러분의 평가는 다른 사용자들에게 도움이
            됩니다.
          </p>

          <div class="space-y-2.5">
            <label class="text-sm font-medium text-gray-300 flex items-center gap-1.5">
              <i class="fas fa-star text-purple-400 text-xs"></i>
              규칙 평가
            </label>
            <div class="flex gap-2 items-center">
              <i
                v-for="n in 5"
                :key="'rule' + n"
                @click="setRuleRating(n)"
                :class="
                  n <= ruleRating ? 'fas fa-star text-purple-400' : 'far fa-star text-gray-400'
                "
                class="text-2xl cursor-pointer hover:scale-110 hover:text-purple-300 transition-all"
              ></i>
              <span v-if="ruleRating > 0" class="text-sm font-medium text-purple-400 ml-1"
                >{{ ruleRating }}/5</span
              >
            </div>
          </div>

          <button
            @click="showRuleReviewModal = true"
            class="w-full border border-gray-700 rounded-xl p-3.5 text-sm text-left bg-gray-800/50 hover:bg-gray-700/50 transition-all"
          >
            <div class="flex items-center gap-2.5">
              <i class="fas fa-comment-dots text-gray-400"></i>
              <span v-if="ruleReview && ruleReview.length > 0" class="flex-1 text-gray-200">{{
                ruleReview
              }}</span>
              <span v-else class="text-gray-500 flex-1">규칙에 대한 의견 (선택)</span>
            </div>
          </button>

          <!-- Fullscreen rule review modal -->
          <transition name="modal-fade">
            <div
              v-if="showRuleReviewModal"
              class="fixed inset-0 z-[60]"
            >
              <!-- 블러 배경 -->
              <div class="absolute inset-0 bg-black/90 backdrop-blur-md" @click="showRuleReviewModal = false"></div>

              <!-- 모달 컨텐츠 -->
              <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">
                <!-- 헤더 -->
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-800/80 ">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                      <i class="fas fa-comment-dots text-purple-400"></i>
                    </div>
                    <span class="font-bold text-lg text-white">규칙 평가 의견</span>
                  </div>
                  <button
                    @click="showRuleReviewModal = false"
                    class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all flex items-center justify-center"
                  >
                    <i class="fas fa-times text-sm"></i>
                  </button>
                </div>

                <!-- 텍스트 영역 -->
                <div class="flex-1 p-5 overflow-y-auto">
                  <textarea
                    v-model="ruleReview"
                    class="w-full h-full min-h-[300px] text-base text-white focus:outline-none resize-none bg-transparent placeholder-gray-500"
                    placeholder="규칙의 장단점, 개선할 점 등을 자유롭게 작성해주세요..."
                    autofocus
                  ></textarea>
                </div>

                <!-- 푸터 -->
                <div class="px-5 py-4 border-t border-gray-800 bg-gray-900/50">
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>{{ ruleReview?.length || 0 }}자</span>
                    <button
                      @click="showRuleReviewModal = false"
                      class="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all"
                    >
                      완료
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <div class="flex justify-center gap-3 mt-6">
          <button @click="sendFriendRequest" class="px-5 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30 hover:bg-blue-500/30 transition-all">
            <i class="fas fa-user-plus mr-1.5 text-sm"></i>친구 추가
          </button>
          <button @click="onShare" class="px-5 py-2.5 rounded-xl bg-green-500/20 text-green-400 font-bold border border-green-500/30 hover:bg-green-500/30 transition-all">
            <i class="fas fa-share-alt mr-1.5 text-sm"></i>결과 공유
          </button>

        </div>
      </div>
    </div>

    <!-- 하단 고정 버튼 -->
    <button
      @click="submitReviewAndGoHome"
      :disabled="isSubmitting"
     class="flex-shrink-0 w-full text-gray-100 py-4 bg-orange-500 text-white font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      제출하기
    </button>

    <!-- 제출 확인 모달 제거 -->

    <!-- 제출 중 로딩 오버레이 -->
    <div
      v-if="isSubmitting"
      class="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gray-900 bg-opacity-95"
    >
      <div
        class="animate-spin rounded-full h-16 w-16 border-4 border-t-orange-500 border-orange-500/30 mb-4"
      ></div>
      <p class="text-lg font-bold text-gray-200">제출 중...</p>
      <p class="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
    </div>

    <!-- 숨겨진 카메라 input -->
    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onCameraChange"
      class="hidden"
    />

    <!-- 숨겨진 동영상 input -->
    <input
      ref="videoInputRef"
      type="file"
      accept="video/*"
      capture="environment"
      @change="onVideoChange"
      class="hidden"
    />

    <!-- 사진 삭제 확인 모달 -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-gray-800 w-full max-w-xs rounded-xl shadow-lg p-6 text-center mx-4">
        <div class="mb-5">
          <i class="fas fa-trash-alt text-4xl text-red-500 mb-3"></i>
          <div class="text-lg font-bold text-gray-100 mb-2">사진을 삭제하시겠습니까?</div>
          <p class="text-sm text-gray-400">삭제된 사진은 복구할 수 없습니다.</p>
        </div>
        <div class="flex justify-center gap-3">
          <button
            @click="cancelDeletePicture"
            class="flex-1 px-4 py-2.5 bg-gray-700 text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-600 transition"
          >
            취소
          </button>
          <button
            @click="confirmDeletePicture"
            class="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm shadow hover:bg-red-600 transition"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <CustomToast />
  </div>
</template>

<script setup>
import { useBackClose } from '../../composable/useBackClose'

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import defaultImg from '../../assets/default.png'
import CustomToast from '../../components/CustomToast.vue'
import { useToast } from '../../composable/useToast'
import {
  getGamePictures,
  removeGamePicture,
  addGamePicture,
  addGameVideo,
  compressImage,
  compressVideo,
} from '../../utils/gamePictureStorage'

const { showToast } = useToast()
const showReviewModal = ref(false)
const showRuleReviewModal = ref(false) // 규칙 평가 모달
const isSubmitting = ref(false)
const cameraInputRef = ref(null)
const videoInputRef = ref(null)
const showDeleteConfirm = ref(false)
const pictureToDelete = ref(null)

// 자동 제출 함수들
function setManner(n) {
  review.value.manner = n
}
function setPerformance(n) {
  review.value.performance = n
}
function setRuleRating(n) {
  ruleRating.value = n
}

function submitReviewAndGoHome() {
  // 리뷰 제출 전 유효성 검사
  if (review.value.manner === 0 || review.value.performance === 0) {
    showToast('매너와 퍼포먼스 평점을 모두 입력해주세요.')
    return
  }
  const bannedWords = [
    'fuck',
    'shit',
    'asshole',
    'bitch',
    'bastard',
    'dick',
    'fucking',
    'fucker',
    'cunt',
    'nigger',
    'slut',
    'whore',
    'sex',
    'sexy',
    'nazi',
    'motherfucker',
    '씨발',
    '시발',
    '씨바',
    'ㅆㅂ',
    'ㅅㅂ',
    'ㅂㅅ',
    '병신',
    '새끼',
    '좆',
    '애미',
    '개새끼',
    '지랄',
    '염병',
    '꺼져',
    '죽어',
    '멍청',
    '저능',
    '존나',
    'ㅄ',
    'ㄱㅐ',
    'ㅈㄴ',
    '개같',
    '더럽',
    '섹스',
    '자지',
    '보지',
    '딸딸이',
    '빨아',
    '꼬추',
    '보빨',
    '조까',
    '좇',
    '애비',
    '년놈',
    '암캐',
    '걸레',
    '쓰레기',
    '창녀',
    '미친놈',
    '미친년',
  ]
  const lowerText = (review.value.text || '').toLowerCase()
  const found = bannedWords.find((word) => lowerText.includes(word))
  if (found) {
    showToast(`비속어("${found}")가 포함되어 있어 등록할 수 없습니다.`)
    return
  }

  // 바로 제출
  isSubmitting.value = true
  submitPictures()
    .then(() => {
      // 상대방 리뷰 제출
      return api.post(`/api/games/${gameId}/review`, review.value)
    })
    .then(() => {
      // 규칙 평가 제출 (점수가 있을 때만)
      if (ruleRating.value > 0) {
        return api.post(`/api/rules/${game.value.rule.id}/rating`, {
          gameId: game.value.id,
          rating: ruleRating.value,
          comment: ruleReview.value || null,
        })
      }
      return Promise.resolve()
    })
    .then(() => {
      showToast('리뷰가 제출되었습니다.')
      setTimeout(() => {
        goHome()
      }, 500)
    })
    .catch((error) => {
      isSubmitting.value = false
      console.error('제출 실패:', error)
      showToast('잘못된 접근입니다.')
    })
}

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId

const isLoading = ref(true)
const review = ref({ manner: 0, performance: 0, text: '' })
const ruleRating = ref(0) // 규칙 평가 점수 (0~5)
const ruleReview = ref('') // 규칙 평가 의견
const game = ref({})
const user1 = ref({})
const user2 = ref({})
const totalSetCount = ref(0)
const setResults = ref([])
const drawCount = ref(0)
const user1SetCount = ref(0)
const user2SetCount = ref(0)
const startDate = ref('')
const winnerIdx = ref(0)
const currentUserId = ref(0)
const championIdx = ref(0)
const idxCorrect = ref(true)

// 사진 관련 상태
const allPictures = ref([])
const selectedPictures = ref([])
const draggedIndex = ref(null)
const touchStartIndex = ref(null)
const touchCurrentIndex = ref(null)
const isDragging = ref(false)

// 선택되지 않은 사진들
const unselectedPictures = computed(() => {
  const selectedIds = new Set(selectedPictures.value.map((p) => p.id))
  return allPictures.value.filter((p) => !selectedIds.has(p.id))
})

onMounted(async () => {
  try {
    const myIdRes = await api.get('/api/auth/current-user-id')
    currentUserId.value = myIdRes.data

    const res = await api.get(`/api/games/${gameId}/result`)
    game.value = res.data.gameSummary
    startDate.value = res.data.startDate
    setResults.value = res.data.setResults
    totalSetCount.value = res.data.totalSetCount
    drawCount.value = res.data.drawCount
    winnerIdx.value = res.data.winnerIdx
    championIdx.value = res.data.newChampionIdx
    idxCorrect.value = res.data.user1.id === currentUserId.value

    if (idxCorrect.value) {
      user1.value = res.data.user1
      user2.value = res.data.user2
      user1SetCount.value = res.data.user1SetCount
      user2SetCount.value = res.data.user2SetCount
    } else {
      user1.value = res.data.user2
      user2.value = res.data.user1
      user1SetCount.value = res.data.user2SetCount
      user2SetCount.value = res.data.user1SetCount
      winnerIdx.value = res.data.winnerIdx === 2 ? 1 : res.data.winnerIdx === 1 ? 2 : 0
    }

    // 저장된 사진 불러오기
    allPictures.value = await getGamePictures(gameId)
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
})

// 카메라 열기
const openCamera = () => {
  if (allPictures.value.length >= 5) {
    showToast('최대 5개까지 촬영할 수 있습니다.')
    return
  }
  cameraInputRef.value?.click()
}

// 동영상 촬영기 열기
const openVideoRecorder = () => {
  if (allPictures.value.length >= 5) {
    showToast('최대 5개까지 촬영할 수 있습니다.')
    return
  }
  videoInputRef.value?.click()
}

// 카메라 파일 선택 완료
const onCameraChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (allPictures.value.length >= 5) {
    showToast('최대 5개까지 촬영할 수 있습니다.')
    e.target.value = ''
    return
  }

  const reader = new FileReader()

  reader.onload = async (event) => {
    try {
      const dataUrl = event.target.result

      // 이미지 압축 (기본값 사용: 1200px, quality 0.6)
      const compressed = await compressImage(dataUrl)

      // IndexedDB에 저장
      await addGamePicture(gameId, compressed)

      // 목록 갱신
      allPictures.value = await getGamePictures(gameId)

      showToast('사진이 저장되었습니다!')
    } catch (error) {
      console.error('사진 저장 실패:', error)
      if (error.message === 'QUOTA_EXCEEDED') {
        showToast('저장 공간이 부족합니다. 일부 사진을 삭제한 후 다시 시도해주세요.')
      } else {
        showToast('사진 저장에 실패했습니다.')
      }
    }
  }

  reader.onerror = () => {
    console.error('파일 읽기 실패')
    showToast('사진 저장에 실패했습니다.')
  }

  reader.readAsDataURL(file)

  // input 초기화
  e.target.value = ''
}

// 동영상 파일 선택 완료
const onVideoChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (allPictures.value.length >= 5) {
    showToast('최대 5개까지 촬영할 수 있습니다.')
    e.target.value = ''
    return
  }

  // 파일 형식 체크
  const fileType = file.type.toLowerCase()
  console.log('[GameResultView] 동영상 파일 형식:', fileType, file.name)

  // WebM이 아닌 경우 경고
  if (!fileType.includes('webm')) {
    showToast(
      `⚠️ 주의: ${fileType || '알 수 없는 형식'} 파일입니다. 서버 업로드 시 WebM으로 변환이 필요할 수 있습니다.`,
    )
    console.warn('[GameResultView] Non-WebM video detected:', file.type)
  }

  showToast('동영상 처리 중...')

  try {
    // 동영상 압축 (최대 2분)
    const { dataUrl, duration } = await compressVideo(file, 120)

    // IndexedDB에 저장
    await addGameVideo(gameId, dataUrl, duration)

    // 목록 갱신
    allPictures.value = await getGamePictures(gameId)

    showToast(`동영상이 저장되었습니다! (${Math.floor(duration)}초)`)
  } catch (error) {
    console.error('동영상 저장 실패:', error)
    if (error.message === 'QUOTA_EXCEEDED') {
      showToast('저장 공간이 부족합니다. 일부 미디어를 삭제한 후 다시 시도해주세요.')
    } else {
      showToast('동영상 저장에 실패했습니다.')
    }
  }

  // input 초기화
  e.target.value = ''
}

// 동영상 길이 포맷팅 (초 -> mm:ss)
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 사진 선택
const selectPicture = (pic) => {
  if (selectedPictures.value.length >= 5) {
    showToast('최대 5장까지 선택할 수 있습니다.')
    return
  }
  selectedPictures.value.push(pic)
}

// 사진 선택 해제
const deselectPicture = (picId) => {
  selectedPictures.value = selectedPictures.value.filter((p) => p.id !== picId)
}

// 사진 삭제 확인 모달 열기
const deletePicture = (picId) => {
  pictureToDelete.value = picId
  showDeleteConfirm.value = true
}

// 사진 삭제 확정
const confirmDeletePicture = async () => {
  if (pictureToDelete.value) {
    allPictures.value = await removeGamePicture(gameId, pictureToDelete.value)
    selectedPictures.value = selectedPictures.value.filter((p) => p.id !== pictureToDelete.value)
    showToast('사진이 삭제되었습니다.')
  }
  showDeleteConfirm.value = false
  pictureToDelete.value = null
}

// 사진 삭제 취소
const cancelDeletePicture = () => {
  showDeleteConfirm.value = false
  pictureToDelete.value = null
}

// 드래그 시작 (마우스)
const handleDragStart = (index) => {
  draggedIndex.value = index
  isDragging.value = true
}

// 드래그 오버
const handleDragOver = (e) => {
  e.preventDefault()
}

// 드래그 종료
const handleDragEnd = () => {
  isDragging.value = false
  draggedIndex.value = null
}

// 드롭 (마우스)
const handleDrop = (dropIndex) => {
  if (draggedIndex.value === null) return

  const draggedItem = selectedPictures.value[draggedIndex.value]
  selectedPictures.value.splice(draggedIndex.value, 1)
  selectedPictures.value.splice(dropIndex, 0, draggedItem)

  isDragging.value = false
  draggedIndex.value = null
}

// 터치 드래그 시작
const handleTouchStart = (index) => {
  touchStartIndex.value = index
  isDragging.value = true
}

// 터치 드래그 중
const handleTouchMove = (e) => {
  if (touchStartIndex.value === null) return

  const touch = e.touches[0]
  const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY)

  if (elementAtPoint) {
    const closestItem = elementAtPoint.closest('[data-index]')
    if (closestItem) {
      const newIndex = parseInt(closestItem.getAttribute('data-index'))
      touchCurrentIndex.value = newIndex
    }
  }
}

// 터치 드래그 종료
const handleTouchEnd = (dropIndex) => {
  if (touchStartIndex.value === null) return

  const targetIndex = touchCurrentIndex.value !== null ? touchCurrentIndex.value : dropIndex

  if (touchStartIndex.value !== targetIndex) {
    const draggedItem = selectedPictures.value[touchStartIndex.value]
    selectedPictures.value.splice(touchStartIndex.value, 1)
    selectedPictures.value.splice(targetIndex, 0, draggedItem)
  }

  isDragging.value = false
  touchStartIndex.value = null
  touchCurrentIndex.value = null
}

// 사진/동영상 제출
const submitPictures = async () => {
  if (selectedPictures.value.length === 0) {
    return Promise.resolve()
  }

  try {
    const formData = new FormData()

    selectedPictures.value.forEach((pic, index) => {
      if (pic.type === 'image') {
        const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.jpg`)
        formData.append('pictures', file)
      } else if (pic.type === 'video') {
        const file = dataUrlToFile(pic.dataUrl, `game_${gameId}_${index}.webm`)
        formData.append('videos', file)
      }
    })

    await api.post(`/api/games/${gameId}/pictures`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return Promise.resolve()
  } catch (err) {
    console.error('미디어 제출 실패:', err)
    return Promise.reject(err)
  }
}

// base64를 File 객체로 변환
const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

const goHome = () => router.push(`/profile/0?id=${gameId}`)

// 친구 요청
async function sendFriendRequest() {
  try {
    const opponentId = user1.value.id === currentUserId.value ? user2.value.id : user1.value.id
    await api.post(`/api/friends/request/${opponentId}`)
    showToast('친구 요청을 보냈습니다!')
  } catch (e) {
    if (e?.response?.data?.message) showToast(e.response.data.message)
    else showToast('이미 요청했거나 친구 상태입니다.')
  }
}

// 경기 공유
async function onShare() {
  try {
    const res = await api.post('/api/invite', null, { params: { gameId: `${gameId}` } })
    const url = res.data.url
    const opponentName =
      user1.value.id === currentUserId.value ? user2.value.nickname : user1.value.nickname
    const text = `${opponentName}님과의 경기 결과 – Match`

    if (navigator.share) {
      await navigator.share({ title: 'Match', text, url })
    } else {
      await navigator.clipboard.writeText(url)
      showToast('링크를 복사했어요!')
    }
  } catch (e) {
    console.log(e)
    if (e?.message !== 'Share canceled') {
      showToast('공유에 실패했습니다.')
    }
  }
}

// 뒤로가기는 열린 모달부터 닫는다
useBackClose(showReviewModal, showRuleReviewModal, showDeleteConfirm)
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.champion-card-bg {
  background: linear-gradient(135deg, #fdba74 10%, #fb923c 70%, #f59e42 100%);
  filter: blur(0px) brightness(1.05) saturate(1.2);
  opacity: 0.98;
  animation: champion-bg-move 7s ease-in-out infinite alternate;
}

@keyframes champion-bg-move {
  0% {
    background-position: 0% 50%;
    filter: blur(0px) brightness(1.1) saturate(1.3);
  }
  50% {
    background-position: 100% 60%;
    filter: blur(2px) brightness(1.18) saturate(1.6);
  }
  100% {
    background-position: 0% 40%;
    filter: blur(0px) brightness(1.1) saturate(1.2);
  }
}

.champion-card-glow {
  box-shadow:
    0 0 64px 8px #fdba7477,
    0 0 0 4px #fb923c55 inset;
  position: relative;
}

.champion-glow-anim {
  filter: drop-shadow(0 0 12px #fff7) drop-shadow(0 0 16px #fdba74bb);
  animation: champion-glow-anim 1.8s ease-in-out infinite alternate;
}

@keyframes champion-glow-anim {
  0% {
    filter: drop-shadow(0 0 16px #fff9) drop-shadow(0 0 8px #fdba74cc);
  }
  100% {
    filter: drop-shadow(0 0 28px #fff) drop-shadow(0 0 18px #fdba74);
  }
}

@keyframes gradient-x {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.animate-gradient-x {
  animation: gradient-x 2.5s linear infinite;
}

/* 모달 트랜지션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .fixed,
.modal-fade-leave-to .fixed {
  transform: translate(-50%, -50%) scale(0.9) !important;
}

.modal-fade-enter-active .fixed,
.modal-fade-leave-active .fixed {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
