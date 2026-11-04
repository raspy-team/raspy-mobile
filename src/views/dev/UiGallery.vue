<template>
  <UiTopBar title="UI 부품" back="/">
    <template #right>
      <UiIconButton icon="fas fa-bell" label="알림" :badge="3" />
    </template>
  </UiTopBar>

  <main class="px-4 pb-32 pt-4 space-y-10">
    <UiSection title="종목 아이콘">
      <div class="grid grid-cols-4 gap-2">
        <div v-for="n in sportNames" :key="n" class="rounded-xl bg-surface flex flex-col items-center gap-2 py-3">
          <CategoryIcon :name="n" size="28px" />
          <span class="t-micro truncate max-w-full px-1">{{ n }}</span>
        </div>
      </div>
    </UiSection>

    <UiSection title="글자 역할">
      <div class="space-y-2">
        <p class="t-display">21 : 18</p>
        <p class="t-title">화면 제목</p>
        <p class="t-heading">섹션·카드 제목</p>
        <p class="t-body">본문 글자예요. 한 줄에 너무 많이 쓰지 않아요.</p>
        <p class="t-label">입력칸 이름</p>
        <p class="t-caption">보조 설명</p>
        <p class="t-micro">3분 전 · 신청자 2명</p>
      </div>
    </UiSection>

    <UiSection title="버튼">
      <div class="space-y-3">
        <UiButton block size="lg">경기 만들기</UiButton>
        <div class="flex gap-2">
          <UiButton variant="secondary" icon="fas fa-paper-plane">메시지</UiButton>
          <UiButton variant="ghost">취소</UiButton>
          <UiButton variant="danger" icon="fas fa-trash">삭제</UiButton>
        </div>
        <div class="flex gap-2">
          <UiButton size="sm">신청</UiButton>
          <UiButton size="sm" variant="secondary">신청 취소</UiButton>
          <UiButton size="sm" loading>저장 중</UiButton>
          <UiButton size="sm" disabled>막힘</UiButton>
        </div>
      </div>
    </UiSection>

    <UiSection title="입력">
      <div class="space-y-4">
        <UiInput v-model="text" label="규칙 이름" placeholder="예: 탁구 11점 3판 2선승" hint="20자까지" />
        <UiInput v-model="text2" label="아이디" icon="fas fa-user" error="이미 사용 중인 아이디예요" />
        <UiInput v-model="text3" label="자기소개" optional multiline placeholder="한두 줄이면 충분해요" />
        <div class="grid grid-cols-2 gap-2">
          <UiSelect v-model="r1" :options="['서울', '경기', '부산']" placeholder="시·도" />
          <UiSelect v-model="r2" :options="['관악구', '동작구']" placeholder="구·시·군" :disabled="!r1" />
        </div>
      </div>
    </UiSection>

    <UiSection title="칩 · 배지 · 탭">
      <div class="flex flex-wrap gap-2">
        <UiChip v-for="c in ['기존 스포츠', '두뇌', '신체', '기타']" :key="c" :selected="chip === c" @click="chip = c">{{ c }}</UiChip>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <UiBadge>매칭 중</UiBadge>
        <UiBadge tone="primary">신청 2명</UiBadge>
        <UiBadge tone="success" icon="fas fa-check">확정</UiBadge>
        <UiBadge tone="danger">신고됨</UiBadge>
      </div>
      <div class="mt-4">
        <UiTabs v-model="tab" :options="[{ value: 'all', label: '전체' }, { value: 'mine', label: '내가 연', count: 2 }, { value: 'sent', label: '신청한' }]" />
      </div>
    </UiSection>

    <UiSection title="아바타">
      <div class="flex items-end gap-3">
        <UiAvatar size="xs" name="엉뚱한 물결" />
        <UiAvatar size="sm" name="Koh" />
        <UiAvatar size="md" name="침착한 물개" src="/broken.png" />
        <UiAvatar size="lg" name="수줍은 바람" />
        <UiAvatar size="xl" name="매치" />
      </div>
    </UiSection>

    <UiSection title="카드 · 목록">
      <template #action><UiButton size="sm" variant="ghost">전체 보기</UiButton></template>
      <UiCard interactive>
        <div class="flex items-center justify-between">
          <span class="t-heading">탁구 11점 3판 2선승</span>
          <UiBadge tone="primary">신청 2명</UiBadge>
        </div>
        <p class="t-caption mt-1">서울 관악구 · 11월 2일 저녁 7시</p>
      </UiCard>
      <div class="mt-3">
        <UiList>
          <UiListItem icon="fas fa-bell" title="알림" subtitle="경기·신청·댓글" chevron />
          <UiListItem icon="fas fa-shield-halved" title="차단한 사람" chevron />
          <UiListItem icon="fas fa-right-from-bracket" title="로그아웃" danger />
        </UiList>
      </div>
    </UiSection>

    <UiSection title="빈 상태 · 불러오는 중">
      <UiCard>
        <UiEmptyState icon="fas fa-calendar" title="아직 잡힌 경기가 없어요" description="모집 중인 경기에 신청하거나 직접 만들어 보세요">
          <UiButton>경기 찾기</UiButton>
        </UiEmptyState>
      </UiCard>
      <div class="mt-3 flex items-center gap-3">
        <UiSkeleton class="w-10 h-10 rounded-full" />
        <div class="flex-1 space-y-2">
          <UiSkeleton class="h-4 w-1/2" />
          <UiSkeleton class="h-3 w-1/3" />
        </div>
      </div>
    </UiSection>

    <UiSection title="시트 · 확인 창">
      <div class="flex gap-2">
        <UiButton variant="secondary" @click="sheet = true">시트 열기</UiButton>
        <UiButton variant="danger" @click="askDelete">삭제 확인</UiButton>
      </div>
      <p class="t-micro mt-2">{{ answer }}</p>
    </UiSection>
  </main>

  <UiSheet v-model="sheet" title="신청자 2명">
    <UiList>
      <UiListItem title="엉뚱한 물결" subtitle="1500점 · 3승 1패">
        <template #leading><UiAvatar size="sm" name="엉뚱한 물결" /></template>
        <template #trailing><UiButton size="sm">승인</UiButton></template>
      </UiListItem>
      <UiListItem title="침착한 물개" subtitle="1480점 · 1승 2패">
        <template #leading><UiAvatar size="sm" name="침착한 물개" /></template>
        <template #trailing><UiButton size="sm">승인</UiButton></template>
      </UiListItem>
    </UiList>
  </UiSheet>
</template>

<script setup>
// 개발할 때만 열리는 부품 모음 (/dev/ui). 새 부품을 만들면 여기에도 하나 놓는다
import { ref } from 'vue'
import CategoryIcon from '../../components/rule/CategoryIcon.vue'
import { SPORT_NAMES } from '../../components/rule/sportIcons'
const sportNames = [...SPORT_NAMES]
import {
  UiAvatar, UiBadge, UiButton, UiCard, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem,
  UiSection, UiSelect, UiSheet, UiSkeleton, UiTabs, UiTopBar,
} from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'

const text = ref('')
const text2 = ref('koh')
const text3 = ref('')
const r1 = ref('')
const r2 = ref('')
const chip = ref('두뇌')
const tab = ref('all')
const sheet = ref(false)
const answer = ref('')

async function askDelete() {
  const ok = await confirmDialog({ title: '경기를 삭제할까요?', message: '신청한 사람들에게도 사라져요.', confirmText: '삭제', danger: true })
  answer.value = ok ? '삭제를 눌렀어요' : '취소했어요'
}
</script>
