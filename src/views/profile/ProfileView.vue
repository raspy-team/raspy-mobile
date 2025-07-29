<template>
  <div class="bg-[#f8f9fa] min-h-full relative raspy-top">
    <!-- Fixed Top Bar -->
    <div
      class="fixed z-30 left-0 right-0 top-0 backdrop-blur flex justify-between items-center px-4 pb-3 border-b border-gray-100 raspy-top"
    >
      <div class="relative flex-1 flex items-center mr-2 sm:w-48 pt-3">
        <i
          class="fas fa-search text-gray-400 absolute left-3 top-1/2 pt-3 -translate-y-1/2 pointer-events-none"
        ></i>
        <input
          type="text"
          readonly
          placeholder="유저 찾기"
          @click="searchUsers"
          class="pl-9 pr-4 py-2 rounded-[5px] border border-gray-200 bg-white text-gray-700 text-sm font-semibold shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-100 transition w-full hover:border-orange-400"
        />
      </div>
      <button
        @click="goSettings"
        class="flex items-center gap-2 px-2 py-1 text-gray-700 hover:text-orange-500 pt-3"
      >
        <i class="fas fa-cog text-lg"></i>
        <span class="font-semibold text-sm hidden sm:inline">설정</span>
      </button>
    </div>

    <!-- SKELETON: 유저정보/통계/그래프/탭 -->
    <template v-if="user == null">
      <section
        class="max-w-lg mx-auto bg-white rounded-2xl shadow-lg mt-10 mb-0 px-6 pt-7 pb-8 flex flex-col gap-5 relative animate-pulse"
      >
        <!-- 프로필 -->
        <div class="flex gap-5 items-start mb-2">
          <div class="w-20 h-20 rounded-full bg-gray-200"></div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="w-28 h-6 bg-gray-200 rounded"></div>
            <div class="flex gap-2">
              <div class="w-16 h-5 bg-orange-100 rounded"></div>
              <div class="w-16 h-5 bg-gray-100 rounded"></div>
            </div>
            <div class="w-40 h-4 bg-gray-100 rounded"></div>
            <div class="flex gap-2 mt-3 mb-2">
              <div class="w-20 h-7 rounded-full bg-gradient-animate opacity-60"></div>
              <div class="w-20 h-7 rounded-full bg-gradient-animate opacity-60"></div>
            </div>
          </div>
        </div>
        <div
          class="rounded-xl bg-gray-50 p-0.5 w-full flex flex-col sm:flex-row gap-0 sm:gap-4 items-stretch shadow-sm"
        >
          <div
            class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0 border-b sm:border-b-0 sm:border-r border-gray-200"
          >
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-10 h-5 bg-orange-100 rounded"></div>
              <div class="w-8 h-3 bg-orange-100 rounded mt-1"></div>
            </div>
          </div>
          <div class="flex flex-row flex-1 items-center justify-around px-4 py-3 gap-0">
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
            <div class="flex flex-col items-center gap-0.5">
              <div class="w-8 h-5 bg-gray-200 rounded"></div>
              <div class="w-6 h-3 bg-gray-100 rounded mt-1"></div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-1">
          <div class="flex-1 h-12 bg-gray-100 rounded-xl"></div>
          <div class="flex-1 h-12 bg-gray-100 rounded-xl"></div>
        </div>
      </section>
      <section class="max-w-lg mx-auto px-4">
        <div class="mb-4 flex gap-2">
          <div class="w-24 h-8 bg-gray-200 rounded"></div>
          <div class="w-20 h-8 bg-orange-100 rounded"></div>
          <div class="w-24 h-8 bg-gray-100 rounded"></div>
        </div>
        <div class="rounded-2xl bg-white shadow p-5 mb-8">
          <div class="flex justify-between items-center mb-3">
            <div class="w-32 h-6 bg-gray-100 rounded"></div>
            <div class="flex items-center gap-2">
              <div class="w-14 h-6 bg-orange-100 rounded"></div>
              <div class="w-14 h-6 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div class="w-full flex items-center justify-center my-5 -ml-2">
            <div class="w-full h-36 bg-gray-100 rounded-xl"></div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-[0.97rem]">
            <div class="w-24 h-5 bg-gray-100 rounded"></div>
            <div class="w-12 h-5 bg-gray-100 rounded justify-self-end"></div>
            <div class="w-24 h-5 bg-gray-100 rounded"></div>
            <div class="w-20 h-5 bg-gray-100 rounded justify-self-end"></div>
            <div class="w-24 h-5 bg-gray-100 rounded"></div>
            <div class="w-16 h-5 bg-orange-100 rounded justify-self-end"></div>
          </div>
        </div>
      </section>
      <section class="max-w-lg mx-auto px-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-24 h-8 bg-gray-200 rounded"></div>
          <div class="w-16 h-8 bg-orange-100 rounded"></div>
        </div>
        <div class="space-y-6">
          <div class="h-20 bg-gray-100 rounded-xl"></div>
          <div class="h-20 bg-gray-100 rounded-xl"></div>
          <div class="h-20 bg-gray-100 rounded-xl"></div>
        </div>
      </section>
    </template>

    <!-- USER 정보: 로딩 후 노출 -->
    <template v-else>
      <section
        class="max-w-lg mx-auto bg-white rounded-2xl shadow-lg mt-10 mb-8 px-6 pt-7 pb-5 flex flex-col gap-5 relative"
      >
        <div class="flex gap-5 items-start mb-0">
          <div class="">
            <img
              :src="user.avatar ? user.avatar : Default"
              alt="avatar"
              class="w-20 h-20 rounded-full object-cover border-2 border-orange-400 shadow"
            />
          </div>
          <div class="flex-1 flex flex-col">
            <div class="flex flex-col items-start gap-2">
              <h2 class="flex gap-2 items-center">
                <span class="mb-[2.7px] text-gray-900 flex flex-col items-start gap-0">
                  <div class="flex gap-3">
                    <div class="text-xl font-bold">
                      {{ user.nickname }}
                    </div>
                    <button
                      v-if="!user.isMe"
                      @click="blockUser"
                      class="flex items-center gap-2 px-2 py-1 rounded-[5px] bg-red-500 text-white text-[0.7rem] hover:bg-red-600 active:bg-red-700"
                    >
                      <i class="fas fa-ban text-base"></i>
                      <span>차단</span>
                    </button>
                  </div>
                  <div class="text-[0.77rem] font-semibold text-gray-600">@{{ user.username }}</div>
                </span>
                <span
                  class="flex items-center gap-1"
                  v-if="user.location != null && user.location.length > 2"
                >
                  <span>·</span
                  ><span class="text-[0.72rem] text-gray-600">{{
                    user.location?.split(' ').slice(-1)[0] || ''
                  }}</span>
                </span>
              </h2>
              <div class="flex gap-1">
                <span
                  class="inline-block bg-orange-100 text-orange-600 text-xs px-2.5 py-0.5 rounded font-bold"
                  >{{ user.age ? user.age + '세' : '연령 미등록' }}</span
                >
                <span
                  class="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-bold"
                  >{{ user.gender ? user.gender : '성별 미등록' }}</span
                >
              </div>
              <div class="text-xs text-gray-600">{{ user.intro }}</div>
            </div>
          </div>
        </div>

        <div
          class="flex items-center justify-between bg-white/90 rounded-xl px-4 py-3 mt-2 mb-[-5px] cursor-pointer hover:bg-orange-50 border border-gray-100 shadow-sm transition"
          @click="showRankingModal = true"
        >
          <div class="flex items-center gap-2">
            <i
              class="fas fa-trophy text-lg"
              :style="`color: ${
                ranking.totalRank == 1
                  ? '#FFB300'
                  : ranking.totalRank >= 2 && ranking.totalRank <= 10
                    ? '#5DB0FF'
                    : ranking.totalRank >= 11 && ranking.totalRank <= 100
                      ? '#23C97A'
                      : '#FF7043'
              }`"
            ></i>
            <span class="font-bold text-gray-800 text-sm">
              전체 랭킹
              <span
                class="font-black"
                :style="`color: ${
                  ranking.totalRank == 1
                    ? '#FFB300'
                    : ranking.totalRank >= 2 && ranking.totalRank <= 10
                      ? '#5DB0FF'
                      : ranking.totalRank >= 11 && ranking.totalRank <= 100
                        ? '#23C97A'
                        : '#FF7043'
                }`"
              >
                {{ ranking.totalRank }}위
              </span>
            </span>
          </div>
          <i class="fas fa-chevron-right text-gray-300 text-base"></i>
        </div>

        <div class="rounded-xl bg-white w-full max-w-xl mx-auto shadow flex flex-col">
          <div class="grid grid-cols-4 border-b border-gray-200">
            <!-- 승 -->
            <div class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <!-- 승 SVG -->
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M39.7916 74.9999L16.0416 51.2499L21.9791 45.3124L39.7916 63.1249L78.0208 24.8958L83.9583 30.8333L39.7916 74.9999Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>

              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{ user.stats.wins }}</span>

              <span class="text-xs text-gray-500 font-semibold mt-1">승</span>
            </div>
            <!-- 무 -->
            <div class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M8.33337 83.3334L50 16.6667L91.6667 83.3334H8.33337ZM23.3334 75.0001H76.6667L50 32.2917L23.3334 75.0001Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>

              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{ user.stats.draws }}</span>

              <span class="text-xs text-gray-500 font-semibold mt-1">무</span>
            </div>
            <!-- 패 -->
            <div class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M26.6667 79.1666L20.8334 73.3333L44.1667 49.9999L20.8334 26.6666L26.6667 20.8333L50 44.1666L73.3334 20.8333L79.1667 26.6666L55.8334 49.9999L79.1667 73.3333L73.3334 79.1666L50 55.8333L26.6667 79.1666Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>
              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{ user.stats.losses }}</span>

              <span class="text-xs text-gray-500 font-semibold mt-1">패</span>
            </div>
            <!-- 플레이 타임 -->
            <div class="flex flex-col items-center justify-between p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M50 45.8333C54.5834 45.8333 58.507 44.2013 61.7709 40.9374C65.0347 37.6735 66.6667 33.7499 66.6667 29.1666V16.6666H33.3334V29.1666C33.3334 33.7499 34.9653 37.6735 38.2292 40.9374C41.4931 44.2013 45.4167 45.8333 50 45.8333ZM16.6667 91.6666V83.3333H25V70.8333C25 66.5971 25.9896 62.6214 27.9688 58.9062C29.9479 55.1909 32.7084 52.2221 36.25 49.9999C32.7084 47.7777 29.9479 44.8089 27.9688 41.0937C25.9896 37.3784 25 33.4027 25 29.1666V16.6666H16.6667V8.33325H83.3334V16.6666H75V29.1666C75 33.4027 74.0104 37.3784 72.0313 41.0937C70.0521 44.8089 67.2917 47.7777 63.75 49.9999C67.2917 52.2221 70.0521 55.1909 72.0313 58.9062C74.0104 62.6214 75 66.5971 75 70.8333V83.3333H83.3334V91.6666H16.6667Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>
              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{ formattedPlayTime }}</span>

              <span class="text-[0.57rem] text-gray-500 font-semibold mt-1">플레이 시간</span>
            </div>
          </div>
          <div class="grid grid-cols-4 flex items-end">
            <!-- 퍼포먼스 -->
            <div class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M43.5417 64.5834C45.2084 66.2501 47.3612 67.0661 50 67.0313C52.6389 66.9966 54.5834 66.0417 55.8334 64.1667L79.1667 29.1667L44.1667 52.5001C42.2917 53.7501 41.3021 55.6598 41.198 58.2292C41.0938 60.7987 41.875 62.9167 43.5417 64.5834ZM50 16.6667C54.0973 16.6667 58.0382 17.2397 61.823 18.3855C65.6077 19.5313 69.1667 21.2501 72.5 23.5417L64.5834 28.5417C62.2917 27.3612 59.9132 26.4758 57.448 25.8855C54.9827 25.2952 52.5 25.0001 50 25.0001C40.7639 25.0001 32.8993 28.2466 26.4063 34.7397C19.9132 41.2327 16.6667 49.0973 16.6667 58.3334C16.6667 61.2501 17.066 64.132 17.8646 66.9792C18.6632 69.8265 19.7917 72.5001 21.25 75.0001H78.75C80.3473 72.3612 81.5105 69.6181 82.2396 66.7709C82.9688 63.9237 83.3334 60.9723 83.3334 57.9167C83.3334 55.4167 83.0382 52.9862 82.448 50.6251C81.8577 48.264 80.9723 45.9723 79.7917 43.7501L84.7917 35.8334C86.875 39.0973 88.5244 42.5695 89.7396 46.2501C90.9549 49.9306 91.5973 53.7501 91.6667 57.7084C91.7362 61.6667 91.2848 65.4515 90.3125 69.0626C89.3403 72.6737 87.9167 76.1112 86.0417 79.3751C85.2778 80.6251 84.2362 81.5973 82.9167 82.2917C81.5973 82.9862 80.2084 83.3334 78.75 83.3334H21.25C19.7917 83.3334 18.4028 82.9862 17.0834 82.2917C15.7639 81.5973 14.7223 80.6251 13.9584 79.3751C12.1528 76.2501 10.7639 72.9341 9.79171 69.4272C8.81949 65.9202 8.33337 62.2223 8.33337 58.3334C8.33337 52.5695 9.42712 47.1702 11.6146 42.1355C13.8021 37.1008 16.7882 32.6911 20.573 28.9063C24.3577 25.1216 28.7848 22.1355 33.8542 19.948C38.9237 17.7605 44.3056 16.6667 50 16.6667Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>
              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{
                user.stats.performance == null ? 0.0 : user.stats.performance.toFixed(1)
              }}</span>

              <span class="text-xs text-gray-500 font-semibold mt-1">퍼포먼스</span>
            </div>
            <!-- 매너 -->
            <div class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M50 87.5001L43.9584 82.0834C36.9445 75.764 31.1459 70.3126 26.5625 65.7293C21.9792 61.1459 18.3334 57.0313 15.625 53.3855C12.9167 49.7397 11.0243 46.389 9.94796 43.3334C8.87157 40.2779 8.33337 37.1529 8.33337 33.9584C8.33337 27.4306 10.5209 21.9792 14.8959 17.6042C19.2709 13.2292 24.7223 11.0417 31.25 11.0417C34.8612 11.0417 38.2987 11.8056 41.5625 13.3334C44.8264 14.8612 47.6389 17.014 50 19.7917C52.3612 17.014 55.1737 14.8612 58.4375 13.3334C61.7014 11.8056 65.1389 11.0417 68.75 11.0417C75.2778 11.0417 80.7292 13.2292 85.1042 17.6042C89.4792 21.9792 91.6667 27.4306 91.6667 33.9584C91.6667 37.1529 91.1285 40.2779 90.0521 43.3334C88.9757 46.389 87.0834 49.7397 84.375 53.3855C81.6667 57.0313 78.0209 61.1459 73.4375 65.7293C68.8542 70.3126 63.0556 75.764 56.0417 82.0834L50 87.5001ZM50 76.2501C56.6667 70.2779 62.1528 65.1563 66.4584 60.8855C70.7639 56.6147 74.1667 52.8994 76.6667 49.7397C79.1667 46.5799 80.9028 43.7674 81.875 41.3022C82.8473 38.8369 83.3334 36.389 83.3334 33.9584C83.3334 29.7917 81.9445 26.3195 79.1667 23.5417C76.3889 20.764 72.9167 19.3751 68.75 19.3751C65.4862 19.3751 62.4653 20.2952 59.6875 22.1355C56.9098 23.9758 55 26.3195 53.9584 29.1667H46.0417C45 26.3195 43.0903 23.9758 40.3125 22.1355C37.5348 20.2952 34.5139 19.3751 31.25 19.3751C27.0834 19.3751 23.6112 20.764 20.8334 23.5417C18.0556 26.3195 16.6667 29.7917 16.6667 33.9584C16.6667 36.389 17.1528 38.8369 18.125 41.3022C19.0973 43.7674 20.8334 46.5799 23.3334 49.7397C25.8334 52.8994 29.2362 56.6147 33.5417 60.8855C37.8473 65.1563 43.3334 70.2779 50 76.2501Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>
              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">{{
                user.mannerScore.toFixed(1)
              }}</span>

              <span class="text-xs text-gray-500 font-semibold mt-1">매너</span>
            </div>
            <!-- 친구 -->
            <div @click="openFriendModal" class="flex flex-col items-center justify-center p-4">
              <span class="my-1">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path
                    d="M4.16663 83.3334V71.6667C4.16663 69.3056 4.77426 67.1355 5.98954 65.1563C7.20482 63.1772 8.8194 61.6667 10.8333 60.6251C15.1388 58.4723 19.5138 56.8577 23.9583 55.7813C28.4027 54.7049 32.9166 54.1667 37.5 54.1667C42.0833 54.1667 46.5972 54.7049 51.0416 55.7813C55.4861 56.8577 59.8611 58.4723 64.1666 60.6251C66.1805 61.6667 67.7951 63.1772 69.0104 65.1563C70.2257 67.1355 70.8333 69.3056 70.8333 71.6667V83.3334H4.16663ZM79.1666 83.3334V70.8334C79.1666 67.7779 78.3159 64.8438 76.6145 62.0313C74.9132 59.2188 72.5 56.8056 69.375 54.7917C72.9166 55.2084 76.25 55.9202 79.375 56.9272C82.5 57.9341 85.4166 59.1667 88.125 60.6251C90.625 62.014 92.5347 63.5591 93.8541 65.2605C95.1736 66.9619 95.8333 68.8195 95.8333 70.8334V83.3334H79.1666ZM37.5 50.0001C32.9166 50.0001 28.993 48.3681 25.7291 45.1042C22.4652 41.8404 20.8333 37.9167 20.8333 33.3334C20.8333 28.7501 22.4652 24.8265 25.7291 21.5626C28.993 18.2987 32.9166 16.6667 37.5 16.6667C42.0833 16.6667 46.0069 18.2987 49.2708 21.5626C52.5347 24.8265 54.1666 28.7501 54.1666 33.3334C54.1666 37.9167 52.5347 41.8404 49.2708 45.1042C46.0069 48.3681 42.0833 50.0001 37.5 50.0001ZM79.1666 33.3334C79.1666 37.9167 77.5347 41.8404 74.2708 45.1042C71.0069 48.3681 67.0833 50.0001 62.5 50.0001C61.7361 50.0001 60.7638 49.9133 59.5833 49.7397C58.4027 49.5661 57.4305 49.3751 56.6666 49.1667C58.5416 46.9445 59.9826 44.4792 60.9895 41.7709C61.9965 39.0626 62.5 36.2501 62.5 33.3334C62.5 30.4167 61.9965 27.6042 60.9895 24.8959C59.9826 22.1876 58.5416 19.7223 56.6666 17.5001C57.6388 17.1529 58.6111 16.9272 59.5833 16.823C60.5555 16.7188 61.5277 16.6667 62.5 16.6667C67.0833 16.6667 71.0069 18.2987 74.2708 21.5626C77.5347 24.8265 79.1666 28.7501 79.1666 33.3334ZM12.5 75.0001H62.5V71.6667C62.5 70.9029 62.309 70.2084 61.927 69.5834C61.5451 68.9584 61.0416 68.4723 60.4166 68.1251C56.6666 66.2501 52.8819 64.8438 49.0625 63.9063C45.243 62.9688 41.3888 62.5001 37.5 62.5001C33.6111 62.5001 29.7569 62.9688 25.9375 63.9063C22.118 64.8438 18.3333 66.2501 14.5833 68.1251C13.9583 68.4723 13.4548 68.9584 13.0729 69.5834C12.6909 70.2084 12.5 70.9029 12.5 71.6667V75.0001ZM37.5 41.6667C39.7916 41.6667 41.7534 40.8508 43.3854 39.2188C45.0173 37.5869 45.8333 35.6251 45.8333 33.3334C45.8333 31.0417 45.0173 29.0799 43.3854 27.448C41.7534 25.8161 39.7916 25.0001 37.5 25.0001C35.2083 25.0001 33.2465 25.8161 31.6145 27.448C29.9826 29.0799 29.1666 31.0417 29.1666 33.3334C29.1666 35.6251 29.9826 37.5869 31.6145 39.2188C33.2465 40.8508 35.2083 41.6667 37.5 41.6667Z"
                    fill="#4d4d4d"
                  />
                </svg>
              </span>
              <span class="text-[1.25rem] font-[800] text-[#4d4d4d]">
                {{ user.stats.friends }}</span
              >

              <span class="text-xs text-gray-500 font-semibold mt-1">친구</span>
            </div>
            <!-- 챔피언 -->
            <div
              class="flex flex-col items-center justify-center p-4 relative"
              @click="toggleChampion"
            >
              <span class="text-[1.25rem] font-[800] text-gray-600 relative">
                <svg class="" width="70" height="66" viewBox="0 0 150 135">
                  <path
                    d="M22.5 135V120H127.5V135H22.5ZM22.5 108.75L12.9375 48.5625C12.6875 48.5625 12.4062 48.5938 12.0938 48.6562C11.7812 48.7188 11.5 48.75 11.25 48.75C8.125 48.75 5.46875 47.6562 3.28125 45.4688C1.09375 43.2812 0 40.625 0 37.5C0 34.375 1.09375 31.7188 3.28125 29.5312C5.46875 27.3438 8.125 26.25 11.25 26.25C14.375 26.25 17.0312 27.3438 19.2188 29.5312C21.4062 31.7188 22.5 34.375 22.5 37.5C22.5 38.375 22.4062 39.1875 22.2188 39.9375C22.0312 40.6875 21.8125 41.375 21.5625 42L45 52.5L68.4375 20.4375C67.0625 19.4375 65.9375 18.125 65.0625 16.5C64.1875 14.875 63.75 13.125 63.75 11.25C63.75 8.125 64.8438 5.46875 67.0312 3.28125C69.2188 1.09375 71.875 0 75 0C78.125 0 80.7812 1.09375 82.9688 3.28125C85.1562 5.46875 86.25 8.125 86.25 11.25C86.25 13.125 85.8125 14.875 84.9375 16.5C84.0625 18.125 82.9375 19.4375 81.5625 20.4375L105 52.5L128.438 42C128.188 41.375 127.969 40.6875 127.781 39.9375C127.594 39.1875 127.5 38.375 127.5 37.5C127.5 34.375 128.594 31.7188 130.781 29.5312C132.969 27.3438 135.625 26.25 138.75 26.25C141.875 26.25 144.531 27.3438 146.719 29.5312C148.906 31.7188 150 34.375 150 37.5C150 40.625 148.906 43.2812 146.719 45.4688C144.531 47.6562 141.875 48.75 138.75 48.75C138.5 48.75 138.219 48.7188 137.906 48.6562C137.594 48.5938 137.312 48.5625 137.062 48.5625L127.5 108.75H22.5ZM35.25 93.75H114.75L119.625 62.4375L99.9375 71.0625L75 36.75L50.0625 71.0625L30.375 62.4375L35.25 93.75Z"
                    :fill="user.myChampions.length > 0 ? '#F5C542' : '#5b5b5b'"
                  />
                </svg>
                <span
                  class="absolute left-1/2 top-[55%] transform -translate-x-1/2 -translate-y-1/2 text-[0.9rem] font-bold drop-shadow"
                  :style="user.myChampions.length > 0 ? 'color : #F5C542' : '#color : 4d4d4d'"
                  >{{ user.myChampions.length }}</span
                >
              </span>
              <span class="text-xs text-gray-500 font-semibold mt-2">챔피언</span>
            </div>
          </div>
        </div>
        <transition name="champ-slide">
          <div v-if="showChampions" class="champ-card-container w-full max-w-md mx-auto mt-0">
            <div class="champ-card bg-white rounded-2xl shadow-xl px-6 py-6 border border-gray-100">
              <div class="flex items-center mb-4">
                <i class="fas fa-crown text-yellow-400 text-lg mr-2"></i>
                <span class="font-bold text-gray-900 text-base">
                  {{ user.nickname }}님이 획득한 챔피언
                </span>
              </div>
              <div class="flex flex-col flex-wrap gap-2">
                <span
                  v-for="(champ, idx) in user.myChampions"
                  :key="idx"
                  class="p-5 relative flex items-center rounded-[25px] shadow-md px-6 py-3 space-x-1 overflow-hidden bg-gradient-animate animate-pulse-slow"
                  title="챔피언"
                >
                  <i class="fas fa-crown text-white text-sm z-10"></i>
                  <span class="text-md font-semibold text-white z-10 truncate">
                    {{ champ.region?.split(' ').slice(-1)[0] }} {{ champ.ruleTitle }} 챔피언
                  </span>
                </span>
              </div>
            </div>
          </div>
        </transition>

        <div v-if="!user.isMe" class="flex gap-3 mt-1 pb-3">
          <button
            v-if="!friendStatus.isFriend && !friendStatus.sent && !friendStatus.received"
            class="flex justify-center items-center bg-orange-500 hover:bg-orange-400 border-[0.1px] border-orange-500 text-white font-bold py-3 w-full rounded-xl shadow transition"
            @click="sendFriendRequest"
          >
            <i class="fas fa-user-plus mr-2"></i> 친구추가
          </button>
          <button
            v-else-if="friendStatus.sent && !friendStatus.isFriend"
            class="flex justify-center items-center bg-white border-[0.1px] border-orange-400 text-orange-500 font-bold py-3 w-full rounded-xl shadow transition"
            @click="sendFriendCancelRequest"
          >
            <i class="fas fa-hourglass-half mr-2"></i> 요청취소
          </button>
          <div
            v-else-if="friendStatus.received && !friendStatus.isFriend"
            class="flex flex-col gap-2 w-full"
          >
            <div class="flex gap-3 mb-2">
              <button
                class="flex-1 flex justify-center items-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl shadow transition"
                @click="acceptFriendRequest"
              >
                <i class="fas fa-user-check mr-2"></i> 승인
              </button>
              <button
                class="flex-1 flex justify-center items-center bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl shadow transition border border-gray-300"
                @click="rejectFriendRequest"
              >
                <i class="fas fa-user-times mr-2"></i> 거부
              </button>
            </div>
            <div>
              <button
                @click="goChat"
                class="flex w-[100%] justify-center items-center bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl w-[50%] shadow transition"
              >
                <i class="fas fa-paper-plane mr-2"></i> DM
              </button>
            </div>
          </div>
          <button
            v-else-if="friendStatus.isFriend"
            class="flex justify-center items-center bg-white border-green-700 border-[0.1px] text-green-700 font-[500] py-3 w-full rounded-xl shadow transition cursor-default"
            disabled
          >
            <i class="fas fa-check mr-2"></i> 나의 친구
          </button>
          <button
            v-if="!(friendStatus.received && !friendStatus.isFriend)"
            @click="goChat"
            class="flex justify-center items-center bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl w-[50%] shadow transition"
          >
            <i class="fas fa-paper-plane mr-2"></i> DM
          </button>
        </div>
      </section>
      <section class="max-w-lg mx-auto px-4 bg-[#f8f9fa] pb-0">
        <div v-if="false" class="flex items-center gap-2 mb-4 mt-2"></div>
        <div v-if="statMode === 'rule'" class="pb-4">
          <button
            @click="showRuleModal = true"
            class="w-full py-3 rounded-xl bg-orange-100 text-orange-600 text-sm font-bold shadow flex items-center justify-center gap-2"
          >
            <i class="fas fa-list-alt"></i>
            {{ selectedRule?.ruleTitle || '경기 규칙 선택' }}
          </button>
        </div>
        <div v-if="statMode === 'category'" class="mb-4 flex gap-2">
          <CustomSelect
            :options="Object.keys(playedCategoryMap).map((cat) => ({ label: cat, value: cat }))"
            v-model="selectedMainCategory"
            placeholder="주 카테고리"
          />
          <CustomSelect
            :options="subCategoryOptions"
            v-model="selectedSubCategory"
            :disabled="!selectedMainCategory"
            placeholder="서브 카테고리"
          />
        </div>
        <div class="mb-3 text-xs text-gray-500 px-2">
          <template v-if="statMode === 'total' && false">
            전체 기준 (플레이한 유저: <b>{{ user.totalPlayers }}</b
            >명)
          </template>
          <!-- <template v-if="statMode === 'rule' && selectedRule">
            [{{ selectedRule.title }}] {{ selectedRule.description }}<br />
            카테고리: {{ selectedRule.majorCategory }} > {{ selectedRule.minorCategory }}
            <span class="block mt-1 text-gray-400"
              >플레이 유저: <b>{{ selectedRule.players }}</b
              >명</span
            >
          </template> -->
          <template v-if="statMode === 'category' && selectedMainCategory && selectedSubCategory">
            [{{ selectedMainCategory }} > {{ selectedSubCategory }}] 기준<br />
            플레이 유저: <b>{{ filteredCategoryPlayers }}</b
            >명
          </template>
        </div>
        <!-- <div class="rounded-2xl bg-white shadow p-5 mb-0">
          <div class="flex justify-between items-center mb-3">
            <span class="font-bold text-gray-900 text-base flex items-center gap-2">
              <i class="fas fa-chart-line text-orange-500"></i> 퍼포먼스 그래프
            </span>
            <div class="flex items-center gap-2">
              <span
                class="px-3 py-1 rounded-full bg-orange-500 text-white font-black text-xs shadow"
                >랭킹 -위</span
              >
              <span
                class="px-2 py-1 rounded-full bg-white text-orange-500 text-xs font-semibold border border-orange-400"
                >상위 -%</span
              >
            </div>
          </div>
          <div class="w-full flex items-center justify-center my-5 -ml-2">
            <canvas v-if="chartData.length > 0" ref="chartRef" height="" class=" "></canvas>
            <div v-else class="w-full text-center text-gray-400 text-sm py-8">
              경기 횟수가 부족하여<br />
              퍼포먼스 그래프를 표시할 수 없습니다.
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-y-2 gap-x-6 text-[0.97rem]">
            <div class="font-semibold text-gray-500">퍼포먼스 평균</div>
            <div class="text-right font-bold text-gray-900">{{ stat.performance.toFixed(1) }}</div>
            <div class="font-semibold text-gray-500">승/무/패</div>
            <div class="text-right text-gray-600">
              {{ stat.wins }}승 {{ stat.draws }}무 {{ stat.losses }}패
            </div>
            <div class="font-semibold text-gray-500">승률</div>
            <div class="text-right text-orange-500 font-bold">{{ stat.winRate }}%</div>
          </div>
        </div> -->
      </section>
      <section class="w-full mx-auto px-4 pb-24 bg-[#f8f9fa]">
        <div class="flex items-center gap-2 mb-4">
          <h3 class="text-xl font-bold text-gray-900">플레이한 경기</h3>
          <span
            v-if="statMode === 'total'"
            class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold"
            >전체 경기</span
          >
          <span
            v-if="statMode === 'rule' && selectedRule"
            class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold"
            >{{ selectedRule.ruleTitle }}</span
          >
          <span
            v-if="statMode === 'category' && selectedMainCategory && selectedSubCategory"
            class="text-sm text-orange-600 bg-orange-100 rounded px-2 py-1 font-bold"
            >{{ selectedMainCategory }} > {{ selectedSubCategory }}</span
          >
        </div>
        <div v-if="filteredGames.length" class="space-y-6">
          <div
            v-for="game in filteredGames"
            :key="game.id"
            :ref="(el) => setMatchRef(el, game.id)"
            :id="'match-' + game.id"
          >
            <MatchCard
              :game="game"
              :isWin="game.result === 'win'"
              :isDraw="game.result === 'draw'"
            />
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-6 text-sm">표시할 경기가 없습니다.</div>
      </section>

      <!-- 모달/토스트/풋터 등 나머지 코드는 기존 그대로(생략) -->
      <transition name="fade">
        <div
          v-if="showRuleModal"
          class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-end z-50"
        >
          <div class="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6">
            <div class="mb-2 flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900">경기 규칙 선택</h3>
              <button
                @click="showRuleModal = false"
                class="text-gray-400 hover:text-orange-500 text-xl"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <input
              v-model="ruleSearch"
              class="w-full border rounded-full px-4 py-2 mb-3 text-sm focus:ring-2 focus:ring-orange-200"
              placeholder="규칙 제목 검색"
            />
            <div
              v-if="filteredRules.length > 0"
              class="max-h-80 overflow-y-auto flex flex-col gap-2"
            >
              <button
                v-for="rule in filteredRules"
                :key="rule.id"
                class="flex flex-col items-start gap-1 p-3 bg-gray-100 hover:bg-orange-50 rounded-xl text-sm font-bold text-gray-800 transition"
                :class="{ 'bg-orange-200 text-orange-700': selectedRuleId === rule.id }"
                @click="selectRule(rule.id)"
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold text-base">{{ rule.ruleTitle }}</span>
                  <span class="text-xs px-2 py-0.5 bg-gray-200 rounded"
                    >{{ rule.majorCategory }} > {{ rule.minorCategory }}</span
                  >
                </div>
                <div class="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                  {{ rule.ruleDescription }}
                </div>
              </button>
            </div>
            <div v-else>플레이한 게임이 없습니다.</div>
          </div>
        </div>
      </transition>
      <transition name="fade">
        <div
          v-if="showUserModal"
          class="fixed inset-0 top-0 h-full bg-black bg-opacity-30 z-50 flex justify-center items-center"
        >
          <div
            class="bg-white w-dvw w-full h-full p-6 pt-10 relative"
            style="min-height: calc(var(--real-vh, 1vh) * 100)"
          >
            <button
              class="absolute top-10 right-7 text-gray-400 hover:text-orange-500 text-xl"
              @click="closeUserModal"
            >
              <i class="fas fa-times"></i>
            </button>
            <h3 class="font-bold text-lg mb-4 text-gray-800">유저 찾기</h3>
            <input
              v-model="userSearch"
              @input="onUserSearch"
              ref="userinput"
              type="text"
              class="w-full border rounded-[10px] px-4 py-3 mb-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
              placeholder="유저의 이름을 입력하세요"
            />
            <div v-if="userSearching" class="text-center text-gray-400 py-4 text-sm">
              검색 중...
            </div>
            <div
              v-else-if="userSearchResult.length === 0 && userSearch.trim() !== ''"
              class="text-center text-gray-400 py-10 text-base"
            >
              검색 결과가 없습니다.
            </div>
            <div v-else class="flex flex-col gap-2 overflow-y-auto">
              <button
                v-for="user in userSearchResult"
                :key="user.id"
                @click="gotoUser(user.id)"
                class="flex items-center gap-3 p-2 hover:bg-orange-50 rounded-xl transition border border-transparent hover:border-orange-200"
              >
                <img
                  :src="user.avatar ? user.avatar : Default"
                  class="w-10 h-10 rounded-full border object-cover"
                />
                <div class="flex-1 text-left">
                  <div class="flex flex-col gap-0">
                    <div class="font-bold text-gray-800 text-sm">
                      {{ user.nickname }}
                    </div>
                    <div class="text-[0.8rem]">@{{ user.username }}</div>
                  </div>
                  <div class="text-xs text-gray-500">{{ user.intro }}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </transition>
      <transition name="fade h-full">
        <div
          v-if="showFriendModal"
          class="h-full fixed inset-0 z-50 bg-black/40 flex justify-center items-end sm:items-center"
        >
          <div
            class="bg-white h-[60%] rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto pb-4 pt-4 px-4 relative shadow-2xl"
            style="padding: 2rem 1.2rem 2.2rem 1.2rem; overflow-y: auto"
          >
            <button
              class="absolute right-5 top-4 text-xl text-gray-400 hover:text-orange-500"
              @click="closeFriendModal"
            >
              <i class="fas fa-times"></i>
            </button>
            <div class="flex gap-2 mb-5 mt-2">
              <button
                :class="
                  friendTab === 'friends'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'friends'"
              >
                친구
              </button>
              <button
                v-if="user?.isMe"
                :class="
                  friendTab === 'sent'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'sent'"
              >
                요청됨
              </button>
              <button
                v-if="user?.isMe"
                :class="
                  friendTab === 'received'
                    ? 'font-bold border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500'
                "
                class="flex-1 py-2 text-base transition"
                @click="friendTab = 'received'"
              >
                요청받음
              </button>
            </div>
            <div v-if="friendTab === 'friends'">
              <div v-if="friends.length" class="flex flex-col gap-3 overflow-y-auto">
                <button
                  v-for="f in friends"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl border border-transparent hover:border-orange-200 transition"
                  @click="gotoUser(f.id)"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-800 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ f.intro }}</div>
                  </div>
                </button>
              </div>
              <div v-else class="text-gray-400 text-center py-8">친구가 없습니다.</div>
            </div>
            <div v-if="friendTab === 'sent' && user?.isMe">
              <div v-if="friendRequestsSent.length" class="flex flex-col gap-3 overflow-y-auto">
                <button
                  v-for="f in friendRequestsSent"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl border border-transparent hover:border-orange-200 transition"
                  @click="gotoUser(f.id)"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-800 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ f.intro }}</div>
                  </div>
                </button>
              </div>
              <div v-else class="text-gray-400 text-center py-8">요청한 친구가 없습니다.</div>
            </div>
            <div v-if="friendTab === 'received' && user?.isMe">
              <div v-if="friendRequestsReceived.length" class="flex flex-col gap-3 overflow-y-auto">
                <div
                  v-for="f in friendRequestsReceived"
                  :key="f.id"
                  class="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-xl border border-transparent hover:border-orange-200 transition"
                >
                  <img
                    :src="f.avatar || Default"
                    class="w-10 h-10 rounded-full object-cover border"
                  />
                  <div @click="gotoUser(f.id)" class="flex-1 text-left min-w-0">
                    <div class="font-bold text-gray-800 text-sm truncate">{{ f.nickname }}</div>
                    <div class="text-[0.8rem] truncate">@{{ f.username }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ f.intro }}</div>
                  </div>
                  <div class="flex gap-1 ml-2">
                    <button
                      class="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow"
                      @click="onAcceptRequest(f.id)"
                    >
                      승인
                    </button>
                    <button
                      class="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold shadow border border-gray-300"
                      @click="onRejectRequest(f.id)"
                    >
                      거부
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="text-gray-400 text-center py-8">받은 친구 요청이 없습니다.</div>
            </div>
          </div>
        </div>
      </transition>
    </template>
    <!-- 커스텀 confirm 모달 -->
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h2 class="text-lg font-semibold mb-4">유저 차단</h2>
        <p class="mb-6">정말로 이 사용자를 차단하시겠어요?</p>
        <div class="flex justify-end gap-3">
          <button @click="cancel" class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
            취소
          </button>
          <button
            @click="confirmBlock"
            class="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
          >
            차단
          </button>
        </div>
      </div>
    </div>
    <transition name="fade">
      <div
        v-if="showRankingModal"
        class="fixed inset-0 bg-black/30 flex justify-center items-center z-50"
        @click.self="showRankingModal = false"
      >
        <div
          class="bg-white rounded-2xl p-7 shadow-2xl max-w-xs w-full relative overflow-visible animate-modalpop"
        >
          <!-- 닫기 -->
          <button
            @click="showRankingModal = false"
            class="absolute right-6 top-6 text-gray-400 hover:text-orange-500 text-xl z-10"
          >
            <i class="fas fa-times"></i>
          </button>
          <!-- 타이틀 -->
          <div class="flex flex-col gap-2 items-center mb-5 mt-1">
            <div class="relative">
              <i
                class="fas fa-trophy text-3xl animate-shine"
                :style="`color: ${
                  rankingValue === 1
                    ? '#FFB300'
                    : rankingValue >= 2 && rankingValue <= 3
                      ? '#5DB0FF'
                      : rankingValue <= 10
                        ? '#23C97A'
                        : '#FF7043'
                }`"
              ></i>
              <span v-if="rankingValue <= 3" class="shine"></span>
            </div>
            <span class="text-base font-bold text-gray-800 text-center"
              >{{ user.nickname }}님의 랭킹</span
            >
            <div class="text-xs text-gray-500 -mt-1">카테고리별 랭킹을 확인해보세요</div>
          </div>
          <!-- 카테고리 Chips -->
          <div class="flex flex-wrap gap-2 justify-center mb-3">
            <button
              v-for="cat in minorCategories"
              :key="cat"
              @click="selectMinorCategory(cat)"
              :class="[
                'px-3 py-1.5 rounded-full border font-bold text-xs transition shadow-sm active:scale-95 duration-100',
                selectedMinorCategory === cat
                  ? 'bg-orange-100 border-orange-400 text-orange-600 animate-bounce-fast'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-orange-50',
              ]"
              style="transition: transform 0.15s cubic-bezier(0.42, 2, 0.58, 0.7)"
            >
              {{ cat }}
            </button>
          </div>
          <!-- 랭킹 결과/애니메이션 -->
          <div class="flex flex-col gap-2 items-center mt-2 min-h-[64px]">
            <template v-if="ranking">
              <span
                class="text-3xl font-extrabold tracking-tight py-1"
                :style="`color: ${
                  rankingValue === 1
                    ? '#FFB300'
                    : rankingValue >= 2 && rankingValue <= 3
                      ? '#5DB0FF'
                      : rankingValue <= 10
                        ? '#23C97A'
                        : '#FF7043'
                }`"
              >
                <CountUp
                  :endVal="rankingValue"
                  :duration="3"
                  :options="{ separator: ',', decimal: '.', prefix: '', suffix: '위' }"
                />
              </span>
              <span
                class="px-3 py-1 rounded-full font-semibold text-xs mt-1 shadow-sm bg-gradient-to-r from-orange-200 to-yellow-100 text-orange-700 animate-pop"
              >
                상위 {{ rankingPercent }}%
              </span>
            </template>
            <div v-else class="text-center text-gray-400 py-4 text-sm">
              랭킹 정보를 불러오는 중...
            </div>
          </div>
        </div>
      </div>
    </transition>

    <CustomToast />
  </div>
  <Footer tab="profile" />
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Chart from 'chart.js/auto'
import Footer from '../../components/FooterNav.vue'
import CustomSelect from './CustomSelect.vue'
import MatchCard from './MatchCard.vue'
import Default from '../../assets/default.png'
import api from '../../api/api'
import CustomToast from '../../components/CustomToast.vue'
import CountUp from './CountUp.vue'
import { useToast } from '../../composable/useToast'
const { showToast } = useToast()

const showFriendModal = ref(false)
const friendTab = ref('friends') // friends | sent | received
const friends = ref([])
const friendRequestsSent = ref([])
const friendRequestsReceived = ref([])

const chartRef = ref(null)
let chartInstance = null
const router = useRouter()
const route = useRoute()
let userId = route.params.id

const matchRefs = ref({})

function setMatchRef(el, id) {
  if (el) matchRefs.value[id] = el
}

const user = ref(null)
const allGames = ref([])

// [카테고리, [서브카테고리, ...]] 목록 (플레이한 것만)
const playedCategoryMap = ref({}) // { "신체": ["축구", "농구"], "보드": ["체스"] }
const playedRules = ref([]) // 전체 플레이한 룰 배열

// const statTabs = [
//   { id: 'total', label: '전체' },
//   // { id: 'rule', label: '경기 규칙별' },
//   // { id: 'category', label: '카테고리별' },
// ]
const statMode = ref('total')
const showRuleModal = ref(false)
const ruleSearch = ref('')
const selectedRuleId = ref(null)
const selectedMainCategory = ref(null)
const selectedSubCategory = ref(null)

const subCategoryOptions = computed(() =>
  selectedMainCategory.value && playedCategoryMap.value[selectedMainCategory.value]
    ? playedCategoryMap.value[selectedMainCategory.value].map((sub) => ({ label: sub, value: sub }))
    : [],
)

const showChampions = ref(false)
function toggleChampion() {
  if (user.value.myChampions.length == 0) return
  showChampions.value = !showChampions.value
}

const selectedRule = computed(() => playedRules.value.find((r) => r.id === selectedRuleId.value))

const goChat = () => {
  router.push('/chat/' + userId)
}

const sent = ref(false)

async function onAcceptRequest(friendId) {
  try {
    await api.post(`/api/friends/accept/${friendId}`)
    showToast('친구 요청을 승인했습니다!')
    // 바로 리스트 갱신
    loadFriends()
    fetchFriendStatus()
  } catch (e) {
    showToast('승인에 실패했습니다.')
  }
}
async function onRejectRequest(friendId) {
  try {
    await api.post(`/api/friends/reject/${friendId}`)
    showToast('친구 요청을 거부했습니다.')
    loadFriends()
    fetchFriendStatus()
  } catch (e) {
    showToast('거부에 실패했습니다.')
  }
}

async function sendFriendRequest() {
  try {
    await api.post(`/api/friends/request/${userId}`)
    sent.value = true
    showToast('친구 요청을 보냈습니다!')
    fetchFriendStatus()
  } catch (e) {
    if (e?.response?.data?.message) showToast(e.response.data.message)
    else showToast('이미 요청했거나 친구 상태입니다.')
  }
}

const showConfirm = ref(false)
function blockUser() {
  showConfirm.value = true
}

function cancel() {
  showConfirm.value = false
}

async function confirmBlock() {
  try {
    await api.post(`/api/block/${user.value.id}`)
    showToast(`${user.value.nickname}님을 차단했습니다.`)

    // 차단 성공 시 라우팅
    router.push('/profile/0')
  } catch (error) {
    console.error('차단 실패', error)
  } finally {
    showConfirm.value = false
  }
}
async function sendFriendCancelRequest() {
  try {
    await api.delete(`/api/friends/cancel/${userId}`)
    sent.value = false
    showToast('친구 요청을 취소했습니다.')
    fetchFriendStatus()
  } catch (e) {
    showToast('요청 취소에 실패했습니다.')
  }
}
async function acceptFriendRequest() {
  await api.post(`/api/friends/accept/${userId}`)
  await fetchFriendStatus()
}
async function rejectFriendRequest() {
  await api.post(`/api/friends/reject/${userId}`)
  await fetchFriendStatus()
}
const friendStatus = ref({ sent: false, isFriend: false, received: false })

async function fetchFriendStatus() {
  const res = await api.get(`/api/friends/status/${userId}`)
  friendStatus.value = res.data
  sent.value = friendStatus.value.sent
}
onMounted(() => {
  fetchFriendStatus()
})

// const stat = computed(() => {
//   if (!user.value) return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   if (statMode.value === 'total') {
//     return {
//       performance: user.value.stats.performance ?? 0,
//       wins: user.value.stats.wins,
//       draws: user.value.stats.draws,
//       losses: user.value.stats.losses,
//       winRate: user.value.stats.winRate,
//     }
//   } else if (statMode.value === 'rule' && selectedRule.value) {
//     return selectedRule.value.stat ?? { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   } else if (
//     statMode.value === 'category' &&
//     selectedMainCategory.value &&
//     selectedSubCategory.value
//   ) {
//     // 카테고리/서브카테고리 통계는 별도 API 필요하면 이곳에서 fetch하여 사용
//     return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
//   }
//   return { performance: 0, wins: 0, draws: 0, losses: 0, winRate: 0 }
// })

const filteredCategoryPlayers = computed(() => {
  if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    // 플레이 유저 수 통계가 있다면 여기에 연결
    return 0
  }
  return user.value?.totalPlayers ?? 0
})

const filteredGames = computed(() => {
  if (statMode.value === 'total') return allGames.value
  if (statMode.value === 'rule' && selectedRule.value) {
    return allGames.value.filter((g) => g.ruleId === selectedRule.value.id)
  }
  if (statMode.value === 'category' && selectedMainCategory.value && selectedSubCategory.value) {
    return allGames.value.filter(
      (g) =>
        g.mainCategory === selectedMainCategory.value &&
        g.subCategory === selectedSubCategory.value,
    )
  }
  return []
})
async function loadFriends() {
  try {
    // 내 친구 목록
    const res = await api.get('/api/friends/my')
    friends.value = res.data
    // 요청 보냄/받음 (본인 프로필인 경우에만)
    if (user.value?.isMe) {
      const res2 = await api.get('/api/friends/my/sent')
      friendRequestsSent.value = res2.data
      const res3 = await api.get('/api/friends/my/received')
      friendRequestsReceived.value = res3.data
    }
  } catch (e) {
    showToast('친구 목록을 불러오지 못했습니다.')
  }
}
function openFriendModal() {
  friendTab.value = 'friends'
  showFriendModal.value = true
  loadFriends()
}
function closeFriendModal() {
  showFriendModal.value = false
}

// function onTabChange(item) {
//   statMode.value = item.id
//   if (item.id === 'rule' && playedRules.value.length && !selectedRule.value) {
//     selectedRuleId.value = playedRules.value[0].id
//   }
//   if (item.id === 'category') {
//     selectedMainCategory.value = Object.keys(playedCategoryMap.value)[0] || null
//     selectedSubCategory.value = playedCategoryMap.value[selectedMainCategory.value]?.[0] || null
//   }
// }

const chartData = computed(() => {
  if (statMode.value === 'total') return user.value?.stats?.performanceHistory ?? []
  if (statMode.value === 'rule' && selectedRule.value)
    return selectedRule.value.performanceHistory ?? []
  if (statMode.value === 'category') return []
  return []
})

const formattedPlayTime = computed(() => {
  const min = user.value?.playTime ?? 0
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  return `${h}h`
})

const filteredRules = computed(() =>
  playedRules.value.filter((r) => r.ruleTitle.includes(ruleSearch.value)),
)

function selectRule(id) {
  selectedRuleId.value = id
  showRuleModal.value = false
}

function goSettings() {
  router.push('/settings')
}

const updateChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  if (chartInstance) chartInstance.destroy()
  if (chartData.value.length < 1) return

  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: chartData.value.map((_, i) => i + 1),
      datasets: [
        {
          label: '퍼포먼스 점수',
          data: chartData.value,
          borderColor: '#fd7e14',
          backgroundColor: 'rgba(253,126,20,0.06)',
          pointRadius: 2,
          pointHoverRadius: 6,
          borderWidth: 3,
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          title: {
            display: true,
            text: '경기 횟수',
            color: '#aaa',
            font: { size: 13, weight: 600 },
          },
          grid: { display: false },
        },
        y: {
          min: 0,
          max: 5,
          ticks: { stepSize: 1, color: '#bbb' },
          title: {
            display: true,
            text: '퍼포먼스(점)',
            color: '#aaa',
            font: { size: 13, weight: 600 },
          },
          grid: { color: '#efefef' },
        },
      },
    },
  })
}

// 유저 검색 모달 및 검색 API
const showUserModal = ref(false)
const userSearch = ref('')
const userSearching = ref(false)
const userSearchResult = ref([])
let searchTimeout

const userinput = ref(null)

function searchUsers() {
  showUserModal.value = true
  userSearch.value = ''
  userSearchResult.value = []
  nextTick(() => {
    userinput.value?.focus()
  })
}
function closeUserModal() {
  showUserModal.value = false
}
async function onUserSearch() {
  clearTimeout(searchTimeout)
  if (!userSearch.value.trim()) {
    userSearchResult.value = []
    return
  }
  userSearching.value = true
  searchTimeout = setTimeout(async () => {
    const res = await api.get(
      `/api/user-profile/search?keyword=${encodeURIComponent(userSearch.value)}`,
    )
    userSearchResult.value = res.data
    userSearching.value = false
  }, 350)
}
function gotoUser(userId) {
  closeUserModal()
  router.push(`/profile/${userId}`)
}

// 데이터 로딩 및 예외처리
onMounted(async () => {
  try {
    const res1 = await api.get(`/api/user-profile/${userId}`)
    user.value = res1.data

    // 카테고리/서브카테고리 맵 구성
    const categoryMap = {}
    for (const rule of res1.data.playedRules) {
      if (!categoryMap[rule.majorCategory]) categoryMap[rule.majorCategory] = []
      if (!categoryMap[rule.majorCategory].includes(rule.minorCategory))
        categoryMap[rule.majorCategory].push(rule.minorCategory)
    }
    playedCategoryMap.value = categoryMap
    playedRules.value = res1.data.playedRules

    // 필터 기본값
    if (Object.keys(categoryMap).length) {
      selectedMainCategory.value = Object.keys(categoryMap)[0]
      selectedSubCategory.value = categoryMap[selectedMainCategory.value][0]
    }
    if (playedRules.value.length) selectedRuleId.value = playedRules.value[0].id

    const res2 = await api.get(`/api/user-profile/${userId}/games`)
    allGames.value = res2.data

    await nextTick()

    const matchId = Number(route.query.id)

    console.log('matchRefs:', matchRefs.value)
    console.log('matchId:', matchId)

    const el = matchRefs.value[matchId]
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })

      console.log('hello')
    }

    updateChart()
  } catch (e) {
    showToast(e.response.data.message)
    console.log(e)
    router.back()
  }
})
const minorCategories = ref([])
const selectedMinorCategory = ref('')
const ranking = ref({})
const loadingRanking = ref(false)
const showRankingModal = ref(false)
const rankingValue = ref(null)
const rankingPercent = ref(null)

onMounted(async () => {
  // 1. 마운트될 때 최다플레이 마이너카테고리 fetch
  const res = await api.get(`/api/rules/top-played-categories/${userId}`)
  minorCategories.value = res.data || []
  minorCategories.value.unshift('전체')

  // 2. 첫 번째 카테고리로 자동 선택
  selectedMinorCategory.value = minorCategories.value[0] || ''
  // 3. 바로 해당 카테고리로 랭킹 조회
  if (selectedMinorCategory.value) fetchRankingAll()
})

async function fetchRanking(minorCategory) {
  loadingRanking.value = true
  try {
    const res = await api.get(`/api/rankings?userId=${userId}&minorCategory=${minorCategory}`)
    console.log(minorCategory)
    ranking.value = res.data
  } finally {
    loadingRanking.value = false
    rankingValue.value = ranking.value.minorCategoryRank
    rankingPercent.value = ranking.value.minorCategoryPercent
  }
}

async function fetchRankingAll() {
  loadingRanking.value = true
  try {
    const res = await api.get(`/api/rankings?userId=${userId}`)
    ranking.value = res.data
  } finally {
    loadingRanking.value = false
    rankingValue.value = ranking.value.totalRank
    rankingPercent.value = ranking.value.totalPercent
  }
}

async function selectMinorCategory(cat) {
  selectedMinorCategory.value = cat

  if (cat === '전체') {
    await fetchRankingAll()
  } else {
    await fetchRanking(cat)
  }
}

watch([statMode, selectedRuleId, selectedMainCategory, selectedSubCategory], updateChart, {
  deep: true,
})
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
body {
  background: #f8f9fa !important;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
::-webkit-scrollbar {
  display: none;
}
@keyframes gradientShift {
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
.bg-gradient-animate {
  background: linear-gradient(90deg, #f97316, #fbbf24, #f97316 80%);
  background-size: 200% 200%;
  animation: gradientShift 4s ease-in-out infinite;
  opacity: 0.82;
}
@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}
.animate-pulse-slow {
  animation: pulse-slow 2s ease-in-out infinite;
}

.champ-slide-enter-active,
.champ-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.champ-slide-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}
.champ-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.champ-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
.champ-slide-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

.champ-card-container {
  z-index: 30;
}

.champ-card {
  /* 모던 플랫 카드 */
  background: #fff;
  border-radius: 1.2rem;
  box-shadow:
    0 2px 18px 0 rgba(80, 80, 80, 0.07),
    0 1.5px 8px 0 rgba(230, 130, 60, 0.09);
  border: 1px solid #f2f3f6;
  transition: box-shadow 0.18s;
}

.champ-card .fa-crown {
  /* 타이틀쪽 크라운만 컬러! */
  color: #f7c63a;
}

@keyframes shine {
  0% {
    filter: drop-shadow(0 0 0 #fff);
  }
  50% {
    filter: drop-shadow(0 0 12px #ffd700);
  }
  100% {
    filter: drop-shadow(0 0 0 #fff);
  }
}
.animate-shine {
  animation: shine 1.7s ease-in-out infinite;
}

@keyframes pop {
  0% {
    transform: scale(0.8);
  }
  80% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}
.animate-pop {
  animation: pop 0.7s cubic-bezier(0.42, 2, 0.58, 0.7);
}
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
@keyframes bounce-fast {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}
.animate-bounce-fast {
  animation: bounce-fast 0.25s;
}
</style>
