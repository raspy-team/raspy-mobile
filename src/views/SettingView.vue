<template>
  <Header title="설정" :has-referer="true"/>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-xs space-y-3">
      <!-- 기존 내용... -->
      <div class="pt-4 flex flex-col items-center mb-8">
        <i class="fas fa-tools text-2xl text-gray-300 mb-2"></i>
        <p class="text-gray-400 text-sm">다른 기능은 <span class="font-semibold text-[var(--point-color)]">준비 중</span>입니다</p>
      </div>


            <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-orange-500  text-white font-semibold text-base shadow  transition"
      >
        <i class="fas fa-sign-out-alt"></i>
        로그아웃
      </button>


      <!-- 프로필 설정 버튼 -->
      <button
        @click="goToSetProfile"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border  font-semibold text-base bg-white shadow transition"
      >
        <i class="fas fa-user-cog"></i>
        프로필 설정
      </button>


            <!-- 법적 고지사항 버튼 -->
      <button
        @click="showModal = true"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-lg border  font-semibold text-base bg-white shadow transition"
      >
        <i class="fas fa-balance-scale"></i>
        법적 고지사항
      </button>

    </div>

    
  </div>

  <!-- Modal -->
  <div v-if="showModal" class="fixed inset-0 z-50 bg-black p-5 bg-opacity-30 flex items-center justify-center">
    <div class="bg-white rounded-lg max-w-md w-full p-6 relative shadow-lg">
      <button class="absolute top-3 right-3 text-gray-400 " @click="showModal = false" aria-label="닫기">
        <i class="fas fa-times"></i>
      </button>
      <h2 class="text-xl font-bold mb-3">법적 고지사항</h2>
      <div class="prose text-gray-700 text-sm max-h-80 overflow-auto">
        <ul class="list-disc ml-5 space-y-2">
          <li>
            <b>개인정보 수집 및 이용:</b> 본 서비스는 회원가입 및 서비스 제공을 위하여 소셜 로그인(OAuth2 기반, 카카오/애플)을 통해 <b>이메일</b> 정보를 수집합니다. 그룹 계정의 경우, 이메일 신청을 기반으로 별도의 계정이 생성되며, 발급된 아이디/비밀번호로 로그인합니다.
          </li>
          <li>
            <b>개인정보 국외 이전 고지:</b> 회원 정보 및 서비스 운영을 위한 데이터베이스와 서버는 <b>Amazon Web Services(AWS) 북미 리전(USA)</b>에 위치해 있습니다. 이에 따라 이용자의 개인정보가 대한민국 외 지역(미국)으로 이전·보관될 수 있습니다.
          </li>
          <li>
            <b>커뮤니티 플랫폼 고지:</b> 본 서비스는 커뮤니티 플랫폼으로서, 사용자 간의 커뮤니케이션 및 게시물 작성이 가능합니다. 이용자는 게시물 작성 시 개인정보가 포함되지 않도록 주의해야 하며, 타인의 권리를 침해하는 게시물 작성 시 서비스 이용이 제한될 수 있습니다.
          </li>
          <li>
            <b>저작권 안내:</b> 이용자가 서비스 내에 게시 및 업로드한 콘텐츠(텍스트, 이미지 등)는 저작권법 등 관련 법령에 따라 보호되며, 타인의 저작물을 무단 게시할 경우 법적 책임이 발생할 수 있습니다.
          </li>
          <li>
            <b>기타 자세한 정보:</b> 자세한 내용은 <span class="underline text-blue-600">개인정보처리방침</span> 및 <span class="underline text-blue-600">이용약관</span>을 참조하시기 바랍니다.
          </li>
        </ul>
      </div>
      <div class="mt-4 flex justify-end">
        <button class="px-4 py-2 bg-[var(--point-color)] text-white rounded " @click="showModal = false">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Header from "../components/HeaderComp.vue"
import api from '../api/api'

const showModal = ref(false)
const router = useRouter()
const logout = async() => {
  try {
    await api.post('/api/push/remove-device')
    localStorage.removeItem('raspy_access_token2')
    router.push("/init")
  } catch (err) {
    console.log(err)
  }
}
const goToSetProfile = () => {
  router.push('/set-profile')
}
</script>

<style scoped>
:root {
  --point-color: #ff6f1f;
}
</style>
