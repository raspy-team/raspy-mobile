<template>
  <div
    class="fixed inset-0 z-[30000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="emit('close')"
    aria-modal="true"
    role="dialog"
  >
    <Transition name="fade-scale">
      <div
        class="bg-gray-800 min-h-[70%] w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-gray-700 overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 border-b bg-gray-800 border-gray-700">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white">내 친구 선택</h2>
            <button
              @click="emit('close')"
              class="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          <div class="mt-4 relative">
            <input
              ref="searchRef"
              v-model="q"
              type="text"
              placeholder="닉네임/소개/아이디 검색"
              class="w-full rounded-xl border border-gray-600 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 px-4 py-2.5 text-sm outline-none transition text-white placeholder-gray-400 bg-gray-700"
            />
            <div v-if="filteredFriends.length" class="sr-only">{{ filteredFriends.length }}명</div>
          </div>
        </div>

        <!-- Content -->
        <div class="max-h-[65svh] overflow-y-auto">
          <!-- Loading skeleton -->
          <UiListSkeleton v-if="loading" :rows="6" class="px-6" />

          <!-- Error state -->
          <div v-else-if="error" class="px-6 py-12 text-center">
            <div class="text-gray-400 text-sm">친구 목록을 불러오지 못했어요.</div>
            <button
              @click="fetchFriends"
              class="mt-4 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
            >
              다시 시도
            </button>
          </div>

          <!-- Empty state -->
          <div v-else-if="!filteredFriends.length" class="px-6 py-14 text-center">
            <div class="mx-auto mb-4 grid place-items-center w-16 h-16 rounded-2xl bg-gray-700">
              🧑‍🤝‍🧑
            </div>
            <p class="text-white font-medium mb-1">아직 친구가 없어요</p>
            <p class="text-gray-400 text-sm">상단 검색을 확인하거나, 친구를 먼저 추가해보세요.</p>
          </div>

          <!-- List -->
          <ul v-else class="divide-y divide-gray-700">
            <li
              v-for="f in filteredFriends"
              :key="f.id"
              class="group flex items-center gap-3 py-3 px-6 hover:bg-gray-700 transition cursor-pointer"
              @click="openConfirm(f)"
            >
              <div class="relative">
                <img
                  v-if="f.avatar"
                  :src="f.avatar"
                  alt=""
                  class="w-10 h-10 rounded-full bg-gray-600 object-cover"
                />
                <img
                  v-else
                  :src="Default"
                  alt=""
                  class="w-10 h-10 border border-gray-600 rounded-full bg-gray-600 object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-white truncate">
                  {{ f.nickname || f.username }}
                </div>
                <div class="text-xs text-gray-400 truncate">
                  {{ f.intro || '@' + f.username }}
                </div>
              </div>
              <button
                class="px-3.5 py-2 rounded-lg border border-orange-400 text-orange-400 bg-gray-800 text-sm font-medium group-hover:bg-gray-700 group-active:scale-[.98] transition"
              >
                선택
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>

    <!-- Confirm Bottom Sheet -->
    <Transition name="sheet">
      <div v-if="showConfirm" class="fixed inset-0 z-[31000]" @click.self="closeConfirm">
        <div class="absolute inset-0 bg-black/40"></div>
        <div
          class="absolute bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl shadow-2xl ring-1 ring-gray-700 p-5 pb-6"
        >
          <div class="flex items-center gap-3 mb-3">
            <img
              v-if="selectedFriend?.avatar"
              :src="selectedFriend.avatar"
              alt=""
              class="w-12 h-12 rounded-full object-cover bg-gray-600"
            />
            <img
              v-else
              :src="Default"
              alt=""
              class="w-12 h-12 rounded-full object-cover border border-gray-600 bg-gray-600"
            />
            <div class="min-w-0">
              <p class="text-base font-medium text-white truncate">
                {{ selectedFriend?.nickname || selectedFriend?.username }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ selectedFriend?.intro || '@' + (selectedFriend?.username || '') }}
              </p>
            </div>
          </div>
          <p class="text-sm text-gray-300 leading-relaxed mb-4 py-2">
            <strong>{{ selectedFriend?.nickname || selectedFriend?.username }}</strong> 님과 경기를
            시작하시겠습니까?<br />
            확인을 누르면 <span class="font-medium text-orange-400">경기 진행 화면</span>으로 이동하며, 바로
            <span class="font-medium text-orange-400">"경기 시작"</span>을 누를 수 있어요.
          </p>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="closeConfirm"
              class="h-12 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 active:scale-95 transition"
            >
              아니요
            </button>
            <button
              @click="confirmProceed"
             class="h-12 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 active:scale-95 transition shadow"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { UiListSkeleton } from '../ui'
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits } from 'vue'
import api from '../../api/api'
import Default from '../../assets/default.png'

const emit = defineEmits(['close', 'select'])

const friends = ref([]) // Array<UserSearchResultDto>
const loading = ref(true)
const error = ref(false)
const q = ref('')
const searchRef = ref(null)

const showConfirm = ref(false)
const selectedFriend = ref(null)

function openConfirm(friend) {
  selectedFriend.value = friend
  showConfirm.value = true
}
function closeConfirm() {
  showConfirm.value = false
}
function confirmProceed() {
  if (selectedFriend.value) {
    emit('select', selectedFriend.value)
  }
  showConfirm.value = false
  emit('close')
}

const fetchFriends = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await api.get('/api/friends/my')
    friends.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const filteredFriends = computed(() => {
  const keyword = q.value.trim().toLowerCase()
  if (!keyword) return friends.value
  return friends.value.filter((f) => {
    const nickname = (f.nickname || '').toLowerCase()
    const username = (f.username || '').toLowerCase()
    const intro = (f.intro || '').toLowerCase()
    return nickname.includes(keyword) || username.includes(keyword) || intro.includes(keyword)
  })
})

onMounted(async () => {
  await fetchFriends()
  await nextTick()
  searchRef.value?.focus()

  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      if (showConfirm.value) return closeConfirm()
      emit('close')
    }
    if (e.key === 'Enter' && showConfirm.value) {
      e.preventDefault()
      confirmProceed()
    }
  }
  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 160ms ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
.sheet-enter-active,
.sheet-leave-active {
  transition:
    transform 220ms ease,
    opacity 220ms ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
