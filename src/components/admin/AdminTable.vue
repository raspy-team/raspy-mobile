<template>
  <div>
    <!-- 컬럼 토글 버튼 -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-2">
        <button @click="toggleColumnSelector" class="px-3 py-2 border rounded text-sm">
          컬럼 선택 ({{ visibleColumns.length }}/{{ allColumns.length }})
        </button>
        <div v-if="showColumnSelector" class="absolute z-10 bg-white border rounded shadow-lg p-2 mt-10">
          <div v-for="col in allColumns" :key="col.key" class="flex items-center gap-2 py-1">
            <input 
              :id="col.key" 
              type="checkbox" 
              :checked="visibleColumns.includes(col.key)"
              @change="toggleColumn(col.key)"
              class="rounded"
            />
            <label :for="col.key" class="text-sm cursor-pointer">{{ col.label }}</label>
          </div>
        </div>
      </div>
      <button @click="$emit('export')" class="px-3 py-2 border rounded">CSV 내보내기</button>
    </div>

    <!-- 테이블 -->
    <div class="overflow-auto border rounded">
      <table class="min-w-[960px] w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th 
              v-for="col in visibleColumns" 
              :key="col.key"
              class="text-left p-2 cursor-pointer hover:bg-gray-200 select-none"
              @click="handleSort(col.key)"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <span v-if="sortField === col.key" class="text-xs">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="getRowKey(item, index)" class="border-t hover:bg-gray-50">
            <td 
              v-for="col in visibleColumns" 
              :key="col.key"
              class="p-2"
              :class="col.class"
            >
              <slot :name="col.key" :item="item" :value="getNestedValue(item, col.key)">
                {{ getNestedValue(item, col.key) }}
              </slot>
            </td>
          </tr>
          <tr v-if="!loading && data.length === 0">
            <td :colspan="visibleColumns.length" class="p-6 text-center text-gray-500">
              데이터가 없습니다
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <div class="flex items-center justify-between mt-4">
      <div class="flex items-center gap-2">
        <button 
          :disabled="page === 0" 
          @click="$emit('page-change', page - 1)" 
          class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        <span class="text-sm">Page {{ page + 1 }} / {{ totalPages }}</span>
        <button 
          :disabled="page + 1 >= totalPages" 
          @click="$emit('page-change', page + 1)" 
          class="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div class="text-sm text-gray-600">
        총 {{ totalElements }}개 항목
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  page: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 1
  },
  totalElements: {
    type: Number,
    default: 0
  },
  sortField: {
    type: String,
    default: ''
  },
  sortDirection: {
    type: String,
    default: 'desc'
  },
  rowKey: {
    type: [String, Function],
    default: 'id'
  }
})

const emit = defineEmits(['sort-change', 'page-change', 'export'])

const showColumnSelector = ref(false)
const visibleColumns = ref(props.columns.map(col => col.key))

const allColumns = computed(() => props.columns)

function toggleColumnSelector() {
  showColumnSelector.value = !showColumnSelector.value
}

function toggleColumn(columnKey) {
  const index = visibleColumns.value.indexOf(columnKey)
  if (index > -1) {
    visibleColumns.value.splice(index, 1)
  } else {
    visibleColumns.value.push(columnKey)
  }
}

function handleSort(field) {
  let direction = 'desc'
  if (props.sortField === field && props.sortDirection === 'desc') {
    direction = 'asc'
  }
  emit('sort-change', { field, direction })
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? ''
}

function getRowKey(item, index) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(item)
  }
  return getNestedValue(item, props.rowKey) || index
}

// 컬럼 변경 시 기본 컬럼 재설정
watch(() => props.columns, (newColumns) => {
  visibleColumns.value = newColumns.map(col => col.key)
}, { immediate: true })

// 외부 클릭 시 컬럼 선택기 닫기
document.addEventListener('click', (e) => {
  if (!e.target.closest('.column-selector')) {
    showColumnSelector.value = false
  }
})
</script>

<style scoped>
.column-selector {
  position: relative;
}
</style>
