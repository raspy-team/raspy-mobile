<template>
  <div class="pt-10 pb-12 px-6 max-w-xl mx-auto">
    <h2 v-if="showSkip" class="text-xl font-semibold mb-6">환영합니다! 당신을 알려주세요</h2>
    <h2 v-else class="text-2xl font-bold mb-6 text-center">프로필 설정</h2>

    <form @submit.prevent="submitProfile" class="space-y-6">
      <!-- 나이 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">나이</label>
        <input v-model.number="form.age" type="number" min="0" max="150" required class="input" />
        <p class="text-xs text-red-500 mt-1" v-if="errors.age">{{ errors.age }}</p>
        <p class="text-xs text-gray-400 mt-1" v-else>0~150세 사이의 숫자를 입력하세요</p>
      </div>

      <!-- 성별 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">성별</label>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="g in genders"
            :key="g.value"
            @click="form.gender = g.value"
            class="border rounded px-3 py-2 text-center cursor-pointer"
            :class="form.gender === g.value ? 'bg-indigo-500 text-white border-indigo-500' : 'text-gray-700 hover:bg-gray-50'"
          >
            {{ g.label }}
          </div>
        </div>
        <p class="text-xs text-red-500 mt-1" v-if="errors.gender">{{ errors.gender }}</p>
      </div>

      <!-- 지역 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">지역</label>
        <div class="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
          <select v-model="selectedPrimary" @change="handlePrimaryChange" class="input">
            <option value="" disabled>시/도 선택</option>
            <option v-for="(subs, primary) in regionMap" :key="primary" :value="primary">{{ primary }}</option>
          </select>

          <select v-model="selectedSecondary" :disabled="!selectedPrimary" class="input">
            <option value="" disabled>시/군/구 선택</option>
            <option v-for="sub in regionMap[selectedPrimary]" :key="sub" :value="sub">{{ sub }}</option>
          </select>
        </div>
        <p class="text-xs text-red-500 mt-1" v-if="errors.region">{{ errors.region }}</p>
      </div>

      <!-- 자기소개 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">자기소개 <span class="text-gray-400 text-xs">(선택)</span></label>
        <textarea v-model="form.bio" class="input" rows="4" maxlength="500" placeholder="자신에 대해 소개해 주세요"></textarea>
        <p class="text-xs text-gray-400 mt-1">{{ form.bio.length }} / 500자</p>
      </div>

      <!-- 프로필 사진 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">프로필 사진</label>
        <div class="flex items-center space-x-4">
          <label class="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-200 border border-gray-300">
            이미지 선택
            <input type="file" class="hidden" accept="image/*" @change="onImageChange" />
          </label>
          <img v-if="previewImage" :src="previewImage" class="w-16 h-16 rounded-full object-cover border" />
        </div>
      </div>

      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        저장하기
      </button>
    </form>

    <!-- 건너뛰기 버튼 -->
    <div v-if="showSkip" class="text-center mt-4">
      <button @click="router.push('/game-list')" class="text-sm text-gray-500 hover:underline">건너뛰기</button>
    </div>

    <CustomToast />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import CustomToast from '../../components/CustomToast.vue'

const { showToast } = useToast()
const router = useRouter()
const route = useRoute()
const showSkip = computed(() => route.query.init === '1')

const form = ref({
  age: 0,
  gender: '',
  region: '',
  bio: ''
})

const errors = ref({
  age: '',
  gender: '',
  region: ''
})

const genders = [
  { value: 'M', label: '남성' },
  { value: 'F', label: '여성' },
  { value: 'O', label: '기타' }
]

const regionMap = {
  '서울시': ['강남구', '서초구', '마포구'],
  '경기도': ['수원시', '성남시', '고양시'],
  '부산시': ['해운대구', '금정구'],
  '대구시': ['수성구', '중구']
}

const selectedPrimary = ref('')
const selectedSecondary = ref('')
const profilePicture = ref(null)
const previewImage = ref(null)

const handlePrimaryChange = () => {
  selectedSecondary.value = ''
}

const onImageChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 1 * 1024 * 1024) {
    alert('파일은 1MB 이하여야 합니다.')
    return
  }
  profilePicture.value = file
  const reader = new FileReader()
  reader.onload = () => previewImage.value = reader.result
  reader.readAsDataURL(file)
}

const validate = () => {
  let valid = true
  errors.value.age = ''
  errors.value.gender = ''
  errors.value.region = ''

  if (form.value.age < 0 || form.value.age > 150) {
    errors.value.age = '나이는 0~150 사이여야 합니다'
    valid = false
  }
  if (!form.value.gender) {
    errors.value.gender = '성별을 선택해주세요'
    valid = false
  }
  if (!selectedPrimary.value || !selectedSecondary.value) {
    errors.value.region = '지역을 모두 선택해주세요'
    valid = false
  }
  return valid
}

const submitProfile = async () => {
  if (!validate()) return

  try {
    const formData = new FormData()
    formData.append('age', form.value.age)
    formData.append('gender', form.value.gender)
    formData.append('region', `${selectedPrimary.value} ${selectedSecondary.value}`)
    formData.append('bio', form.value.bio || '')
    if (profilePicture.value) {
      formData.append('profile_picture', profilePicture.value)
    }

    await api.patch('/user-profile/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showToast('프로필이 저장되었습니다!')
    router.push('/game-list')
  } catch (err) {
    console.error('프로필 저장 실패', err)
    showToast('입력값을 다시 확인해주세요.')
  }
}
</script>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
