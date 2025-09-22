<template>
  <section>
    <h1 class="text-xl font-semibold mb-4">Reports</h1>
    
    <!-- 검색/필터 -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <input v-model="reporter" placeholder="신고자 이메일" class="border px-3 py-2 rounded w-48" />
      <select v-model="status" class="border px-3 py-2 rounded">
        <option value="">All Status</option>
        <option value="OPEN">OPEN</option>
        <option value="RESOLVED">RESOLVED</option>
      </select>
      <select v-model="type" class="border px-3 py-2 rounded">
        <option value="">All Types</option>
        <option value="GAME">GAME</option>
        <option value="COMMENT">COMMENT</option>
        <option value="RULE">RULE</option>
      </select>
      <button @click="fetchList(0)" class="px-4 py-2 bg-black text-white rounded">필터</button>
      <button @click="clearFilters" class="px-4 py-2 border rounded">초기화</button>
    </div>

    <!-- 테이블 -->
    <AdminTable
      :columns="columns"
      :data="reports"
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
      <template #type="{ value }">
        <span 
          class="px-2 py-1 text-xs rounded"
          :class="{
            'bg-blue-100 text-blue-800': value === 'GAME',
            'bg-green-100 text-green-800': value === 'COMMENT',
            'bg-purple-100 text-purple-800': value === 'RULE'
          }"
        >
          {{ value }}
        </span>
      </template>
      <template #reason="{ value }">
        <div class="truncate max-w-[300px]" :title="value">
          {{ value }}
        </div>
      </template>
      <template #status="{ value }">
        <span 
          class="px-2 py-1 text-xs rounded"
          :class="{
            'bg-red-100 text-red-800': value === 'OPEN',
            'bg-green-100 text-green-800': value === 'RESOLVED',
            'bg-gray-100 text-gray-800': value === 'DISMISSED'
          }"
        >
          {{ value }}
        </span>
      </template>
      <template #actions="{ item }">
        <div class="flex gap-1">
          <button 
            v-if="item.status === 'OPEN'"
            @click="openResolveModal(item)" 
            class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            해결
          </button>
          <button 
            v-if="item.status === 'OPEN'"
            @click="openDismissModal(item)" 
            class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            무시
          </button>
          <button 
            v-if="['RESOLVED', 'DISMISSED'].includes(item.status)"
            @click="reopenReport(item)" 
            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            재오픈
          </button>
        </div>
      </template>
    </AdminTable>

    <!-- 상세 드로어 -->
    <AdminDrawer
      :is-open="drawerOpen"
      :title="`Report #${selectedReport?.id}`"
      :data="selectedReport"
      @close="closeDrawer"
    >
      <template #default="{ data }">
        <div v-if="data" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">ID</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Type</label>
            <span 
              class="inline-block mt-1 px-2 py-1 text-xs rounded"
              :class="{
                'bg-blue-100 text-blue-800': data.type === 'GAME',
                'bg-green-100 text-green-800': data.type === 'COMMENT',
                'bg-purple-100 text-purple-800': data.type === 'RULE'
              }"
            >
              {{ data.type }}
            </span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Target ID</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.targetId }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Reporter</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.reporterEmail || data.reporterId }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Reason</label>
            <p class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ data.reason }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <span 
              class="inline-block mt-1 px-2 py-1 text-xs rounded"
              :class="data.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'"
            >
              {{ data.status }}
            </span>
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
      :is-open="resolveModalOpen"
      title="신고 해결"
      :message="`신고 #${selectedReport?.id}를 해결 처리하시겠습니까?`"
      confirm-text="해결"
      confirm-button-class="bg-green-600 hover:bg-green-700"
      :show-reason-input="true"
      :loading="actionLoading"
      @close="closeResolveModal"
      @confirm="resolveReport"
    />

    <ConfirmModal
      :is-open="dismissModalOpen"
      title="신고 무시"
      :message="`신고 #${selectedReport?.id}를 무시 처리하시겠습니까?`"
      confirm-text="무시"
      confirm-button-class="bg-gray-600 hover:bg-gray-700"
      :show-reason-input="true"
      :loading="actionLoading"
      @close="closeDismissModal"
      @confirm="dismissReport"
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

const reports = ref([])
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const loading = ref(false)
const status = ref('')
const type = ref('')
const reporter = ref('')
const sortField = ref('id')
const sortDirection = ref('desc')

// 드로어 상태
const drawerOpen = ref(false)
const selectedReport = ref(null)

// 모달 상태
const resolveModalOpen = ref(false)
const dismissModalOpen = ref(false)
const actionLoading = ref(false)

// 컬럼 정의
const columns = ref([
  { key: 'id', label: 'ID', class: 'w-20' },
  { key: 'type', label: 'Type', class: 'w-24' },
  { key: 'targetId', label: 'Target ID', class: 'w-24' },
  { key: 'reporterEmail', label: 'Reporter', class: 'w-48' },
  { key: 'reason', label: 'Reason', class: 'w-80' },
  { key: 'status', label: 'Status', class: 'w-24' },
  { key: 'createdAt', label: 'Created At', class: 'w-40' },
  { key: 'actions', label: 'Actions', class: 'w-32' }
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
    if (type.value) params.type = type.value
    if (reporter.value) params.reporter = reporter.value
    
    const { data } = await api.get('/api/admin/reports', { params })
    reports.value = data.content || []
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

function openDrawer(report) {
  selectedReport.value = report
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  selectedReport.value = null
}

function clearFilters() {
  status.value = ''
  type.value = ''
  reporter.value = ''
  fetchList(0)
}

// 모달 열기/닫기 함수들
function openResolveModal(report) {
  selectedReport.value = report
  resolveModalOpen.value = true
}

function closeResolveModal() {
  resolveModalOpen.value = false
  selectedReport.value = null
}

function openDismissModal(report) {
  selectedReport.value = report
  dismissModalOpen.value = true
}

function closeDismissModal() {
  dismissModalOpen.value = false
  selectedReport.value = null
}

// 관리 액션 함수들
async function resolveReport(data) {
  if (!selectedReport.value || !data.reason) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/reports/${selectedReport.value.id}/resolve`, {
      resolution: data.reason
    })
    closeResolveModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Resolve report failed:', error)
    alert('신고 해결에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function dismissReport(data) {
  if (!selectedReport.value || !data.reason) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/reports/${selectedReport.value.id}/dismiss`, {
      reason: data.reason
    })
    closeDismissModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Dismiss report failed:', error)
    alert('신고 무시에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function reopenReport(report) {
  if (!confirm(`신고 #${report.id}를 재오픈하시겠습니까?`)) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/reports/${report.id}/reopen`)
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Reopen report failed:', error)
    alert('신고 재오픈에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

function downloadCsv() {
  if (!reports.value.length) return
  exportToCsv('reports.csv', reports.value)
}

onMounted(() => fetchList(0))
</script>

<style scoped>
</style>


