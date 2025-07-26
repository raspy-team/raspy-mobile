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
    class="fixed inset-0 z-50 bg-black p-5 bg-opacity-30 flex items-center justify-center"
  >
    <!-- 모달 내용 생략 가능 (위 코드 참고) -->
    ...
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
