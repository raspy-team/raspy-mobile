<template>
  <div class="min-h-full bg-black pt-20">
    <Header v-if="!afterLogin" :hasReferer="true" title="프로필 설정" />

    <div class="raspy-top pb-28 px-5 sm:px-8 max-w-md mx-auto">
      <h2 v-if="afterLogin" class="text-2xl font-semibold mb-2 text-gray-200 text-center">
        환영합니다! 당신을 알려주세요
      </h2>
      <p v-if="afterLogin" class="text-sm text-gray-400 text-center mb-6">
        필수 아님. 건너뛰기 가능
      </p>

      <div class="bg-gray-800 rounded-2xl shadow-lg border border-gray-600 overflow-hidden">
        <!-- 상단: 프로필 아바타 -->
        <div
          class="px-6 pt-6 pb-4 border-b border-gray-600 bg-gradient-to-r from-orange-900/20 to-transparent"
        >
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <img
                v-if="previewImage || form.profilePictureUrl"
                :src="previewImage || form.profilePictureUrl"
                class="w-20 h-20 rounded-full object-cover ring-2 ring-orange-500/80"
                alt="프로필"
              />
              <div
                v-else
                class="w-20 h-20 rounded-full bg-gray-700 grid place-items-center text-gray-400 text-xl ring-2 ring-orange-200"
              >
                👤
              </div>
              <label
                class="absolute bottom-0 right-0 grid place-items-center w-8 h-8 rounded-full bg-gray-800 border border-gray-600 shadow cursor-pointer hover:bg-gray-700"
                title="이미지 변경"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  class="hidden"
                  accept="image/*"
                  capture="environment"
                  @change="onImageChange"
                />
                <span class="text-[10px] text-gray-300">편집</span>
              </label>
            </div>
            <div class="min-w-0">
              <p class="text-sm text-gray-300">프로필 사진</p>
              <p class="text-xs text-gray-400 truncate">10MB 이하. 정사각형 권장</p>
              <div class="mt-2 flex gap-2">
                <button
                  v-if="previewImage || form.profilePictureUrl"
                  type="button"
                  @click="clearProfilePicture"
                  class="px-3 py-1.5 text-xs rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 로딩 -->
        <div v-if="loading" class="p-6 space-y-4 animate-pulse">
          <div class="h-5 w-28 bg-gray-700 rounded"></div>
          <div class="h-12 w-full bg-gray-700 rounded"></div>
          <div class="h-5 w-20 bg-gray-700 rounded"></div>
          <div class="h-12 w-full bg-gray-700 rounded"></div>
          <div class="h-5 w-24 bg-gray-700 rounded"></div>
          <div class="h-24 w-full bg-gray-700 rounded"></div>
        </div>

        <!-- 폼 -->
        <form v-else @submit.prevent="submitProfile" class="p-6 space-y-7" @input="markDirty">
          <!-- 기본 정보 -->
          <fieldset class="space-y-4">
            <legend class="block text-sm font-semibold text-gray-200 mb-1">기본 정보</legend>

            <!-- 닉네임 -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="nickname" class="text-sm text-gray-300"
                  >닉네임 <span class="text-gray-400 text-xs">(선택)</span></label
                >
                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-200"
                  @click="((form.nickname = ''), (errors.nickname = ''))"
                >
                  지우기
                </button>
              </div>
              <input
                id="nickname"
                v-model.trim="form.nickname"
                type="text"
                maxlength="8"
                class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-base bg-gray-800 text-gray-200 placeholder-gray-500"
                placeholder="닉네임을 입력하세요 (최대 8자)"
                @input="errors.nickname = ''"
                :aria-invalid="!!errors.nickname"
                :aria-describedby="errors.nickname ? 'nickname-err' : 'nickname-help'"
              />
              <p v-if="errors.nickname" id="nickname-err" class="mt-1 text-xs text-red-600">
                {{ errors.nickname }}
              </p>
              <p v-else id="nickname-help" class="mt-1 text-xs text-gray-400">
                {{ form.nickname.length }} / 8자
              </p>
            </div>

            <!-- 나이 -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="age" class="text-sm text-gray-300"
                  >나이 <span class="text-gray-400 text-xs">(선택)</span></label
                >
                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-200"
                  @click="((form.age = ''), (errors.age = ''))"
                >
                  지우기
                </button>
              </div>
              <input
                id="age"
                v-model.number="form.age"
                type="number"
                min="0"
                max="150"
                inputmode="numeric"
                class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-base bg-gray-800 text-gray-200 placeholder-gray-500"
                placeholder="나이를 입력하세요"
                @input="errors.age = ''"
                :aria-invalid="!!errors.age"
                :aria-describedby="errors.age ? 'age-err' : 'age-help'"
              />
              <p v-if="errors.age" id="age-err" class="mt-1 text-xs text-red-600">
                {{ errors.age }}
              </p>
              <p v-else id="age-help" class="mt-1 text-xs text-gray-400">0~150 사이만 허용</p>
            </div>

            <!-- 성별 -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-sm text-gray-300"
                  >성별 <span class="text-gray-400 text-xs">(선택)</span></span
                >
                <button
                  type="button"
                  class="text-xs text-gray-400 hover:text-gray-200"
                  @click="form.gender = ''"
                >
                  지우기
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="g in genders"
                  :key="g.value"
                  type="button"
                  @click="((form.gender = g.value), markDirty())"
                  :aria-pressed="form.gender === g.value"
                  :class="[
                    'py-3 rounded-lg border transition font-medium text-sm',
                    form.gender === g.value
                      ? 'bg-orange-500 border-orange-500 text-white shadow'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800',
                  ]"
                >
                  {{ g.label }}
                </button>
              </div>
            </div>
          </fieldset>

          <!-- 지역 -->
          <fieldset class="space-y-3">
            <legend class="block text-sm font-semibold text-gray-200 mb-1">
              지역 <span class="text-gray-400 text-xs">(선택)</span>
            </legend>
            <div class="flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <select
                v-model="selectedPrimary"
                @change="(handlePrimaryChange(), markDirty())"
                class="flex-1 px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-base bg-gray-800 text-gray-200"
              >
                <option value="" disabled>시/도 선택</option>
                <option v-for="(subs, primary) in regionMap" :key="primary" :value="primary">
                  {{ primary }}
                </option>
              </select>
              <select
                v-model="selectedSecondary"
                :disabled="!selectedPrimary"
                class="flex-1 px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:opacity-50 text-base bg-gray-800 text-gray-200"
                @change="markDirty"
              >
                <option value="" disabled>시/군/구 선택</option>
                <option v-for="sub in regionMap[selectedPrimary]" :key="sub" :value="sub">
                  {{ sub }}
                </option>
              </select>
            </div>
            <p v-if="errors.region" class="mt-1 text-xs text-red-600">{{ errors.region }}</p>
            <p v-else class="mt-1 text-xs text-gray-400">둘 다 선택 시 저장됨</p>
            <button
              type="button"
              class="text-xs text-gray-400 hover:text-gray-200"
              @click="clearRegion"
            >
              지우기
            </button>
          </fieldset>

          <!-- 자기소개 -->
          <fieldset class="space-y-2">
            <legend class="block text-sm font-semibold text-gray-200 mb-1">
              자기소개 <span class="text-gray-400 text-xs">(선택)</span>
            </legend>
            <textarea
              v-model="form.bio"
              class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-base bg-gray-800 text-gray-200 placeholder-gray-500"
              rows="4"
              maxlength="100"
              placeholder="간단히 소개해 주세요"
              @input="markDirty"
            ></textarea>
            <p class="text-xs" :class="bioCountColor">{{ form.bio.length }} / 100자</p>
          </fieldset>

          <!-- 소속 -->
          <fieldset class="space-y-2">
            <legend class="block text-sm font-semibold text-gray-200 mb-1">
              소속 <span class="text-gray-400 text-xs">(선택)</span>
            </legend>
            <input
              v-model="form.affiliation"
              type="text"
              maxlength="100"
              class="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-base bg-gray-800 text-gray-200 placeholder-gray-500"
              placeholder="예: 서울대학교, ABC회사, 런닝크루 등"
              @input="markDirty"
            />
            <p class="text-xs text-gray-400">{{ form.affiliation.length }} / 100자</p>
          </fieldset>

          <!-- 저장 -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="isSubmitting || !dirty || !validateSilent"
              class="w-full py-3 rounded-lg bg-orange-500 text-white font-medium text-base hover:bg-orange-600 disabled:opacity-60 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <span v-if="!isSubmitting">저장하기</span>
              <span v-else>저장 중...</span>
            </button>
          </div>
        </form>
      </div>

      <div v-if="afterLogin" class="text-center mt-6">
        <button @click="router.push('/game-list')" class="text-sm text-gray-400 hover:underline">
          건너뛰기
        </button>
      </div>

      <CustomToast />
    </div>

    <!-- 하단 고정 저장 바 -->
    <div
      v-show="dirty"
      class="fixed bottom-0 inset-x-0 z-40 bg-gray-800/95 backdrop-blur border-t border-gray-600"
    >
      <div class="max-w-md mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <p class="text-sm text-gray-400 truncate">변경 사항이 있습니다</p>
        <div class="flex">
          <button
            type="button"
            class="px-8 py-3 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60"
            @click="submitProfile"
            :disabled="isSubmitting || !validateSilent"
          >
            <span v-if="!isSubmitting">저장</span>
            <span v-else>저장 중...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { useToast } from '../../composable/useToast'
