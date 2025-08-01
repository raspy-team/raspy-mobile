<template>
  <Header title="설정" :has-referer="true" />
  <div class="bg-white flex flex-col items-center justify-center px-4 pt-24">
    <div class="w-full max-w-xs space-y-3 pt-5">
      <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-orange-500 text-white font-semibold text-base shadow transition"
      >
        <i class="fas fa-sign-out-alt"></i>
        로그아웃
      </button>
      <button
        @click="showDeleteModal = true"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-500 text-white font-semibold text-base shadow transition"
      >
        <i class="fas fa-user-slash"></i>
        계정 삭제하기
      </button>
      <button
        @click="goToSetProfile"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-semibold text-base bg-white shadow transition"
      >
        <i class="fas fa-user-cog"></i>
        프로필 설정
      </button>
      <button
        @click="showModal = true"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-semibold text-base bg-white shadow transition"
      >
        <i class="fas fa-balance-scale"></i>
        법적 고지사항
      </button>
      <button
        @click="showBlockListModal = true"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-semibold text-base bg-white shadow transition"
      >
        <i class="fas fa-user-lock"></i>
        차단한 유저 보기
      </button>
    </div>
  </div>

  <!-- 법적 고지 모달 (기존 유지) -->
  <div
    v-if="showModal"
    class="fixed inset-0 z-50 bg-black p-5 bg-opacity-30 flex items-center justify-center flex flex-col"
  >
    <div
      class="prose text-white p-5 text-sm max-h-[70dvh] rounded-[10px] bg-black overflow-auto space-y-4"
    >
      <section>
        <h3 class="font-semibold text-base">1. 개인정보 수집 및 이용</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            ‘Match’는 회원가입 및 서비스 제공을 위해 카카오/애플 소셜 로그인(이메일) 또는 그룹 계정
            신청(이메일 기반)으로 최소한의 개인정보(이메일)만 수집합니다.
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
        <h3 class="font-semibold text-base">2. 개인정보 국외 이전 안내</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            회원정보 및 서비스 운영 데이터는 Amazon Web Services(AWS) 북미(USA) 리전 서버에 안전하게
            저장·처리됩니다. 이에 따라, 개인정보가 대한민국 외 지역으로 이전될 수 있습니다.
          </li>
          <li>
            개인정보 보호를 위해 관련 법령 및 기준에 따라 적절한 기술적·관리적 조치를 취하고
            있습니다.
          </li>
        </ul>
      </section>
      <section>
        <h3 class="font-semibold text-base">3. 외부 서비스 연동 안내</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            본 서비스는 카카오, 애플 소셜 로그인, Firebase(알림 서비스) 등 외부 서비스와 연동되어
            있으며, 각 서비스 제공자의 정책에 따라 일부 정보가 연동·처리될 수 있습니다.
          </li>
          <li>광고, 마케팅, 제3자 정보 제공은 일절 없습니다.</li>
        </ul>
      </section>
      <section>
        <h3 class="font-semibold text-base">4. 커뮤니티 이용 안내 및 금지행위</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            Match는 스포츠 커뮤니티 플랫폼으로, 회원 간 자유로운 소통과 게시물(글, 사진 등) 작성이
            가능합니다.
          </li>
          <li>
            타인의 권리 침해, 불법·유해·음란·도배 등 서비스 질서를 해치는 행위는 금지되며, 위반 시
            사전 안내 없이 게시물 삭제 또는 서비스 이용이 제한될 수 있습니다.
          </li>
          <li>커뮤니티 내 게시물 및 활동에 대한 책임은 해당 회원에게 있습니다.</li>
        </ul>
      </section>
      <section>
        <h3 class="font-semibold text-base">5. 저작권 및 콘텐츠 관리</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            회원이 서비스 내에 게시하거나 업로드한 모든 콘텐츠(텍스트, 이미지 등)는 해당 회원에게
            저작권이 있습니다.
          </li>
          <li>타인 저작물을 무단 게시·복제할 경우 법적 책임이 발생할 수 있습니다.</li>
          <li>
            서비스 운영상, 불법 또는 권리침해 콘텐츠는 사전 통지 없이 삭제 또는 제한될 수 있습니다.
          </li>
        </ul>
      </section>
      <section>
        <h3 class="font-semibold text-base">6. 약관 및 정책의 변경</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>본 약관 및 정책은 2025년 7월 25일 기준이며, 변경 시 서비스 내 공지 후 적용됩니다.</li>
        </ul>
      </section>
      <section>
        <h3 class="font-semibold text-base">7. 문의처</h3>
        <ul class="list-disc ml-5 space-y-1">
          <li>
            서비스 및 개인정보 관련 문의:
            <a href="mailto:admin@raspyapp.com" class="underline text-blue-600"
              >admin@raspyapp.com</a
            >
          </li>
          <li>운영사: 주식회사 래스피 (Raspy Inc.)</li>
        </ul>
      </section>

      <div class="mt-4 flex justify-end">
        <button class="px-5 py-2 bg-[#fff] w-full text-black rounded" @click="showModal = false">
          닫기
        </button>
      </div>
    </div>
  </div>

  <!-- 계정 삭제 확인 모달 -->
  <div
    v-if="showDeleteModal"
    class="fixed inset-0 z-50 bg-black p-5 bg-opacity-30 flex items-center justify-center"
  >
    <div class="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
      <button
        class="absolute top-3 right-3 text-gray-400"
        @click="showDeleteModal = false"
        aria-label="닫기"
      >
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold mb-3 text-red-500">계정 삭제 안내</h2>
      <p class="text-gray-700 text-sm mb-4">
        정말로 계정을 <span class="font-semibold text-red-500">삭제</span>하시겠습니까?<br />
        이 작업은 되돌릴 수 없습니다. <br /><br />
        단, 언제든지 재가입 할 수 있습니다.
      </p>
      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded"
          @click="showDeleteModal = false"
        >
          취소
        </button>
        <button class="px-4 py-2 bg-red-500 text-white rounded" @click="deleteAccount">
          영구 삭제
        </button>
      </div>
    </div>
  </div>

  <!-- 차단 유저 목록 모달 -->
  <div
    v-if="showBlockListModal"
    class="fixed inset-0 z-50 bg-black bg-opacity-30 flex items-center justify-center p-4"
  >
    <div class="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
      <button
        class="absolute top-3 right-3 text-gray-400"
        @click="showBlockListModal = false"
        aria-label="닫기"
      >
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold mb-4">내가 차단한 사용자</h2>
      <ul class="space-y-3 max-h-80 overflow-auto">
        <li
          v-for="user in blockedUsers"
          :key="user.id"
          class="flex justify-between flex sm:flex-row sm:items-center sm:justify-between p-2 border rounded hover:bg-gray-50"
        >
          <div class="flex flex-col">
            <span class="text-gray-800 font-semibold">{{ user.nickname }}</span>
            <span class="text-gray-700 text-[0.7rem] font-md">@{{ user.email }}</span>
          </div>
          <button
            @click="unblock(user.id)"
            class="sm:mt-0 px-5 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
          >
            해제
          </button>
        </li>
        <li v-if="blockedUsers.length === 0" class="text-gray-500 text-center py-4">
          차단된 사용자가 없습니다.
        </li>
      </ul>
      <div class="mt-4 text-right">
        <button
          @click="showBlockListModal = false"
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../components/HeaderComp.vue'
import api from '../api/api'

const router = useRouter()
const showModal = ref(false)
const showDeleteModal = ref(false)
const showBlockListModal = ref(false)
const blockedUsers = ref([]) // 배열에 { id, email, nickname, profile } 형태

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

const goToSetProfile = () => {
  router.push('/set-profile')
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
  try {
    const res = await api.get('/api/block')
    blockedUsers.value = res.data // now list of { id, email, nickname }
  } catch (err) {
    console.error('차단 목록 조회 실패', err)
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
</script>
