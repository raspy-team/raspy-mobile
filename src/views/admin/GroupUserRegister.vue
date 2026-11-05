<template>
  <div>
    <UiTopBar title="그룹 계정 만들기" back="/admin" />

    <main class="px-4 pt-4 pb-12 max-w-xl mx-auto">
      <p class="t-caption mb-6">운영진이 나눠줄 계정을 만들어요. 받은 사람은 이 아이디와 비밀번호로 로그인해요.</p>
      <form class="space-y-5" @submit.prevent="handleRegister">
        <UiInput v-model="email" label="아이디" placeholder="raspyinc" :maxlength="50" :error="emailError" />
        <UiInput v-model="password" label="비밀번호" placeholder="8~20자" :maxlength="20" hint="받은 사람에게 그대로 전해 주세요" :error="passwordError" />
        <p v-if="submitError" class="text-sm text-danger-fg" role="alert">{{ submitError }}</p>
        <UiButton type="submit" block size="lg" :loading="submitting">계정 만들기</UiButton>
      </form>
    </main>
  </div>
</template>

<script setup>
// 관리자가 그룹(단체) 계정을 만든다. 서버가 관리자만 허용한다
import { ref } from 'vue'
import api from '../../api/api'
import { UiButton, UiInput, UiTopBar } from '../../components/ui'
import { useToast } from '../../composables/useToast'

const { showToast } = useToast()
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const submitError = ref('')
const submitting = ref(false)

function validate() {
  emailError.value = email.value ? '' : '아이디를 넣어 주세요'
  passwordError.value = password.value.length >= 8 && password.value.length <= 20 ? '' : '비밀번호는 8~20자로 정해 주세요'
  return !emailError.value && !passwordError.value
}

async function handleRegister() {
  submitError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await api.post('/api/auth/register', { email: email.value, password: password.value })
    showToast('계정을 만들었어요. 아이디와 비밀번호를 잘 전해 주세요')
    email.value = ''
    password.value = ''
  } catch (err) {
    if (err.response?.status === 409) emailError.value = '이미 쓰는 아이디예요'
    else submitError.value = '만들지 못했어요. 관리자 계정인지 확인해 주세요'
  } finally {
    submitting.value = false
  }
}
</script>