import CustomToast from '../../components/CustomToast.vue'
import fullRegionMap from '../../assets/regionMap.json'
import Header from '../../components/HeaderComp.vue'
import { compressImage, dataUrlToFile } from '../../utils/gamePictureStorage'

const regionMap = {}
Object.entries(fullRegionMap).forEach(([primary, subs]) => {
  if (primary !== '전국') regionMap[primary] = subs
})

const { showToast } = useToast()
const router = useRouter()
const route = useRoute()
const afterLogin = computed(() => route.query.init === '1')

const form = ref({
  nickname: '',
  age: '',
  gender: '',
  region: '',
  bio: '',
  affiliation: '',
  profilePictureUrl: '',
})
const serverSnapshot = ref(null)
const errors = ref({ nickname: '', age: '', region: '' })
const genders = [
  { value: 'M', label: '남성' },
  { value: 'F', label: '여성' },
  { value: 'O', label: '기타' },
]
const selectedPrimary = ref('')
const selectedSecondary = ref('')
const profilePicture = ref(null)
const previewImage = ref(null)
const fileInputRef = ref(null)
const loading = ref(true)
const isSubmitting = ref(false)
const dirty = ref(false)
// 이미지 변경 상태: 'unchanged' | 'updated' | 'deleted'
const imageState = ref('unchanged')

