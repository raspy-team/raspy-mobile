<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="프로필 편집" back="/profile/0" />

    <main v-if="loading" class="max-w-md mx-auto px-4 pt-6 space-y-6" role="status" aria-label="불러오는 중">
      <UiSkeleton class="w-24 h-24 rounded-full mx-auto" />
      <UiSkeleton v-for="n in 4" :key="n" class="h-16 w-full" />
    </main>

    <!-- 지금 값을 못 불러오면 저장하지 않는다 (빈 칸으로 덮어쓰지 않게) -->
    <main v-else-if="loadError" class="max-w-md mx-auto px-4 pt-16">
      <UiEmptyState icon="fas fa-triangle-exclamation" title="프로필을 불러오지 못했어요" description="잠시 뒤 다시 해 주세요">
        <UiButton variant="secondary" @click="load">다시 불러오기</UiButton>
      </UiEmptyState>
    </main>

    <form v-else class="max-w-md mx-auto px-4 pt-6 pb-32 space-y-6 ui-appear" novalidate @submit.prevent="save">
      <!-- 사진 -->
      <div class="flex flex-col items-center gap-2">
        <button type="button" class="relative" aria-label="프로필 사진 바꾸기" @click="fileInput?.click()">
          <UiAvatar :src="preview" :name="form.nickname || '나'" size="xl" />
          <span class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-surface-2 border border-line text-fg flex items-center justify-center text-sm">
            <UiIcon name="fas fa-camera" aria-hidden="true" />
          </span>
        </button>
        <UiButton v-if="preview" variant="ghost" size="sm" @click="removePhoto">사진 빼기</UiButton>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onPhoto" />
      </div>

      <UiInput v-model="form.nickname" label="닉네임" :maxlength="NICKNAME_MAX" :hint="`다른 사람에게 보이는 이름. ${NICKNAME_MAX}자까지`" :error="errors.nickname" />
      <UiInput v-model="form.username" label="친구 찾기 아이디 (@)" icon="fas fa-at" :maxlength="12" hint="영문 소문자·숫자·밑줄(_). 친구가 나를 찾을 때 써요 (로그인 아이디와 달라도 돼요)" :error="errors.username" />
      <!-- 활동 지역은 고르지 않고 동네 인증으로 정한다 (GPS) -->
      <UiField label="동네" :hint="form.region ? '누르면 동네를 바꾸거나 다시 인증해요' : '지금 있는 곳으로 인증해요. 내 동네 근처 경기가 보여요'">
        <RouterLink to="/neighborhood" class="flex items-center gap-3 h-12 px-4 rounded-xl bg-surface border border-line">
          <UiIcon name="location-dot" aria-hidden="true" />
          <span class="flex-1 t-body">{{ form.region || '동네 인증하기' }}</span>
          <UiIcon name="chevron-right" class="text-fg-subtle text-sm" aria-hidden="true" />
        </RouterLink>
      </UiField>
      <!-- 나이: 다칠 수 있는 규칙은 만 19세 이상이라 확인한다 -->
      <div id="age">
        <UiInput v-model="form.age" label="나이 (만)" optional type="number" inputmode="numeric" :maxlength="3" placeholder="예: 27" hint="다칠 수 있는 규칙은 만 19세 이상만 할 수 있어요. 다른 사람에게는 보이지 않아요" :error="errors.age" />
      </div>
      <UiInput v-model="form.bio" label="한 줄 소개" optional multiline :rows="3" :maxlength="100" placeholder="예: 주말마다 한강에서 배드민턴 쳐요" />
      <UiInput v-model="form.affiliation" label="소속" optional :maxlength="100" placeholder="예: 성수 러닝크루" />

      <div class="fixed bottom-0 inset-x-0 z-nav bg-canvas border-t border-line pb-safe">
        <div class="max-w-md mx-auto px-4 py-3">
          <UiButton type="submit" block size="lg" :disabled="!dirty" :loading="saving">{{ dirty ? '저장' : '바뀐 내용이 없어요' }}</UiButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
// 프로필 편집: 사진·닉네임·아이디·동네·나이(만 19세 확인용, 남에게 안 보임)·소개·소속. 성별은 받지 않는다 (예전 값은 그대로 둔다)
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/api'
import { UiAvatar, UiButton, UiEmptyState, UiField, UiInput, UiSkeleton, UiTopBar } from '../../components/ui'
import { useToast } from '../../composable/useToast'
import { compressImage, dataUrlToFile } from '../../utils/gamePictureStorage'
import { containsProfanity } from '../../utils/profanity'

const NICKNAME_MAX = 10
const USERNAME_PATTERN = /^[a-z0-9_]{1,12}$/

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()

