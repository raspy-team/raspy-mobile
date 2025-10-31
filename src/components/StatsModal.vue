<template>
  <transition name="fade">
    <div
      class="fixed inset-0 bg-black/30 flex justify-center items-center z-50"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-2xl p-7 shadow-2xl max-w-xs w-full relative overflow-visible animate-modalpop"
      >
        <!-- Close Button (메인 뷰일 때만) -->
        <button
          v-if="currentView === 'main'"
          @click="$emit('close')"
          class="absolute right-6 top-6 text-gray-400 hover:text-red-400 text-2xl z-10 transition-colors duration-150 bg-white rounded-full shadow-md p-1"
          aria-label="닫기"
        >
          <svg width="32" height="32" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="#f3f4f6" />
            <path
              d="M26.6667 79.1666L20.8334 73.3333L44.1667 49.9999L20.8334 26.6666L26.6667 20.8333L50 44.1666L73.3334 20.8333L79.1667 26.6666L55.8334 49.9999L79.1667 73.3333L73.3334 79.1666L50 55.8333L26.6667 79.1666Z"
              fill="#e11d48"
            />
          </svg>
        </button>

        <!-- Back Button (서브 뷰일 때만) -->
        <button
          v-if="currentView !== 'main'"
          @click="goBackToMain"
          class="absolute left-6 top-6 text-gray-600 hover:text-gray-800 text-xl z-10 transition-colors duration-150"
          aria-label="뒤로가기"
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <!-- Title -->
        <div class="flex flex-col gap-2 items-center mb-5 mt-1">
          <span class="text-base font-bold text-gray-800 text-center">
            <template v-if="currentView === 'main'">{{ nickname }}님의 통계</template>
            <template v-else-if="currentView === 'champions'">챔피언 목록</template>
            <template v-else-if="currentView === 'friends'">친구 목록</template>
          </span>
        </div>

        <!-- Main Stats Grid -->
        <div v-if="currentView === 'main'" class="grid grid-cols-2 gap-4 text-center">
          <!-- 승 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M39.7916 74.9999L16.0416 51.2499L21.9791 45.3124L39.7916 63.1249L78.0208 24.8958L83.9583 30.8333L39.7916 74.9999Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{ stats.wins }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">승</span>
          </div>
          <!-- 무 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M8.33337 83.3334L50 16.6667L91.6667 83.3334H8.33337ZM23.3334 75.0001H76.6667L50 32.2917L23.3334 75.0001Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{ stats.draws }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">무</span>
          </div>
          <!-- 패 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M26.6667 79.1666L20.8334 73.3333L44.1667 49.9999L20.8334 26.6666L26.6667 20.8333L50 44.1666L73.3334 20.8333L79.1667 26.6666L55.8334 49.9999L79.1667 73.3333L73.3334 79.1666L50 55.8333L26.6667 79.1666Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{ stats.losses }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">패</span>
          </div>
          <!-- 플레이 타임 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M50 45.8333C54.5834 45.8333 58.507 44.2013 61.7709 40.9374C65.0347 37.6735 66.6667 33.7499 66.6667 29.1666V16.6666H33.3334V29.1666C33.3334 33.7499 34.9653 37.6735 38.2292 40.9374C41.4931 44.2013 45.4167 45.8333 50 45.8333ZM16.6667 91.6666V83.3333H25V70.8333C25 66.5971 25.9896 62.6214 27.9688 58.9062C29.9479 55.1909 32.7084 52.2221 36.25 49.9999C32.7084 47.7777 29.9479 44.8089 27.9688 41.0937C25.9896 37.3784 25 33.4027 25 29.1666V16.6666H16.6667V8.33325H83.3334V16.6666H75V29.1666C75 33.4027 74.0104 37.3784 72.0313 41.0937C70.0521 44.8089 67.2917 47.7777 63.75 49.9999C67.2917 52.2221 70.0521 55.1909 72.0313 58.9062C74.0104 62.6214 75 66.5971 75 70.8333V83.3333H83.3334V91.6666H16.6667Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{ formattedPlayTime }}</span>
            <span class="text-[0.55rem] text-gray-500 font-semibold mt-0.5">플레이 시간</span>
          </div>
          <!-- 퍼포먼스 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M43.5417 64.5834C45.2084 66.2501 47.3612 67.0661 50 67.0313C52.6389 66.9966 54.5834 66.0417 55.8334 64.1667L79.1667 29.1667L44.1667 52.5001C42.2917 53.7501 41.3021 55.6598 41.198 58.2292C41.0938 60.7987 41.875 62.9167 43.5417 64.5834ZM50 16.6667C54.0973 16.6667 58.0382 17.2397 61.823 18.3855C65.6077 19.5313 69.1667 21.2501 72.5 23.5417L64.5834 28.5417C62.2917 27.3612 59.9132 26.4758 57.448 25.8855C54.9827 25.2952 52.5 25.0001 50 25.0001C40.7639 25.0001 32.8993 28.2466 26.4063 34.7397C19.9132 41.2327 16.6667 49.0973 16.6667 58.3334C16.6667 61.2501 17.066 64.132 17.8646 66.9792C18.6632 69.8265 19.7917 72.5001 21.25 75.0001H78.75C80.3473 72.3612 81.5105 69.6181 82.2396 66.7709C82.9688 63.9237 83.3334 60.9723 83.3334 57.9167C83.3334 55.4167 83.0382 52.9862 82.448 50.6251C81.8577 48.264 80.9723 45.9723 79.7917 43.7501L84.7917 35.8334C86.875 39.0973 88.5244 42.5695 89.7396 46.2501C90.9549 49.9306 91.5973 53.7501 91.6667 57.7084C91.7362 61.6667 91.2848 65.4515 90.3125 69.0626C89.3403 72.6737 87.9167 76.1112 86.0417 79.3751C85.2778 80.6251 84.2362 81.5973 82.9167 82.2917C81.5973 82.9862 80.2084 83.3334 78.75 83.3334H21.25C19.7917 83.3334 18.4028 82.9862 17.0834 82.2917C15.7639 81.5973 14.7223 80.6251 13.9584 79.3751C12.1528 76.2501 10.7639 72.9341 9.79171 69.4272C8.81949 65.9202 8.33337 62.2223 8.33337 58.3334C8.33337 52.5695 9.42712 47.1702 11.6146 42.1355C13.8021 37.1008 16.7882 32.6911 20.573 28.9063C24.3577 25.1216 28.7848 22.1355 33.8542 19.948C38.9237 17.7605 44.3056 16.6667 50 16.6667Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{
              stats.performance == null ? '-' : stats.performance.toFixed(1)
            }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">퍼포먼스</span>
          </div>
          <!-- 매너 -->
          <div
            class="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm"
          >
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M50 87.5001L43.9584 82.0834C36.9445 75.764 31.1459 70.3126 26.5625 65.7293C21.9792 61.1459 18.3334 57.0313 15.625 53.3855C12.9167 49.7397 11.0243 46.389 9.94796 43.3334C8.87157 40.2779 8.33337 37.1529 8.33337 33.9584C8.33337 27.4306 10.5209 21.9792 14.8959 17.6042C19.2709 13.2292 24.7223 11.0417 31.25 11.0417C34.8612 11.0417 38.2987 11.8056 41.5625 13.3334C44.8264 14.8612 47.6389 17.014 50 19.7917C52.3612 17.014 55.1737 14.8612 58.4375 13.3334C61.7014 11.8056 65.1389 11.0417 68.75 11.0417C75.2778 11.0417 80.7292 13.2292 85.1042 17.6042C89.4792 21.9792 91.6667 27.4306 91.6667 33.9584C91.6667 37.1529 91.1285 40.2779 90.0521 43.3334C88.9757 46.389 87.0834 49.7397 84.375 53.3855C81.6667 57.0313 78.0209 61.1459 73.4375 65.7293C68.8542 70.3126 63.0556 75.764 56.0417 82.0834L50 87.5001ZM50 76.2501C56.6667 70.2779 62.1528 65.1563 66.4584 60.8855C70.7639 56.6147 74.1667 52.8994 76.6667 49.7397C79.1667 46.5799 80.9028 43.7674 81.875 41.3022C82.8473 38.8369 83.3334 36.389 83.3334 33.9584C83.3334 29.7917 81.9445 26.3195 79.1667 23.5417C76.3889 20.764 72.9167 19.3751 68.75 19.3751C65.4862 19.3751 62.4653 20.2952 59.6875 22.1355C56.9098 23.9758 55 26.3195 53.9584 29.1667H46.0417C45 26.3195 43.0903 23.9758 40.3125 22.1355C37.5348 20.2952 34.5139 19.3751 31.25 19.3751C27.0834 19.3751 23.6112 20.764 20.8334 23.5417C18.0556 26.3195 16.6667 29.7917 16.6667 33.9584C16.6667 36.389 17.1528 38.8369 18.125 41.3022C19.0973 43.7674 20.8334 46.5799 23.3334 49.7397C25.8334 52.8994 29.2362 56.6147 33.5417 60.8855C37.8473 65.1563 43.3334 70.2779 50 76.2501Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]">{{
              manner == null ? '-' : manner.toFixed(1)
            }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">매너</span>
          </div>
          <!-- 친구 -->
          <div
            @click="showFriends"
            class="relative flex flex-col items-center justify-center p-3 rounded-lg shadow-sm transition-all bg-blue-50 border-blue-300 border-2 border-transparent cursor-pointer group"
          >
            <!-- 클릭 가능 표시 -->
            <div class="absolute top-2 right-2 opacity-100 transition-opacity">
              <i class="fas fa-chevron-right text-blue-500 text-xs"></i>
            </div>
            <span class="my-1">
              <svg width="60" height="56" viewBox="0 0 100 100">
                <path
                  d="M4.16663 83.3334V71.6667C4.16663 69.3056 4.77426 67.1355 5.98954 65.1563C7.20482 63.1772 8.8194 61.6667 10.8333 60.6251C15.1388 58.4723 19.5138 56.8577 23.9583 55.7813C28.4027 54.7049 32.9166 54.1667 37.5 54.1667C42.0833 54.1667 46.5972 54.7049 51.0416 55.7813C55.4861 56.8577 59.8611 58.4723 64.1666 60.6251C66.1805 61.6667 67.7951 63.1772 69.0104 65.1563C70.2257 67.1355 70.8333 69.3056 70.8333 71.6667V83.3334H4.16663ZM79.1666 83.3334V70.8334C79.1666 67.7779 78.3159 64.8438 76.6145 62.0313C74.9132 59.2188 72.5 56.8056 69.375 54.7917C72.9166 55.2084 76.25 55.9202 79.375 56.9272C82.5 57.9341 85.4166 59.1667 88.125 60.6251C90.625 62.014 92.5347 63.5591 93.8541 65.2605C95.1736 66.9619 95.8333 68.8195 95.8333 70.8334V83.3334H79.1666ZM37.5 50.0001C32.9166 50.0001 28.993 48.3681 25.7291 45.1042C22.4652 41.8404 20.8333 37.9167 20.8333 33.3334C20.8333 28.7501 22.4652 24.8265 25.7291 21.5626C28.993 18.2987 32.9166 16.6667 37.5 16.6667C42.0833 16.6667 46.0069 18.2987 49.2708 21.5626C52.5347 24.8265 54.1666 28.7501 54.1666 33.3334C54.1666 37.9167 52.5347 41.8404 49.2708 45.1042C46.0069 48.3681 42.0833 50.0001 37.5 50.0001ZM79.1666 33.3334C79.1666 37.9167 77.5347 41.8404 74.2708 45.1042C71.0069 48.3681 67.0833 50.0001 62.5 50.0001C61.7361 50.0001 60.7638 49.9133 59.5833 49.7397C58.4027 49.5661 57.4305 49.3751 56.6666 49.1667C58.5416 46.9445 59.9826 44.4792 60.9895 41.7709C61.9965 39.0626 62.5 36.2501 62.5 33.3334C62.5 30.4167 61.9965 27.6042 60.9895 24.8959C59.9826 22.1876 58.5416 19.7223 56.6666 17.5001C57.6388 17.1529 58.6111 16.9272 59.5833 16.823C60.5555 16.7188 61.5277 16.6667 62.5 16.6667C67.0833 16.6667 71.0069 18.2987 74.2708 21.5626C77.5347 24.8265 79.1666 28.7501 79.1666 33.3334ZM12.5 75.0001H62.5V71.6667C62.5 70.9029 62.309 70.2084 61.927 69.5834C61.5451 68.9584 61.0416 68.4723 60.4166 68.1251C56.6666 66.2501 52.8819 64.8438 49.0625 63.9063C45.243 62.9688 41.3888 62.5001 37.5 62.5001C33.6111 62.5001 29.7569 62.9688 25.9375 63.9063C22.118 64.8438 18.3333 66.2501 14.5833 68.1251C13.9583 68.4723 13.4548 68.9584 13.0729 69.5834C12.6909 70.2084 12.5 70.9029 12.5 71.6667V75.0001ZM37.5 41.6667C39.7916 41.6667 41.7534 40.8508 43.3854 39.2188C45.0173 37.5869 45.8333 35.6251 45.8333 33.3334C45.8333 31.0417 45.0173 29.0799 43.3854 27.448C41.7534 25.8161 39.7916 25.0001 37.5 25.0001C35.2083 25.0001 33.2465 25.8161 31.6145 27.448C29.9826 29.0799 29.1666 31.0417 29.1666 33.3334C29.1666 35.6251 29.9826 37.5869 31.6145 39.2188C33.2465 40.8508 35.2083 41.6667 37.5 41.6667Z"
                  fill="#4d4d4d"
                />
              </svg>
            </span>
            <span class="text-lg font-extrabold text-[#4d4d4d]"> {{ stats.friends }}</span>
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">친구</span>
          </div>
          <!-- 챔피언 -->
          <div
            @click="showChampions"
            class="relative flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg shadow-sm transition-all bg-yellow-50 border-yellow-300 border-2 border-transparent cursor-pointer group"
          >
            <!-- 클릭 가능 표시 -->
            <div class="absolute top-2 right-2 opacity-100 transition-opacity">
              <i class="fas fa-chevron-right text-yellow-600 text-xs"></i>
            </div>
            <span class="text-lg font-extrabold text-gray-600 relative">
              <svg class="" width="60" height="56" viewBox="0 0 150 135">
                <path
                  d="M22.5 135V120H127.5V135H22.5ZM22.5 108.75L12.9375 48.5625C12.6875 48.5625 12.4062 48.5938 12.0938 48.6562C11.7812 48.7188 11.5 48.75 11.25 48.75C8.125 48.75 5.46875 47.6562 3.28125 45.4688C1.09375 43.2812 0 40.625 0 37.5C0 34.375 1.09375 31.7188 3.28125 29.5312C5.46875 27.3438 8.125 26.25 11.25 26.25C14.375 26.25 17.0312 27.3438 19.2188 29.5312C21.4062 31.7188 22.5 34.375 22.5 37.5C22.5 38.375 22.4062 39.1875 22.2188 39.9375C22.0312 40.6875 21.8125 41.375 21.5625 42L45 52.5L68.4375 20.4375C67.0625 19.4375 65.9375 18.125 65.0625 16.5C64.1875 14.875 63.75 13.125 63.75 11.25C63.75 8.125 64.8438 5.46875 67.0312 3.28125C69.2188 1.09375 71.875 0 75 0C78.125 0 80.7812 1.09375 82.9688 3.28125C85.1562 5.46875 86.25 8.125 86.25 11.25C86.25 13.125 85.8125 14.875 84.9375 16.5C84.0625 18.125 82.9375 19.4375 81.5625 20.4375L105 52.5L128.438 42C128.188 41.375 127.969 40.6875 127.781 39.9375C127.594 39.1875 127.5 38.375 127.5 37.5C127.5 34.375 128.594 31.7188 130.781 29.5312C132.969 27.3438 135.625 26.25 138.75 26.25C141.875 26.25 144.531 27.3438 146.719 29.5312C148.906 31.7188 150 34.375 150 37.5C150 40.625 148.906 43.2812 146.719 45.4688C144.531 47.6562 141.875 48.75 138.75 48.75C138.5 48.75 138.219 48.7188 137.906 48.6562C137.594 48.5938 137.312 48.5625 137.062 48.5625L127.5 108.75H22.5ZM35.25 93.75H114.75L119.625 62.4375L99.9375 71.0625L75 36.75L50.0625 71.0625L30.375 62.4375L35.25 93.75Z"
                  :fill="championCount > 0 ? '#F5C542' : '#5b5b5b'"
                />
              </svg>
            </span>
            <span
              class="block text-[1.1rem] font-extrabold drop-shadow mt-1"
              :style="championCount > 0 ? 'color : #F5C542' : 'color : #4d4d4d'"
              >{{ championCount }}</span
            >
            <span class="text-[0.65rem] text-gray-500 font-semibold mt-0.5">챔피언</span>
          </div>
        </div>

        <!-- Champions List View -->
        <div v-else-if="currentView === 'champions'" class="max-h-96 overflow-y-auto">
          <div v-if="myChampions && myChampions.length > 0" class="space-y-3">
            <div
              v-for="(champion, index) in myChampions"
              :key="index"
              class="relative p-4 rounded-xl bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all group"
            >
              <div class="flex items-center gap-3">
                <!-- 순위 뱃지 -->
                <div class="flex-shrink-0">
                  <div class="relative w-14 h-14 flex items-center justify-center">
                    <!-- 금메달 -->
                    <div
                      v-if="index === 0"
                      class="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full"
                    ></div>
                    <!-- 은메달 -->
                    <div
                      v-else-if="index === 1"
                      class="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full"
                    ></div>
                    <!-- 동메달 -->
                    <div
                      v-else-if="index === 2"
                      class="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full"
                    ></div>
                    <!-- 그 외 -->
                    <div
                      v-else
                      class="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"
                    ></div>

                    <i class="fas fa-trophy text-white text-2xl relative z-10 drop-shadow-md"></i>
                    <div
                      class="absolute -bottom-1 -right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2"
                      :class="{
                        'border-yellow-500': index === 0,
                        'border-gray-400': index === 1,
                        'border-orange-500': index === 2,
                        'border-blue-500': index > 2,
                      }"
                    >
                      <span
                        class="text-xs font-black"
                        :class="{
                          'text-yellow-600': index === 0,
                          'text-gray-600': index === 1,
                          'text-orange-600': index === 2,
                          'text-blue-600': index > 2,
                        }"
                      >
                        {{ index + 1 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold text-gray-900 truncate mb-1">
                    {{ champion.ruleTitle }}
                  </h3>
                  <p class="text-xs text-gray-600 flex items-center gap-1">
                    <i class="fas fa-map-marker-alt text-gray-400"></i>
                    {{ champion.region }}
                  </p>
                </div>

                <!-- 우승 아이콘 -->
                <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i class="fas fa-crown text-yellow-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-10">
            <div class="relative inline-block">
              <div
                class="absolute inset-0 bg-gray-200 rounded-full blur-2xl opacity-30 animate-pulse"
              ></div>
              <i class="fas fa-trophy text-6xl mb-3 opacity-20 relative"></i>
            </div>
            <p class="text-sm font-semibold">아직 획득한 챔피언이 없습니다</p>
            <p class="text-xs text-gray-400 mt-2">경기에서 우승하여 챔피언 타이틀을 획득하세요!</p>
          </div>
        </div>

        <!-- Friends List View -->
        <div v-else-if="currentView === 'friends'" class="max-h-96 overflow-y-auto">
          <div v-if="loadingFriends" class="text-center py-10">
            <i class="fas fa-spinner fa-spin text-orange-500 text-3xl"></i>
            <p class="text-sm text-gray-500 mt-3">친구 목록을 불러오는 중...</p>
          </div>
          <div v-else-if="friendsList && friendsList.length > 0" class="space-y-3">
            <div
              v-for="friend in friendsList"
              :key="friend.id"
              class="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all"
            >
              <div class="flex items-center gap-3">
                <img
                  @click="goToFriendProfile(friend.id)"
                  :src="friend.avatar || '/default.png'"
                  class="w-12 h-12 rounded-full object-cover border-2 border-blue-400 cursor-pointer hover:border-blue-500 transition-all"
                  alt="Friend Profile"
                />
                <div class="flex-1 min-w-0 cursor-pointer" @click="goToFriendProfile(friend.id)">
                  <h3 class="text-sm font-bold text-gray-900 truncate">
                    {{ friend.nickname }}
                  </h3>
                  <p v-if="friend.intro" class="text-xs text-gray-600 mt-0.5 truncate">
                    {{ friend.intro }}
                  </p>
                </div>
                <!-- 내 프로필일 때만 친구 끊기 버튼 표시 -->
                <button
                  v-if="isMyProfile"
                  @click.stop="openUnfriendModal(friend)"
                  class="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-all"
                >
                  <i class="fas fa-user-minus mr-1"></i>
                  끊기
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 py-10">
            <i class="fas fa-user-friends text-4xl mb-3 opacity-30"></i>
            <p class="text-sm">친구가 없습니다</p>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- 친구 끊기 확인 모달 -->
  <transition name="fade">
    <div
      v-if="showUnfriendModal"
      class="fixed inset-0 bg-black/50 flex justify-center items-center z-[60]"
      @click.self="cancelUnfriend"
    >
      <div class="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-modalpop">
        <div class="text-center mb-6">
          <div
            class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <i class="fas fa-user-minus text-red-600 text-2xl"></i>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">친구를 끊으시겠습니까?</h3>
          <p class="text-sm text-gray-600 mb-1">
            {{ friendToUnfriend?.nickname }}님과의 친구 관계가 삭제됩니다.
          </p>
          <p class="text-xs text-gray-500">상대는 내가 친구를 끊은 것을 알 수 없습니다.</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="cancelUnfriend"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            취소
          </button>
          <button
            @click="confirmUnfriend"
            class="flex-1 py-3 px-4 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
          >
            끊기
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, defineProps, defineEmits, onMounted, watch, ref } from 'vue'
import api from '../api/api'

const props = defineProps({
  show: Boolean,
  stats: Object,
  nickname: String,
  playTime: Number,
  myChampions: Array,
  manner: String,
  userId: Number,
})

const emit = defineEmits(['close', 'navigateToProfile', 'friendRemoved'])

// 뷰 상태 관리
const currentView = ref('main') // 'main', 'champions', 'friends'
const friendsList = ref([])
const loadingFriends = ref(false)

// 친구 끊기 확인 모달
const showUnfriendModal = ref(false)
const friendToUnfriend = ref(null)

onMounted(() => {
  console.log('StatsModal mounted. Show prop:', props.show)
})

watch(
  () => props.show,
  (newValue) => {
    console.log('StatsModal show prop changed:', newValue)
    // 모달이 닫힐 때 메인 뷰로 리셋
    if (!newValue) {
      currentView.value = 'main'
    }
  },
)

const formattedPlayTime = computed(() => {
  const min = props.playTime ?? 0
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return `${h}h`
})

const championCount = computed(() => props.myChampions?.length ?? 0)

// 챔피언 목록 보기
const showChampions = () => {
  currentView.value = 'champions'
}

// 친구 목록 보기
const showFriends = async () => {
  currentView.value = 'friends'
  loadingFriends.value = true
  try {
    const response = await api.get('/api/friends/my', {
      params: { userId: props.userId || 0 },
    })
    friendsList.value = response.data
  } catch (error) {
    console.error('친구 목록 불러오기 실패:', error)
  } finally {
    loadingFriends.value = false
  }
}

// 메인 뷰로 돌아가기
const goBackToMain = () => {
  currentView.value = 'main'
}

// 친구 프로필로 이동
const goToFriendProfile = (friendId) => {
  // emit으로 부모 컴포넌트에 알려서 모달을 닫고 라우팅
  emit('navigateToProfile', friendId)
}

// 친구 끊기 확인 모달 열기
const openUnfriendModal = (friend) => {
  friendToUnfriend.value = friend
  showUnfriendModal.value = true
}

// 친구 끊기 확인
const confirmUnfriend = async () => {
  if (!friendToUnfriend.value) return

  try {
    await api.delete(`/api/friends/${friendToUnfriend.value.id}`)
    // 목록에서 제거
    friendsList.value = friendsList.value.filter((f) => f.id !== friendToUnfriend.value.id)
    // 부모 컴포넌트에 친구가 제거되었음을 알림
    emit('friendRemoved')
    // 모달 닫기
    showUnfriendModal.value = false
    friendToUnfriend.value = null
  } catch (error) {
    console.error('친구 끊기 실패:', error)
    alert('친구 끊기에 실패했습니다.')
  }
}

// 친구 끊기 취소
const cancelUnfriend = () => {
  showUnfriendModal.value = false
  friendToUnfriend.value = null
}

// 내 프로필인지 확인
const isMyProfile = computed(() => props.userId == 0)
</script>

<style scoped>
@keyframes modalpop {
  0% {
    transform: scale(0.8) translateY(50px);
    opacity: 0;
  }
  80% {
    transform: scale(1.05) translateY(-6px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
.animate-modalpop {
  animation: modalpop 0.5s cubic-bezier(0.42, 2, 0.58, 0.7);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