const bioCountColor = computed(() => {
  const len = form.value.bio.length
  if (len > 90) return 'text-red-500'
  if (len > 75) return 'text-orange-500'
  return 'text-gray-400'
})

const handlePrimaryChange = () => {
  selectedSecondary.value = ''
}

onMounted(async () => {
  try {
    const { data } = await api.get('/api/user-profile/my/profile')
    if (data) {
      form.value.nickname = data.nickname || ''
      form.value.age = data.age || ''
      form.value.gender = data.gender || ''
      form.value.bio = data.bio || ''
      form.value.affiliation = data.affiliation || ''
      if (data.region) {
        const [primary = '', secondary = ''] = String(data.region).split(' ')
        selectedPrimary.value = primary
        selectedSecondary.value = secondary
      }
      form.value.profilePictureUrl = data.profilePicture || ''
      imageState.value = 'unchanged'
    }
    serverSnapshot.value = snapshot()
  } catch (err) {
    // no-op
  }
  loading.value = false
  if (afterLogin.value && localStorage.getItem('hello-raspy')) {
    router.push('/')
  } else {
    localStorage.setItem('hello-raspy', true)
  }
})

const snapshot = () => ({
  nickname: form.value.nickname,
  age: form.value.age,
  gender: form.value.gender,
  bio: form.value.bio,
  affiliation: form.value.affiliation,
  primary: selectedPrimary.value,
  secondary: selectedSecondary.value,
  profilePictureUrl: form.value.profilePictureUrl,
})

