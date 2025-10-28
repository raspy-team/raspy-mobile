<template>
  <Header :title="'설정'" :has-referer="true" />

  <!-- Page container -->
  <div class="bg-black min-h-dvh">
    <div class="mx-auto max-w-md px-4 pt-24 pb-12">
      <!-- Profile capsule (optional future area) -->
      <section class="mb-6">
        <div class="flex items-center gap-3 rounded-2xl border border-gray-600 p-3 shadow-sm bg-gray-800">
          <div
            class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-700 flex items-center justify-center"
          >
            <img
              v-if="myProfileImage"
              :src="myProfileImage"
              alt="프로필"
              class="h-12 w-12 object-cover"
            />
            <i v-else class="fas fa-user text-xl text-gray-400" aria-hidden="true"></i>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm text-gray-400">로그인된 계정</p>
            <p class="truncate font-semibold text-gray-200">{{ myNickname || (currentUserLabel ? '@' + currentUserLabel : '') }}</p>
            <p v-if="myIntro" class="truncate text-xs text-gray-500">{{ myIntro }}</p>
          </div>
          <button
            @click="goToSetProfile"
            class="shrink-0 rounded-full border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
          >
            프로필 설정
          </button>
        </div>
      </section>

      <!-- Settings groups -->
      <section aria-labelledby="account-section" class="space-y-6">
        <!-- 계정 -->
        <div>
          <h2
            id="account-section"
            class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            계정
          </h2>
          <ul class="divide-y divide-gray-600 rounded-2xl border border-gray-600">
            <!-- 알림 설정 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="goNotifications"
                aria-label="알림 설정"
              >
                <i class="fas fa-bell text-base text-gray-400" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-gray-200">알림 설정</p>
                  <p class="truncate text-xs text-gray-500">푸시 알림 수신 관리</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
            <!-- 차단한 유저 보기 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="openBlockList"
                aria-label="차단한 유저 보기"
              >
                <i class="fas fa-shield-alt text-base text-gray-400" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-gray-200">차단한 유저 보기</p>
                  <p class="truncate text-xs text-gray-500">관리 및 해제</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
            <!-- 로그아웃 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="logout"
                aria-label="로그아웃"
              >
                <i class="fas fa-sign-out-alt text-base text-orange-600" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-red-600">로그아웃</p>
                  <p class="truncate text-xs text-gray-500">로그인 화면으로 이동</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
            <!-- 계정 삭제하기 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="() => (showDeleteModal = true)"
                aria-label="계정 삭제하기"
              >
                <i class="fas fa-user-slash text-base text-red-600" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-red-600">계정 삭제하기</p>
                  <p class="truncate text-xs text-gray-500">영구 삭제</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </div>

        <!-- 정보 -->
        <div>
          <h2 class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">정보</h2>
          <ul class="divide-y divide-gray-600 rounded-2xl border border-gray-600">
            <!-- 법적 고지사항 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="() => (showLegalModal = true)"
                aria-label="법적 고지사항"
              >
                <i class="fas fa-balance-scale text-base text-gray-400" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-gray-200">법적 고지사항</p>
                  <p class="truncate text-xs text-gray-500">개인정보, 커뮤니티, 저작권</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
            <!-- 앱 정보 -->
            <li>
              <button
                class="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                @click="openAbout"
                aria-label="앱 정보"
              >
                <i class="fas fa-info-circle text-base text-gray-400" aria-hidden="true"></i>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-gray-200">앱 정보</p>
                  <p class="truncate text-xs text-gray-500">버전, 빌드, 오픈소스 라이선스</p>
                </div>
                <i class="fas fa-chevron-right text-xs text-gray-500" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- Sticky secondary actions -->
      <div class="mt-8 flex items-center justify-between">
        <button @click="openHelp" class="text-sm underline">도움말</button>
        <button @click="openContact" class="text-sm underline">문의하기</button>
      </div>
    </div>
  </div>

  <!-- 법적 고지 모달 -->
  <div
    v-if="showLegalModal"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
  >
    <div
      class="absolute inset-0 bg-black/40"
      @click="showLegalModal = false"
      aria-hidden="true"
    ></div>
    <div class="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-gray-800 p-5 shadow-lg">
      <div class="absolute right-3 top-3">
        <button
          class="rounded p-2 text-gray-400 hover:bg-gray-700"
          @click="showLegalModal = false"
          aria-label="닫기"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <h3 class="mb-3 text-lg font-bold text-gray-200">법적 고지사항</h3>
      <div class="prose prose-sm max-w-none max-h-[70dvh] overflow-auto">
        <section>
          <h3>1. 개인정보 수집 및 이용</h3>
          <ul>
            <li>
              ‘Match’는 회원가입 및 서비스 제공을 위해 카카오/애플 소셜 로그인(이메일) 또는 그룹
              계정 신청(이메일 기반)으로 최소한의 개인정보(이메일)만 수집합니다.
            </li>
            <li>
              카메라/앨범 접근 권한은 게시물 작성 등 서비스 이용 목적에 한해 사용되며, 사진은 이용자
              기기 또는 서비스 내 저장을 위해서만 접근됩니다.
            </li>
            <li>알림 권한은 서비스 공지, 커뮤니티 알림 등 푸시알림 제공을 위해 사용됩니다.</li>
            <li>
              수집된 정보는 회원관리, 서비스 제공, 문의 대응 등 명시된 목적 외로는 이용하지 않으며,
              탈퇴 시 즉시 안전하게 파기됩니다.
            </li>
          </ul>
        </section>
        <section>
          <h3>2. 개인정보 국외 이전 안내</h3>
          <ul>
            <li>
              회원정보 및 서비스 운영 데이터는 AWS 북미(USA) 리전 서버에 안전하게 저장·처리됩니다.
              이에 따라, 개인정보가 대한민국 외 지역으로 이전될 수 있습니다.
            </li>
            <li>
              개인정보 보호를 위해 관련 법령 및 기준에 따라 적절한 기술적·관리적 조치를 취하고
              있습니다.
            </li>
          </ul>
        </section>
        <section>
          <h3>3. 외부 서비스 연동 안내</h3>
          <ul>
            <li>카카오, 애플 소셜 로그인, Firebase(알림) 등 외부 서비스와 연동될 수 있습니다.</li>
            <li>광고, 마케팅, 제3자 정보 제공은 일절 없습니다.</li>
          </ul>
        </section>
        <section>
          <h3>4. 커뮤니티 이용 안내 및 금지행위</h3>
          <ul>
            <li>
              타인의 권리 침해, 불법·유해·음란·도배 등은 금지되며 위반 시 게시물 삭제 또는 이용
              제한될 수 있습니다.
            </li>
            <li>게시물 및 활동에 대한 책임은 해당 회원에게 있습니다.</li>
          </ul>
        </section>
        <section>
          <h3>5. 저작권 및 콘텐츠 관리</h3>
          <ul>
            <li>업로드한 콘텐츠의 저작권은 회원에게 있습니다.</li>
            <li>타인 저작물 무단 게시·복제 시 법적 책임이 발생할 수 있습니다.</li>
            <li>불법 또는 권리침해 콘텐츠는 사전 통지 없이 삭제 또는 제한될 수 있습니다.</li>
          </ul>
        </section>
        <section>
          <h3>6. 약관 및 정책의 변경</h3>
          <ul>
            <li>본 약관 및 정책은 2025년 7월 25일 기준이며, 변경 시 공지 후 적용됩니다.</li>
          </ul>
        </section>
        <section>
          <h3>7. 문의처</h3>
          <ul>
            <li>문의: <a href="mailto:admin@raspyapp.com">admin@raspyapp.com</a></li>
            <li>운영사: 주식회사 래스피 (Raspy Inc.)</li>
          </ul>
        </section>
      </div>
      <div class="mt-4">
        <button
          class="w-full rounded-lg bg-gray-900 px-4 py-2 text-white"
          @click="showLegalModal = false"
        >
          닫기
        </button>
      </div>
    </div>
  </div>

  <!-- 계정 삭제 확인 모달 -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
  >
    <div
      class="absolute inset-0 bg-black/40"
      @click="showDeleteModal = false"
      aria-hidden="true"
    ></div>
    <div class="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-gray-800 p-5 shadow-lg">
      <div class="absolute right-3 top-3">
        <button
          class="rounded p-2 text-gray-400 hover:bg-gray-700"
          @click="showDeleteModal = false"
          aria-label="닫기"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      <h3 class="mb-3 text-lg font-bold text-red-600">계정 삭제 안내</h3>
      <p class="text-sm text-gray-300">
        정말로 계정을 <span class="font-semibold text-red-600">삭제</span>하시겠습니까? 이 작업은
        되돌릴 수 없습니다.<br /><br />
        단, 언제든지 재가입 할 수 있습니다.
      </p>
      <div class="mt-4 flex gap-2">
        <button class="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600" @click="showDeleteModal = false">
          취소
        </button>
        <button class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700" @click="deleteAccount">
          영구 삭제
        </button>
      </div>
    </div>
  </div>

  <!-- 차단 유저 목록 모달 -->
  <div
    v-if="showBlockListModal"
    class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
  >
    <div class="relative w-full max-w-md rounded-2xl bg-gray-800 p-6 shadow-lg">
      <button
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-200"
        @click="showBlockListModal = false"
        aria-label="닫기"
      >
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold mb-4 text-gray-200">내가 차단한 사용자</h2>
      <div v-if="isLoadingBlocked" class="py-4 text-center text-sm text-gray-400">
        불러오는 중...
      </div>
      <ul v-else class="space-y-2 max-h-80 overflow-auto">
        <li
          v-for="user in blockedUsers"
          :key="user.id"
          class="flex items-center justify-between rounded-lg border border-gray-600 p-2 hover:bg-gray-700 bg-gray-800"
        >
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-200">{{ user.nickname }}</p>
            <p class="truncate text-xs text-gray-400">@{{ user.email }}</p>
          </div>
          <button
            @click="unblock(user.id)"
            class="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
          >
            해제
          </button>
        </li>
        <li v-if="!blockedUsers.length" class="py-6 text-center text-gray-400">
          차단된 사용자가 없습니다.
        </li>
      </ul>
      <div class="mt-4 text-right">
        <button class="rounded-lg bg-gray-700 px-4 py-2 text-gray-300 hover:bg-gray-600" @click="showBlockListModal = false">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineOptions } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/HeaderComp.vue'
