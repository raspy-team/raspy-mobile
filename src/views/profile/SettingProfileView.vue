<template>
    <Header v-if="!afterLogin" :hasReferer="true" title="프로필 설정"></Header>

  <div class="pt-20 pb-16 px-8 max-w-md mx-auto bg-white rounded-2xl shadow-lg">
    <!-- Header -->
    <h2 v-if="afterLogin" class="text-2xl font-semibold mb-8 text-gray-800">환영합니다! 당신을 알려주세요</h2>

    <form @submit.prevent="submitProfile" class="space-y-8">
      <!-- 나이 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">나이</label>
        <input
          v-model.number="form.age"
          type="number"
          min="0"
          max="150"
          required
          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          placeholder="나이를 입력하세요"
        />
        <p v-if="errors.age" class="mt-1 text-xs text-red-600">{{ errors.age }}</p>
        <p v-else class="mt-1 text-xs text-gray-400">0~150세 사이의 숫자를 입력하세요</p>
      </div>

      <!-- 성별 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">성별</label>
        <div class="flex space-x-4">
          <button
            v-for="g in genders"
            :key="g.value"
            type="button"
            @click="form.gender = g.value"
            :class="[
              'flex-1 py-3 rounded-lg border transition',
              form.gender === g.value
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ g.label }}
          </button>
        </div>
        <p v-if="errors.gender" class="mt-1 text-xs text-red-600">{{ errors.gender }}</p>
      </div>

      <!-- 지역 선택 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">지역</label>
        <div class="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
          <select
            v-model="selectedPrimary"
            @change="handlePrimaryChange"
            class="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          >
            <option value="" disabled>시/도 선택</option>
            <option v-for="(subs, primary) in regionMap" :key="primary" :value="primary">{{ primary }}</option>
          </select>

          <select
            v-model="selectedSecondary"
            :disabled="!selectedPrimary"
            class="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:opacity-50"
          >
            <option value="" disabled>시/군/구 선택</option>
            <option v-for="sub in regionMap[selectedPrimary]" :key="sub" :value="sub">{{ sub }}</option>
          </select>
        </div>
        <p v-if="errors.region" class="mt-1 text-xs text-red-600">{{ errors.region }}</p>
      </div>

      <!-- 자기소개 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          자기소개 <span class="text-gray-400 text-xs">(선택)</span>
        </label>
        <textarea
          v-model="form.bio"
          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          rows="4"
          maxlength="500"
          placeholder="자신에 대해 소개해 주세요"
        ></textarea>
        <p class="mt-1 text-xs text-gray-400">{{ form.bio.length }} / 500자</p>
      </div>

      <!-- 프로필 사진 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">프로필 사진</label>
        <div class="flex items-center space-x-4">
          <label
            class="inline-flex items-center px-5 py-3 bg-gray-100 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
          >
            <span class="text-gray-700">이미지 선택</span>
            <input type="file" class="hidden" accept="image/*" @change="onImageChange" />
          </label>
          <img
            v-if="previewImage"
            :src="previewImage"
            class="w-20 h-20 rounded-full object-cover border-2 border-orange-500"
            alt="Preview"
          />
        </div>
      </div>

      <!-- 저장 버튼 -->
      <button
        type="submit"
        class="w-full py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        저장하기
      </button>
    </form>

    <!-- 건너뛰기 버튼 -->
    <div v-if="afterLogin" class="text-center mt-6">
      <button
        @click="router.push('/game-list')"
        class="text-sm text-gray-500 hover:underline"
      >
        건너뛰기
      </button>
    </div>

    <CustomToast />
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import CustomToast from '../../components/CustomToast.vue'
import fullRegionMap from '../../assets/regionMap.json'
import Header from "../../components/HeaderComp.vue"

const regionMap = {}
Object.entries(fullRegionMap).forEach(([primary, subs]) => {
  if (primary !== '전국') {
    regionMap[primary] = subs
  }
})

const { showToast } = useToast()
const router = useRouter()
const route = useRoute()
const afterLogin = computed(() => route.query.init === '1')

const form = ref({ age: 0, gender: '', region: '', bio: '' })
const errors = ref({ age: '', gender: '', region: '' })
const genders = [
  { value: 'M', label: '남성' },
  { value: 'F', label: '여성' },
  { value: 'O', label: '기타' }
]

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
  if (file.size > 5 * 1024 * 1024) {
    alert('파일은 5MB 이하여야 합니다.')
    return
  }
  profilePicture.value = file
  const reader = new FileReader()
  reader.onload = () => (previewImage.value = reader.result)
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

    await api.patch('/api/user-profile/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showToast('프로필이 저장되었습니다!')
    router.push('/game-list')
  } catch (err) {
    console.error('프로필 저장 실패', err)
    showToast('입력값을 다시 확인해주세요.')
  }
}

onMounted(()=> {
    if(afterLogin.value && localStorage.getItem("hello-raspy")) {
        router.push("/")
    } else {
      localStorage.setItem("hello-raspy", true)
    }
})
</script>

<style scoped>
/* 기본 input 스타일 */
input,
select,
textarea {
  @apply font-sans;
}
</style>