const markDirty = () => {
  dirty.value = JSON.stringify(snapshot()) !== JSON.stringify(serverSnapshot.value)
}

watch(
  [
    () => form.value.nickname,
    () => form.value.age,
    () => form.value.gender,
    () => form.value.bio,
    () => form.value.affiliation,
    selectedPrimary,
    selectedSecondary,
  ],
  markDirty,
)

const onImageChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    showToast('파일은 10MB 이하여야 합니다.')
    return
  }

  // 이미지를 base64로 읽기
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      // 이미지 압축 (화질 30%)
      const compressedDataUrl = await compressImage(reader.result)
      previewImage.value = compressedDataUrl

      // 압축된 이미지를 File 객체로 변환
      profilePicture.value = dataUrlToFile(compressedDataUrl, file.name)
      imageState.value = 'updated'
      dirty.value = true
    } catch (error) {
      console.error('이미지 압축 실패:', error)
      showToast('이미지 처리 중 오류가 발생했습니다.')
    }
  }
  reader.readAsDataURL(file)

  // 같은 파일을 연속 선택해도 change 이벤트가 발생하도록 값 리셋
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const validate = () => {
  let valid = true
  errors.value.nickname = ''
  errors.value.age = ''
  errors.value.region = ''

  if (form.value.nickname && form.value.nickname.length > 8) {
    errors.value.nickname = '닉네임은 최대 8자입니다'
    valid = false
  }
  if (form.value.age !== '' && (form.value.age < 0 || form.value.age > 150)) {
    errors.value.age = '나이는 0~150 사이여야 합니다'
    valid = false
  }
  if (selectedPrimary.value && !selectedSecondary.value) {
    errors.value.region = '시/군/구까지 선택해주세요'
    valid = false
  }
  if (!selectedPrimary.value && selectedSecondary.value) {
    errors.value.region = '시/도를 먼저 선택해주세요'
    valid = false
  }
  return valid
}

const validateSilent = computed(() => {
  if (form.value.nickname && form.value.nickname.length > 8) return false
  if (form.value.age !== '' && (form.value.age < 0 || form.value.age > 150)) return false
  if (
    (selectedPrimary.value && !selectedSecondary.value) ||
    (!selectedPrimary.value && selectedSecondary.value)
  )
    return false
  return true
})

const submitProfile = async () => {
  if (!validate()) return
  try {
    isSubmitting.value = true
    const formData = new FormData()
    formData.append('nickname', form.value.nickname || '')
    formData.append('age', form.value.age)
    formData.append('gender', form.value.gender)
    const region =
      selectedPrimary.value && selectedSecondary.value
        ? `${selectedPrimary.value} ${selectedSecondary.value}`
        : ''
    formData.append('region', region)
    formData.append('bio', form.value.bio || '')
    formData.append('affiliation', form.value.affiliation || '')
    // 이미지 파라미터 rule
    // - updated: 새 파일 업로드
    // - deleted: null 전달
    // - unchanged: 파라미터 자체를 보내지 않음
    if (imageState.value === 'updated' && profilePicture.value) {
      formData.append('profile_picture', profilePicture.value)
    } else if (imageState.value === 'deleted') {
      formData.append('profile_picture', 'null')
    }
    await api.patch('/api/user-profile/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    showToast('프로필이 저장되었습니다!')
    serverSnapshot.value = snapshot()
    dirty.value = false
    imageState.value = 'unchanged'
    router.push('/profile/0')
  } catch (err) {
    showToast('입력값을 다시 확인해주세요.')
  } finally {
    isSubmitting.value = false
  }
}

const clearRegion = () => {
  selectedPrimary.value = ''
  selectedSecondary.value = ''
  errors.value.region = ''
  markDirty()
}

const clearProfilePicture = () => {
  profilePicture.value = null
  previewImage.value = null
  form.value.profilePictureUrl = ''
  imageState.value = 'deleted'
  if (fileInputRef.value) fileInputRef.value.value = ''
  markDirty()
}
</script>

<style scoped>
input,
select,
textarea {
  @apply font-sans;
}
</style>
