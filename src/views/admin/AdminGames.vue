<template>
  <section>
    <h1 class="text-xl font-semibold mb-4">Games</h1>
    
    <!-- 검색/필터 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <input v-model="query" placeholder="게임 제목 검색" class="border px-3 py-2 rounded w-48" />
      <input v-model="creator" placeholder="생성자 이메일" class="border px-3 py-2 rounded w-48" />
      <select v-model="status" class="border px-3 py-2 rounded">
        <option value="">All Status</option>
        <option value="MATCHING">MATCHING</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>
      <button @click="fetchList(0)" class="px-4 py-2 bg-black text-white rounded">필터</button>
      <button @click="clearFilters" class="px-4 py-2 border rounded">초기화</button>
    </div>

    <!-- 테이블 -->
    <AdminTable
      :columns="columns"
      :data="games"
      :loading="loading"
      :page="page"
      :total-pages="totalPages"
      :total-elements="totalElements"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      @sort-change="handleSort"
      @page-change="fetchList"
      @export="downloadCsv"
    >
      <template #id="{ item }">
        <button 
          @click="openDrawer(item)" 
          class="text-blue-600 hover:underline cursor-pointer"
        >
          {{ item.id }}
        </button>
      </template>
      <template #title="{ value }">
        <div class="truncate max-w-[200px]" :title="value">
          {{ value }}
        </div>
      </template>
      <template #status="{ value }">
        <span 
          class="px-2 py-1 text-xs rounded"
          :class="{
            'bg-blue-100 text-blue-800': value === 'MATCHING',
            'bg-yellow-100 text-yellow-800': value === 'IN_PROGRESS',
            'bg-green-100 text-green-800': value === 'COMPLETED',
            'bg-red-100 text-red-800': value === 'CANCELLED'
          }"
        >
          {{ value }}
        </span>
      </template>
      <template #actions="{ item }">
        <div class="flex gap-1">
          <button 
            v-if="!item.isHidden"
            @click="openHideModal(item)" 
            class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
          >
            숨김
          </button>
          <button 
            v-if="item.isHidden"
            @click="showGame(item)" 
            class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            노출
          </button>
          <button 
            v-if="item.status === 'IN_PROGRESS'"
            @click="forceCompleteGame(item)" 
            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            강제완료
          </button>
          <button 
            v-if="['MATCHING', 'SCHEDULED', 'IN_PROGRESS'].includes(item.status)"
            @click="cancelGame(item)" 
            class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >
            취소
          </button>
          <button 
            v-if="item.status !== 'DELETED'"
            @click="openDeleteModal(item)" 
            class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            삭제
          </button>
        </div>
      </template>
    </AdminTable>

    <!-- 상세 드로어 -->
    <AdminDrawer
      :is-open="drawerOpen"
      :title="`Game #${selectedGame?.id}`"
      :data="selectedGame"
      @close="closeDrawer"
    >
      <template #default="{ data }">
        <div v-if="data" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">ID</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Title</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.title }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <span 
              class="inline-block mt-1 px-2 py-1 text-xs rounded"
              :class="{
                'bg-blue-100 text-blue-800': data.status === 'MATCHING',
                'bg-yellow-100 text-yellow-800': data.status === 'IN_PROGRESS',
                'bg-green-100 text-green-800': data.status === 'COMPLETED',
                'bg-red-100 text-red-800': data.status === 'CANCELLED'
              }"
            >
              {{ data.status }}
            </span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Participants</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.participants }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Report Count</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.reportCount || 0 }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Created At</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.createdAt }}</p>
          </div>
        </div>
      </template>
    </AdminDrawer>

    <!-- 확인 모달들 -->
    <ConfirmModal
      :is-open="hideModalOpen"
      title="게임 숨김"
      :message="`${selectedGame?.title} 게임을 숨기시겠습니까?`"
      confirm-text="숨김"
      confirm-button-class="bg-orange-600 hover:bg-orange-700"
      :show-reason-input="true"
      :loading="actionLoading"
      @close="closeHideModal"
      @confirm="hideGame"
    />

    <ConfirmModal
      :is-open="deleteModalOpen"
      title="게임 삭제"
      :message="`${selectedGame?.title} 게임을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`"
      confirm-text="삭제"
      confirm-button-class="bg-red-600 hover:bg-red-700"
      :loading="actionLoading"
      @close="closeDeleteModal"
      @confirm="deleteGame"
    />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/api'
