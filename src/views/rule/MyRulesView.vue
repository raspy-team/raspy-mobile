<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar title="내 규칙" back="/rules">
      <template #right>
        <UiIconButton icon="fas fa-plus" label="규칙 만들기" @click="router.push('/rules/create')" />
      </template>
    </UiTopBar>

    <main class="max-w-2xl mx-auto px-4 pb-16">
      <div v-if="loading" class="divide-y divide-line">
        <div v-for="n in 3" :key="n" class="flex gap-4 py-4">
          <UiSkeleton class="w-16 h-16 rounded-xl" />
          <div class="flex-1 space-y-2 pt-1">
            <UiSkeleton class="h-4 w-1/2" />
            <UiSkeleton class="h-3 w-1/3" />
          </div>
        </div>
      </div>

      <UiEmptyState v-else-if="!rules.length" class="pt-16" mascot="match" title="아직 만든 규칙이 없어요" description="우리끼리 하던 놀이도 규칙이 되면 정식 종목이에요">
        <UiButton to="/rules/create">규칙 만들기</UiButton>
      </UiEmptyState>

      <div v-else class="divide-y divide-line ui-appear">
        <div v-for="rule in rules" :key="rule.id">
          <RuleListCard :rule="rule" />
          <!-- 수정 요청 상태: 있을 때만 -->
          <div v-if="rule.editRequestStatus === 'PENDING'" class="flex items-center gap-2 pb-4 -mt-1">
            <UiBadge>수정 요청 확인 중</UiBadge>
            <div class="flex-1"></div>
            <UiButton size="sm" variant="ghost" :loading="cancelingId === rule.id" @click="cancelEdit(rule)">요청 취소</UiButton>
          </div>
          <div v-else-if="rule.editRequestStatus === 'REJECTED'" class="pb-4 -mt-1">
            <div class="flex items-center gap-2">
              <UiBadge tone="danger">수정 요청 거절</UiBadge>
              <div class="flex-1"></div>
              <UiButton size="sm" variant="ghost" :to="`/rules/edit/${rule.id}`">다시 요청</UiButton>
            </div>
            <p v-if="rule.rejectionReason" class="t-caption mt-2">{{ rule.rejectionReason }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// 내가 만든 규칙. 수정 요청 상태는 해당 규칙 아래에만 보인다
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../api/api'
import RuleListCard from '../../components/rule/RuleListCard.vue'
import { UiBadge, UiButton, UiEmptyState, UiIconButton, UiSkeleton, UiTopBar } from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composable/useToast'

const router = useRouter()
const { showToast } = useToast()
const rules = ref([])
const loading = ref(true)
const cancelingId = ref(null)

async function load() {
  try {
    rules.value = (await api.get('/api/rules/my-rules')).data
  } catch {
    showToast('규칙을 불러오지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    loading.value = false
  }
}

async function cancelEdit(rule) {
  if (!(await confirmDialog({ title: '수정 요청을 취소할까요?', message: '규칙은 지금 모습 그대로 남아요', confirmText: '요청 취소' }))) return
  cancelingId.value = rule.id
  try {
    await api.post(`/api/rules/edit-requests/${rule.editRequestId}/cancel`)
    showToast('수정 요청을 취소했어요')
    await load()
  } catch (e) {
    showToast(e.response?.data?.message || '취소하지 못했어요')
  } finally {
    cancelingId.value = null
  }
}

onMounted(load)
</script>
