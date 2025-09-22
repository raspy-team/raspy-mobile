<template>
  <section>
    <h1 class="text-xl font-semibold mb-4">Users</h1>
    
    <!-- 검색/필터 -->
    <div class="flex gap-2 mb-4">
      <input v-model="query" placeholder="검색(이메일/닉네임)" class="border px-3 py-2 rounded w-80" />
      <select v-model="role" class="border px-3 py-2 rounded">
        <option value="">All Roles</option>
        <option value="ROLE_USER">ROLE_USER</option>
        <option value="ROLE_ADMIN">ROLE_ADMIN</option>
      </select>
      <button @click="fetchList(0)" class="px-4 py-2 bg-black text-white rounded">검색</button>
    </div>

    <!-- 테이블 -->
    <AdminTable
      :columns="columns"
      :data="users"
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
      <template #roles="{ value }">
        <span class="inline-flex gap-1">
          <span 
            v-for="role in value" 
            :key="role"
            class="px-2 py-1 text-xs rounded"
            :class="role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'"
          >
            {{ role }}
          </span>
        </span>
      </template>
      <template #status="{ value }">
        <span 
          class="px-2 py-1 text-xs rounded"
          :class="{
            'bg-green-100 text-green-800': value === 'ACTIVE',
            'bg-red-100 text-red-800': value === 'BANNED',
            'bg-gray-100 text-gray-800': value === 'DELETED'
          }"
        >
          {{ value }}
        </span>
      </template>
      <template #actions="{ item }">
        <div class="flex gap-1">
          <button 
            v-if="item.status === 'ACTIVE'"
            @click="openBanModal(item)" 
            class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            정지
          </button>
          <button 
            v-if="item.status === 'BANNED'"
            @click="unbanUser(item)" 
            class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            해제
          </button>
          <button 
            @click="openRoleModal(item)" 
            class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            역할변경
          </button>
          <button 
            v-if="item.status !== 'DELETED'"
            @click="openDeleteModal(item)" 
            class="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            삭제
          </button>
        </div>
      </template>
    </AdminTable>

    <!-- 상세 드로어 -->
    <AdminDrawer
      :is-open="drawerOpen"
      :title="`User #${selectedUser?.id}`"
      :data="selectedUser"
      @close="closeDrawer"
    >
      <template #default="{ data }">
        <div v-if="data" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">ID</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.email }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nickname</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.nickname }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Roles</label>
            <div class="mt-1 flex gap-2">
              <span 
                v-for="role in data.roles" 
                :key="role"
                class="px-2 py-1 text-xs rounded"
                :class="role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'"
              >
                {{ role }}
              </span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Created At</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.createdAt }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Last Login At</label>
            <p class="mt-1 text-sm text-gray-900">{{ data.lastLoginAt || 'Never' }}</p>
          </div>
        </div>
      </template>
    </AdminDrawer>

    <!-- 확인 모달들 -->
    <ConfirmModal
      :is-open="banModalOpen"
      title="사용자 정지"
      :message="`${selectedUser?.nickname} (${selectedUser?.email}) 사용자를 정지하시겠습니까?`"
      confirm-text="정지"
      confirm-button-class="bg-red-600 hover:bg-red-700"
      :show-reason-input="true"
      :loading="actionLoading"
      @close="closeBanModal"
      @confirm="banUser"
    />

    <ConfirmModal
      :is-open="roleModalOpen"
      title="역할 변경"
      :message="`${selectedUser?.nickname} (${selectedUser?.email}) 사용자의 역할을 변경하시겠습니까?`"
      confirm-text="변경"
      confirm-button-class="bg-blue-600 hover:bg-blue-700"
      :show-role-select="true"
      :loading="actionLoading"
      @close="closeRoleModal"
      @confirm="updateUserRole"
    />

    <ConfirmModal
      :is-open="deleteModalOpen"
      title="사용자 삭제"
      :message="`${selectedUser?.nickname} (${selectedUser?.email}) 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`"
      confirm-text="삭제"
      confirm-button-class="bg-red-600 hover:bg-red-700"
      :loading="actionLoading"
      @close="closeDeleteModal"
      @confirm="deleteUser"
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

const users = ref([])
const page = ref(0)
const size = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const loading = ref(false)
const query = ref('')
const role = ref('')
const sortField = ref('registeredAt')
const sortDirection = ref('desc')

// 드로어 상태
const drawerOpen = ref(false)
const selectedUser = ref(null)

// 모달 상태
const banModalOpen = ref(false)
const roleModalOpen = ref(false)
const deleteModalOpen = ref(false)
const actionLoading = ref(false)

// 컬럼 정의
const columns = ref([
  { key: 'id', label: 'ID', class: 'w-20' },
  { key: 'email', label: 'Email', class: 'w-48' },
  { key: 'nickname', label: 'Nickname', class: 'w-32' },
  { key: 'roles', label: 'Roles', class: 'w-32' },
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
    if (query.value) params.query = query.value
    if (role.value) params.role = role.value
    
    const { data } = await api.get('/api/admin/users', { params })
    users.value = data.content || []
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

function openDrawer(user) {
  selectedUser.value = user
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  selectedUser.value = null
}

// 모달 열기/닫기 함수들
function openBanModal(user) {
  selectedUser.value = user
  banModalOpen.value = true
}

function closeBanModal() {
  banModalOpen.value = false
  selectedUser.value = null
}

function openRoleModal(user) {
  selectedUser.value = user
  roleModalOpen.value = true
}

function closeRoleModal() {
  roleModalOpen.value = false
  selectedUser.value = null
}

function openDeleteModal(user) {
  selectedUser.value = user
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  selectedUser.value = null
}

// 관리 액션 함수들
async function banUser(data) {
  if (!selectedUser.value || !data.reason) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/users/${selectedUser.value.id}/ban`, {
      reason: data.reason
    })
    closeBanModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Ban user failed:', error)
    alert('사용자 정지에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function unbanUser(user) {
  if (!confirm(`${user.nickname} (${user.email}) 사용자의 정지를 해제하시겠습니까?`)) return
  
  actionLoading.value = true
  try {
    await api.post(`/api/admin/users/${user.id}/unban`)
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Unban user failed:', error)
    alert('사용자 정지 해제에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function updateUserRole(data) {
  if (!selectedUser.value || !data.role) return
  
  actionLoading.value = true
  try {
    await api.put(`/api/admin/users/${selectedUser.value.id}/roles`, {
      roles: [data.role]
    })
    closeRoleModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Update user role failed:', error)
    alert('역할 변경에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

async function deleteUser() {
  if (!selectedUser.value) return
  
  actionLoading.value = true
  try {
    await api.delete(`/api/admin/users/${selectedUser.value.id}`)
    closeDeleteModal()
    fetchList(page.value) // 현재 페이지 새로고침
  } catch (error) {
    console.error('Delete user failed:', error)
    alert('사용자 삭제에 실패했습니다.')
  } finally {
    actionLoading.value = false
  }
}

function downloadCsv() {
  if (!users.value.length) return
  exportToCsv('users.csv', users.value)
}

onMounted(() => fetchList(0))
</script>

<style scoped>
</style>


