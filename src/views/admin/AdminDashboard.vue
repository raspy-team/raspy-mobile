<template>
  <section>
    <h1 class="text-xl font-semibold mb-6">대시보드</h1>
    
    <!-- 개요 통계 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">사용자</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600">전체</span>
            <span class="font-semibold">{{ overviewStats?.users?.total || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">활성</span>
            <span class="font-semibold text-green-600">{{ overviewStats?.users?.active || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">정지</span>
            <span class="font-semibold text-red-600">{{ overviewStats?.users?.banned || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">게임</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600">전체</span>
            <span class="font-semibold">{{ overviewStats?.games?.total || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">진행중</span>
            <span class="font-semibold text-blue-600">{{ overviewStats?.games?.active || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">완료</span>
            <span class="font-semibold text-green-600">{{ overviewStats?.games?.completed || 0 }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">신고</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600">전체</span>
            <span class="font-semibold">{{ overviewStats?.reports?.total || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">미처리</span>
            <span class="font-semibold text-red-600">{{ overviewStats?.reports?.open || 0 }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">해결</span>
            <span class="font-semibold text-green-600">{{ overviewStats?.reports?.resolved || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 사용자 활동 분석 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">활성 사용자</h3>
        <div class="text-3xl font-bold text-blue-600">{{ userActivityStats?.activeUsers || 0 }}</div>
        <p class="text-sm text-gray-600 mt-2">최근 30일 내 게임 참여</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">평균 게임 참여</h3>
        <div class="text-3xl font-bold text-green-600">{{ (userActivityStats?.avgGamesPerUser || 0).toFixed(1) }}</div>
        <p class="text-sm text-gray-600 mt-2">사용자당 평균 게임 수</p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">평균 게임 시간</h3>
        <div class="text-3xl font-bold text-purple-600">{{ (userActivityStats?.avgGameDurationMinutes || 0).toFixed(0) }}분</div>
        <p class="text-sm text-gray-600 mt-2">게임 완료까지 평균 시간</p>
      </div>
    </div>

    <!-- 차트 섹션 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 일별 트렌드 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">일별 트렌드 (최근 7일)</h3>
        <div class="h-64">
          <canvas ref="trendChart"></canvas>
        </div>
      </div>
      
      <!-- 게임 상태 분포 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">게임 상태 분포</h3>
        <div class="h-64">
          <canvas ref="gameStatusChart"></canvas>
        </div>
      </div>
    </div>

    <!-- 신고 통계 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 신고 상태 분포 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">신고 상태 분포</h3>
        <div class="h-64">
          <canvas ref="reportStatusChart"></canvas>
        </div>
      </div>
      
      <!-- 신고 타입 분포 -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-medium text-gray-900 mb-4">신고 타입 분포</h3>
        <div class="h-64">
          <canvas ref="reportTypeChart"></canvas>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import api from '../../api/api'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const overviewStats = ref(null)
const userActivityStats = ref(null)
const gameEcosystemStats = ref(null)
const trendData = ref([])
const gameStatusData = ref([])
const reportStatusData = ref([])
const reportTypeData = ref([])

const trendChart = ref(null)
const gameStatusChart = ref(null)
const reportStatusChart = ref(null)
const reportTypeChart = ref(null)

let chartInstances = []

async function fetchOverviewStats() {
  try {
    const { data } = await api.get('/api/admin/stats/overview')
    overviewStats.value = data
  } catch (error) {
    console.error('Failed to fetch overview stats:', error)
  }
}

async function fetchTrendData() {
  try {
    const { data } = await api.get('/api/admin/stats/users/trend?days=7')
    trendData.value = data
  } catch (error) {
    console.error('Failed to fetch trend data:', error)
  }
}

async function fetchGameStatusStats() {
  try {
    const { data } = await api.get('/api/admin/stats/games/status')
    gameStatusData.value = data
  } catch (error) {
    console.error('Failed to fetch game status stats:', error)
  }
}

async function fetchReportStatusStats() {
  try {
    const { data } = await api.get('/api/admin/stats/reports/status')
    reportStatusData.value = data
  } catch (error) {
    console.error('Failed to fetch report status stats:', error)
  }
}

async function fetchReportTypeStats() {
  try {
    const { data } = await api.get('/api/admin/stats/reports/type')
    reportTypeData.value = data
  } catch (error) {
    console.error('Failed to fetch report type stats:', error)
  }
}

async function fetchUserActivityStats() {
  try {
    const { data } = await api.get('/api/admin/stats/users/activity')
    userActivityStats.value = data
  } catch (error) {
    console.error('Failed to fetch user activity stats:', error)
  }
}

async function fetchGameEcosystemStats() {
  try {
    const { data } = await api.get('/api/admin/stats/games/ecosystem')
    gameEcosystemStats.value = data
  } catch (error) {
    console.error('Failed to fetch game ecosystem stats:', error)
  }
}

function createTrendChart() {
  if (!trendChart.value || !trendData.value.length) return
  
  const ctx = trendChart.value.getContext('2d')
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trendData.value.map(d => d.date),
      datasets: [
        {
          label: '신규 사용자',
          data: trendData.value.map(d => d.newUsers),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        },
        {
          label: '신규 게임',
          data: trendData.value.map(d => d.newGames),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: '신규 신고',
          data: trendData.value.map(d => d.newReports),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
  chartInstances.push(chart)
}

function createGameStatusChart() {
  if (!gameStatusChart.value || !gameStatusData.value.length) return
  
  const ctx = gameStatusChart.value.getContext('2d')
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: gameStatusData.value.map(d => d.status),
      datasets: [{
        data: gameStatusData.value.map(d => d.count),
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
  chartInstances.push(chart)
}

function createReportStatusChart() {
  if (!reportStatusChart.value || !reportStatusData.value.length) return
  
  const ctx = reportStatusChart.value.getContext('2d')
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: reportStatusData.value.map(d => d.status),
      datasets: [{
        data: reportStatusData.value.map(d => d.count),
        backgroundColor: [
          'rgb(239, 68, 68)',
          'rgb(16, 185, 129)',
          'rgb(107, 114, 128)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  })
  chartInstances.push(chart)
}

function createReportTypeChart() {
  if (!reportTypeChart.value || !reportTypeData.value.length) return
  
  const ctx = reportTypeChart.value.getContext('2d')
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: reportTypeData.value.map(d => d.status),
      datasets: [{
        label: '신고 수',
        data: reportTypeData.value.map(d => d.count),
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
  chartInstances.push(chart)
}

async function initializeDashboard() {
  await Promise.all([
    fetchOverviewStats(),
    fetchUserActivityStats(),
    fetchGameEcosystemStats(),
    fetchTrendData(),
    fetchGameStatusStats(),
    fetchReportStatusStats(),
    fetchReportTypeStats()
  ])
  
  // 차트 생성
  setTimeout(() => {
    createTrendChart()
    createGameStatusChart()
    createReportStatusChart()
    createReportTypeChart()
  }, 100)
}

onMounted(() => {
  initializeDashboard()
})

onUnmounted(() => {
  chartInstances.forEach(chart => chart.destroy())
})
</script>

<style scoped>
</style>