import api from '../api/api'

defineOptions({ name: 'SettingsView' })

/* ------------------ state ------------------ */
const router = useRouter()
const showLegalModal = ref(false)
const showDeleteModal = ref(false)
const showBlockListModal = ref(false)
const isLoadingBlocked = ref(false)
const blockedUsers = ref([])
// 내 프로필 정보 (SettingProfileView.vue와 동일한 API 사용)
const myProfileImage = ref('')
const myNickname = ref('')
const myIntro = ref('')
// 로그인 표기를 위한 사용자명(이메일/아이디 우선순위)
const currentUserLabel = ref('')

/* ------------------ actions ------------------ */
const logout = async () => {
  try {
    try {
      await api.post('/api/push/remove-device')
    } catch (e) {
      console.log(e)
    }
    localStorage.removeItem('raspy_access_token2')
    router.push('/init')
  } catch (err) {
    console.log(err)
  }
}

const goToSetProfile = () => router.push('/set-profile')
const goNotifications = () => router.push('/settings/notifications')
const openAbout = () => router.push('/settings/about')
const openHelp = () => router.push('/help')
const openContact = () => router.push('/contact')

const openBlockList = () => {
  showBlockListModal.value = true
}

const deleteAccount = async () => {
  try {
    await api.post('/api/user/remove')
    localStorage.removeItem('raspy_access_token2')
    router.push('/init')
  } catch (err) {
    alert('계정 삭제 중 오류가 발생했습니다.')
  }
}