import { exportToCsv } from '../../utils/csv'
import AdminTable from '../../components/admin/AdminTable.vue'
import AdminDrawer from '../../components/admin/AdminDrawer.vue'
import ConfirmModal from '../../components/admin/ConfirmModal.vue'

const games = ref([])
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const loading = ref(false)
const status = ref('')
const query = ref('')
const creator = ref('')
const sortField = ref('createdAt')
const sortDirection = ref('desc')

// 드로어 상태
const drawerOpen = ref(false)
const selectedGame = ref(null)

// 모달 상태
const hideModalOpen = ref(false)
const deleteModalOpen = ref(false)
const actionLoading = ref(false)

// 컬럼 정의
const columns = ref([
  { key: 'id', label: 'ID', class: 'w-20' },
  { key: 'title', label: 'Title', class: 'w-64' },
  { key: 'status', label: 'Status', class: 'w-32' },
  { key: 'participants', label: 'Participants', class: 'w-24' },
  { key: 'reportCount', label: 'Reports', class: 'w-20' },
  { key: 'createdAt', label: 'Created At', class: 'w-40' },
  { key: 'actions', label: 'Actions', class: 'w-40' }
])

async function fetchList(nextPage = 0) {
  loading.value = true
  try {
    const params = { 
      page: nextPage, 
      size: size.value,
      sort: `${sortField.value},${sortDirection.value}`
    }
    if (status.value) params.status = status.value
    if (query.value) params.query = query.value
    if (creator.value) params.creator = creator.value
    
    const { data } = await api.get('/api/admin/games', { params })
    games.value = data.content || []
    page.value = data.page || 0
    totalPages.value = data.totalPages || 1
    totalElements.value = data.totalElements || 0
  } finally {
    loading.value = false
  }
}

function handleSort({ field, direction }) {
  sortField.value = field
  sortDirection.value = direction
  fetchList(0)
}

function openDrawer(game) {
  selectedGame.value = game
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  selectedGame.value = null
}

function clearFilters() {
  status.value = ''
  query.value = ''
  creator.value = ''
  fetchList(0)
}

// 모달 열기/닫기 함수들
function openHideModal(game) {
  selectedGame.value = game
  hideModalOpen.value = true
}

function closeHideModal() {
  hideModalOpen.value = false
  selectedGame.value = null
}

function openDeleteModal(game) {
  selectedGame.value = game
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  selectedGame.value = null
}

// 관리 액션 함수들
async function hideGame(data) {
  if (!selectedGame.value || !data.reason) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/games/${selectedGame.value.id}/hide`, {
      reason: data.reason
    })
    closeHideModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Hide game failed:', error)
    alert('게임 숨김에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function showGame(game) {
  if (!confirm(`${game.title} 게임을 노출하시겠습니까?`)) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/games/${game.id}/show`)
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Show game failed:', error)
    alert('게임 노출에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function forceCompleteGame(game) {
  if (!confirm(`${game.title} 게임을 강제 완료하시겠습니까?`)) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/games/${game.id}/force-complete`)
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Force complete game failed:', error)
    alert('게임 강제 완료에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function cancelGame(game) {
  if (!confirm(`${game.title} 게임을 취소하시겠습니까?`)) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/games/${game.id}/cancel`)
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Cancel game failed:', error)
    alert('게임 취소에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function deleteGame() {
  if (!selectedGame.value) return
  
  actionLoading.value = true
  try {
    await api.delete(`/api/admin/games/${selectedGame.value.id}`)
    closeDeleteModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Delete game failed:', error)
    alert('게임 삭제에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

function downloadCsv() {
  if (!games.value.length) return
  exportToCsv('games.csv', games.value)
}

onMounted(() => fetchList(0))
</script>

<style scoped>
</style>