const loading = ref(true)
const loadError = ref(false)
const saving = ref(false)
// region은 보여 주기만 한다 (동네 인증이 채운다)
const form = reactive({ nickname: '', username: '', bio: '', affiliation: '', region: '', age: '' })
const errors = reactive({ nickname: '', username: '', age: '' })
const fileInput = ref(null)
const preview = ref('')
const photo = ref(null)
const photoState = ref('unchanged') // unchanged | updated | deleted
let original = null // 불러온 값 (바뀐 게 있는지, 나이·성별 유지용)

const dirty = computed(() => {
  if (!original) return false
  return (
    photoState.value !== 'unchanged' ||
    form.nickname !== original.nickname ||
    form.username !== original.username ||
    form.bio !== (original.bio || '') ||
    form.affiliation !== (original.affiliation || '') ||
    String(form.age ?? '') !== String(original.age ?? '')
  )
})

watch(() => form.nickname, () => (errors.nickname = ''))
watch(() => form.age, () => (errors.age = ''))
watch(() => form.username, (v) => {
  errors.username = ''
  if (v !== v.toLowerCase()) form.username = v.toLowerCase()
})

async function onPhoto(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) return showToast('10MB 이하 사진을 골라 주세요')
  const dataUrl = await new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => resolve(null)
    r.readAsDataURL(file)
  })
  if (!dataUrl) return showToast('사진을 읽지 못했어요. 다른 사진을 골라 주세요')
  preview.value = await compressImage(dataUrl)
  photo.value = dataUrlToFile(preview.value, file.name)
  photoState.value = 'updated'
}
function removePhoto() {
  preview.value = ''
  photo.value = null
  photoState.value = 'deleted'
}

async function save() {
  const nick = form.nickname.trim()
  const name = form.username.trim()
  if (!nick || nick.length > NICKNAME_MAX) return (errors.nickname = `닉네임을 1~${NICKNAME_MAX}자로 적어 주세요`)
  if (!USERNAME_PATTERN.test(name)) return (errors.username = '영문 소문자·숫자·밑줄(_)로 12자까지 적어 주세요')
  if (containsProfanity([nick, name, form.bio, form.affiliation].join(' '))) return showToast('쓰면 안 되는 말이 들어 있어요')
  const ageText = String(form.age ?? '').trim()
  if (ageText && !(Number.isInteger(Number(ageText)) && Number(ageText) >= 4 && Number(ageText) <= 120)) return (errors.age = '만 나이를 숫자로 적어 주세요')

  saving.value = true
  try {
    // 아이디·닉네임이 바뀌었으면 먼저 (아이디가 겹치면 여기서 멈춘다)
    if (nick !== original.nickname || name !== original.username) {
      try {
        await api.post('/api/auth/complete', { username: name, nickname: nick })
      } catch (e) {
        if (e.response?.status === 409) errors.username = '이미 누가 쓰는 아이디예요. 다른 걸 적어 주세요'
        else showToast(e.response?.data?.message || '저장하지 못했어요. 잠시 뒤 다시 해 주세요')
        return
      }
    }
    const fd = new FormData()
    fd.append('nickname', nick)
    fd.append('bio', form.bio.trim())
    fd.append('affiliation', form.affiliation.trim())
    // 나이는 비우면 예전 값 그대로, 성별은 화면에서 받지 않으니 예전 값 그대로 보낸다 (지워지지 않게)
    if (ageText) fd.append('age', Number(ageText))
    else if (original.age != null) fd.append('age', original.age)
    if (original.gender) fd.append('gender', original.gender)
    if (photoState.value === 'updated' && photo.value) fd.append('profile_picture', photo.value)
    else if (photoState.value === 'deleted') fd.append('profile_picture', 'null')
    await api.patch('/api/user-profile/save', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    showToast('저장했어요')
    router.replace('/profile/0')
  } catch (e) {
    showToast(e.response?.data?.message || '저장하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const { data } = await api.get('/api/user-profile/my/profile')
    original = data
    form.nickname = data.nickname || ''
    form.username = data.username || ''
    form.bio = data.bio || ''
    form.affiliation = data.affiliation || ''
    form.age = data.age ?? ''
    // 동네는 인증한 지금 동네를 보여 준다 (예전 '지역' 칸이 비어 있으면 인증했어도 '동네 인증하기'로 보였다)
    const mine = await api.get('/api/neighborhoods/me').then((r) => r.data).catch(() => null)
    form.region = mine?.neighborhoods?.find((n) => n.active)?.name || data.region || ''
    preview.value = data.profilePicture && !data.profilePicture.includes('default') ? data.profilePicture : ''
    photoState.value = 'unchanged'
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// #age로 오면('나이를 먼저 넣어 주세요') 나이 칸으로 바로
onMounted(async () => {
  await load()
  if (route.hash === '#age') {
    await nextTick()
    const el = document.getElementById('age')
    el?.scrollIntoView({ block: 'center' })
    el?.querySelector('input')?.focus()
  }
})
</script>