const fetchBlocked = async () => {
  isLoadingBlocked.value = true
  try {
    const res = await api.get('/api/block')
    blockedUsers.value = res.data
  } catch (err) {
    console.error('차단 목록 조회 실패', err)
  } finally {
    isLoadingBlocked.value = false
  }
}

const unblock = async (userId) => {
  try {
    await api.delete(`/api/block/${userId}`)
    blockedUsers.value = blockedUsers.value.filter((user) => user.id !== userId)
  } catch (err) {
    alert('차단 해제 실패')
  }
}

watch(showBlockListModal, (opened) => {
  if (opened) fetchBlocked()
})

onMounted(() => {
  // 내 프로필 불러오기 (SettingProfileView.vue의 로직을 반영)
  ;(async () => {
    try {
      // 프로필(닉네임/한줄소개/프로필이미지)
      const { data } = await api.get('/api/user-profile/my/profile')
      if (data) {
        myNickname.value = data.nickname || ''
        myIntro.value = data.bio || ''
        myProfileImage.value = data.profilePicture || ''
      }
    } catch (e) {
      // ignore
    }

    try {
      // 사용자 라벨: 아이디/이메일 표시용
      const idRes = await api.get('/api/auth/current-user-id')
      const userId = idRes.data
      if (userId != null) {
        const res = await api.get(`/api/user-profile/${userId}`)
        // 백엔드 스키마에 따라 email 또는 username 중 사용
        currentUserLabel.value = res.data?.email || res.data?.username || ''
      }
    } catch (e) {
      // ignore
    }
  })()
})
</script>

<style scoped>
.prose :where(ul) {
  margin: 0;
  padding-left: 1rem;
}
.prose :where(li) {
  margin: 0.25rem 0;
}
</style>
