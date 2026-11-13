<template>
  <div class="min-h-dvh bg-canvas">
    <UiTopBar :title="isMeRoute ? '내 정보' : ''" :back="!isMeRoute">
      <template #right>
        <template v-if="isMeRoute">
          <!-- 탭마다 위 오른쪽은 메시지·알림으로 같게, 내 정보만 설정을 더한다. 돋보기는 '찾기' 탭이 쓰므로 사람 찾기는 친구 시트로 (11/3) -->
          <InboxButtons />
          <UiIconButton icon="fas fa-gear" label="설정" @click="router.push('/settings')" />
        </template>
        <!-- AI 주민은 친구·신고·차단이 없다 (docs/ai-residents.md). 순위의 '(나)' 줄처럼 내 id로 들어와도 나를 신고·차단하는 메뉴는 두지 않는다 -->
        <UiIconButton v-else-if="user && !user.isBot && !user.isMe" icon="fas fa-ellipsis" label="더보기" @click="menuOpen = true" />
      </template>
    </UiTopBar>

    <!-- 불러오는 중: 실제 화면과 같은 모양 -->
    <main v-if="loading" class="max-w-2xl mx-auto px-4 pt-6" role="status" aria-label="프로필 불러오는 중">
      <div class="flex items-center gap-4">
        <UiSkeleton class="w-20 h-20 rounded-full flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <UiSkeleton class="h-6 w-1/2" />
          <UiSkeleton class="h-4 w-1/3" />
        </div>
      </div>
      <UiSkeleton class="h-4 w-3/4 mt-5" />
      <UiSkeleton class="h-16 w-full mt-6 rounded-xl" />
      <UiSkeleton class="h-11 w-full mt-4 rounded-xl" />
      <UiListSkeleton :rows="3" shape="tile" class="mt-8" />
    </main>

    <main v-else-if="loadError" class="max-w-2xl mx-auto px-4 pt-16">
      <!-- 서버가 이유를 말했으면(차단·없음·탈퇴) 그 말만, 연결 오류면 다시 불러오기 -->
      <UiEmptyState icon="fas fa-user-slash" :title="loadError" :description="loadFailed ? '잠시 뒤 다시 해 주세요' : ''">
        <UiButton v-if="loadFailed" variant="secondary" @click="reload">다시 시도</UiButton>
        <!-- 링크로 바로 열어 돌아갈 기록이 없으면 홈으로 (목적 판정 6: 눌러도 아무 일이 없었다) -->
        <UiButton v-else variant="secondary" @click="goBack">돌아가기</UiButton>
      </UiEmptyState>
    </main>

    <main v-else class="max-w-2xl mx-auto px-4 pt-6 pb-32 ui-appear">
      <!-- AI 주민: 맨 위에 한 줄 (docs/ai-residents.md 'AI 표시') -->
      <p v-if="user.isBot" class="t-caption mb-4 flex items-center gap-1.5"><UiAiBadge class="!ml-0" />AI 주민 · 매치가 만든 연습 상대예요</p>
      <!-- 누구인지 -->
      <div class="flex items-center gap-4">
        <!-- 꾸민 캐릭터가 있으면 그 캐릭터가 얼굴이다 (11/13 실제 기기 한 바퀴: 꾸며도 광장 말고는 보이는 데가 없었다). 직접 꾸민 것이라 사진보다 앞 -->
        <div v-if="user.character" class="w-20 h-20 shrink-0 rounded-full bg-surface-2 flex items-end justify-center overflow-hidden" role="img" :aria-label="`${user.nickname}의 캐릭터`">
          <div class="profile-char" :style="{ backgroundImage: `url(${API_BASE_URL}/api/plaza/art/avatar/${user.character}.png)` }" />
        </div>
        <UiAvatar v-else :src="user.avatar" :name="user.nickname" size="xl" class="!w-20 !h-20" />
        <div class="flex-1 min-w-0">
          <h1 class="t-title flex items-center min-w-0"><span class="truncate">{{ user.nickname }}</span><UiAiBadge v-if="user.isBot" /></h1>
          <p class="t-caption truncate mt-0.5">@{{ user.username }}</p>
          <!-- 동네 (당근의 '합정동 · 동네 인증'). 인증이 지났으면 표시를 뺀다. AI 주민은 사람이 인증한 동네가 아니라 '동네 인증'을 달지 않는다 -->
          <p v-if="user.dong" class="t-caption truncate mt-0.5 flex items-center gap-1">
            <UiIcon name="location-dot" class="text-xs" aria-hidden="true" />{{ user.dong.name }}<span v-if="user.dong.verified && !user.isBot" class="text-fg-subtle">· 동네 인증</span>
          </p>
          <!-- 소속: 공개 범위대로 서버가 골라 보낸다. 증명서로 인증한 곳만 ✓ (11/13: 골라도 어디에도 안 보였다) -->
          <p v-if="user.orgs?.length" class="t-caption truncate mt-0.5 flex items-center gap-1">
            <UiIcon name="building" class="text-xs" aria-hidden="true" />{{ user.orgs.map((o) => `${o.name}${o.verified ? ' ✓' : ''}`).join(' · ') }}
          </p>
          <p v-if="subline" class="t-caption truncate mt-0.5">{{ subline }}</p>
          <!-- 예전에 직접 적은 소속 (인증 소속 ✓과 다르다): 흐리게 -->
          <p v-if="user.affiliation?.trim()" class="t-caption text-fg-subtle truncate mt-0.5">{{ user.affiliation }}</p>
        </div>
      </div>
      <p v-if="user.intro" class="t-body text-fg-muted mt-4 whitespace-pre-line break-words">{{ user.intro }}</p>

      <!-- 주 행동: 누구인지 바로 아래 (연락처 앱처럼) -->
      <div class="flex gap-2 mt-5">
        <template v-if="user.isMe">
          <UiButton block variant="secondary" icon="fas fa-pen" to="/set-profile">프로필 편집</UiButton>
        </template>
        <!-- AI 주민: 친구·메시지 대신 주 앱 게임으로 바로 한 판 -->
        <template v-else-if="user.isBot">
          <UiButton v-if="aiGame" block icon="fas fa-gamepad" :to="aiGame">앱 게임 한 판</UiButton>
        </template>
        <template v-else>
          <UiButton v-if="friend.received" class="flex-1" :loading="busy" @click="friendAction('accept')">친구 수락</UiButton>
          <UiButton v-if="friend.received" class="flex-1" variant="secondary" :disabled="busy" @click="friendAction('reject')">거절</UiButton>
          <UiButton v-else-if="friend.sent" class="flex-1" variant="secondary" :loading="busy" @click="friendAction('cancel')">친구 요청 취소</UiButton>
          <!-- 흰 버튼은 '한 판 붙자' 하나: 둘 다 희면 무엇을 누를지 몰랐다 (11/13 실제 기기 한 바퀴) -->
          <UiButton v-else-if="!friend.isFriend" class="flex-1" variant="secondary" icon="fas fa-user-plus" :loading="busy" @click="friendAction('request')">친구 추가</UiButton>
          <UiButton v-else class="flex-1" variant="secondary" icon="fas fa-user-check" @click="menuOpen = true">친구</UiButton>
          <UiButton class="flex-1" variant="secondary" icon="far fa-paper-plane" :to="`/chat/${user.id}`">메시지</UiButton>
        </template>
      </div>
      <!-- 한 판 붙자 (11/13 도전 하나로): 사람에게 보내는 길은 링크와 여기 프로필 -->
      <UiButton v-if="!user.isMe && !user.isBot" block class="mt-2" icon="fas fa-gamepad" @click="oneGameOpen = true">한 판 붙자</UiButton>
      <OneGameSheet v-if="!user.isMe && !user.isBot" v-model="oneGameOpen" :user-id="user.id" :name="user.nickname" :rules="user.top3Rules" />
      <!-- 내 규칙: 홈 첫 화면에서 옮겨 왔다 (목적 판정 11/11 4번). 동호회는 뺐다 (11/13 앱 기능 좁히기: 카톡이 더 잘한다) -->
      <!-- 꾸미기도 여기서: 광장(밤 10~11시)으로만 갈 수 있어 하루 23시간은 해낸 일로 얻은 꾸미기를 쓸 길이 없었다 (11/13 실제 기기 한 바퀴) -->
      <div v-if="user.isMe" class="mt-2 grid grid-cols-2 gap-2">
        <UiButton block variant="ghost" size="sm" icon="book-open" to="/rules/my-rules">내 규칙</UiButton>
        <UiButton block variant="ghost" size="sm" icon="shirt" to="/plaza/avatar">꾸미기</UiButton>
      </div>

      <!-- 숫자 한 줄: 상자 없이, 승률은 경기가 있을 때만 -->
      <div class="mt-5 flex text-center">
        <!-- 경기·승률은 누르면 기록 화면. 기록을 '나만'으로 둔 사람은 서버가 숫자를 비워 보낸다 -->
        <div v-if="user.recordsHidden" class="flex-1">
          <p class="t-heading text-fg-subtle">–</p>
          <p class="t-micro mt-0.5">경기</p>
        </div>
        <!-- 앱 게임만 한 사람은 '0 경기'인데 아래에 '내 게임 기록 7등급'이 나와 앞뒤가 맞지 않았다(내 모습을 보러 온 사람의 정체성 동기).
             겨룬 경기가 없고 게임 기록이 있으면 그 수를 보인다 (11/11 목적 다시 보기) -->
        <RouterLink v-else-if="!stats.totalGames && bests.length" :to="`/profile/${user.id}/stats`" class="flex-1">
          <p class="t-heading tabular-nums">{{ bests.length }}</p>
          <p class="t-micro mt-0.5">게임 기록 <UiIcon name="fas fa-chevron-right" class="text-[10px]" aria-hidden="true" /></p>
        </RouterLink>
        <RouterLink v-else :to="`/profile/${user.id}/stats`" class="flex-1">
          <p class="t-heading tabular-nums">{{ stats.totalGames || 0 }}</p>
          <p class="t-micro mt-0.5">경기 <UiIcon name="fas fa-chevron-right" class="text-[10px]" aria-hidden="true" /></p>
        </RouterLink>
        <RouterLink v-if="stats.totalGames" :to="`/profile/${user.id}/stats`" class="flex-1">
          <p class="t-heading tabular-nums">{{ stats.winRate }}%</p>
          <p class="t-micro mt-0.5">승률 <UiIcon name="fas fa-chevron-right" class="text-[10px]" aria-hidden="true" /></p>
        </RouterLink>
        <!-- 0이면 숨긴다 (가진 자리가 있을 때만 숫자) -->
        <div v-if="seatLines.length" class="flex-1">
          <p class="t-heading tabular-nums">{{ seatLines.length }}</p>
          <p class="t-micro mt-0.5">챔피언</p>
        </div>
        <!-- AI 주민은 친구가 없다 (docs/ai-residents.md '채우지 않는 곳': 친구) -->
        <button v-if="!user.isBot" type="button" class="flex-1" @click="openFriends">
          <p class="t-heading tabular-nums">{{ stats.friends || 0 }}</p>
          <p class="t-micro mt-0.5">친구 <UiIcon name="fas fa-chevron-right" class="text-[10px]" aria-hidden="true" /></p>
        </button>
      </div>

      <!-- 신뢰 온도. 근거·설명은 눌러서 연다 (점진적 공개). 포인트 타일은 뺐다 (11/13 앱 기능 좁히기: 포인트를 없앴다) -->
      <div v-if="user.trust && !user.isBot" class="mt-3">
        <TrustCard :trust="user.trust" :user-id="user.id" :is-me="user.isMe" />
      </div>
      <LiveRecordLine :key="`lr${user.id}`" class="mt-2" :user-id="user.id" />

      <!-- 가진 자리: 규칙 챔피언(벨트)과 능력·종합·기록 1위. 동네·소속을 가린 사람은 '동네'·'소속'으로 온다 (docs/organizations.md 3-4) -->
      <section v-if="seatLines.length" class="mt-10">
        <h2 class="t-heading mb-3">챔피언</h2>
        <div class="flex flex-wrap gap-2">
          <component
            :is="l.to ? 'RouterLink' : 'span'"
            v-for="l in seatLines"
            :key="l.key"
            :to="l.to"
            class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-line-strong text-fg text-sm"
          >
            <UiIcon name="crown" class="text-signal-fg" />{{ l.title }}
          </component>
        </div>
      </section>

      <!-- 많이 한 능력 (규칙의 '잘하려면'을 판 수로 센다). 그 사람을 보여 주는 글이라 누르지 않는다:
           남의 '순발력'을 보다 그 능력 규칙 목록으로 갈 사람이 없다 (목적 판정 6, 경로 제거) -->
      <section v-if="abilities.length" class="mt-10">
        <h2 class="t-heading mb-3">많이 쓴 능력</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="a in abilities" :key="a.key" class="t-label rounded-full bg-surface-2 px-3 py-1.5">
            {{ a.label }}<span class="text-fg-subtle ml-1">{{ a.games }}판</span>
          </span>
        </div>
      </section>

      <!-- 인기 게임 티어 (롤·브롤 공식 정보). 아이디는 안 보이고, 기록을 '나만'으로 둔 사람은 서버가 비워 보낸다 (9번) -->
      <section v-if="gameTiers.length" class="mt-10">
        <h2 class="t-heading mb-3">게임 티어</h2>
        <div class="flex flex-wrap gap-2">
          <UiChip v-for="t in gameTiers" :key="t.game" @click="openTierGame(t)">
            {{ t.label }}<span class="text-fg-subtle">{{ t.tier }}</span>
          </UiChip>
        </div>
      </section>

      <!-- 앱 게임 기록 (가입하며 옮긴 손님 판 포함): "시작하면 이 등급이 내 기록에 남아요"의 그 기록. 예전엔 막 가입한 사람이 '아직 한 경기가 없어요'를 봤다 (목적 판정 11/11) -->
      <section v-if="bests.length" class="mt-10">
        <!-- 남의 프로필엔 '내'가 붙지 않게 (경로 6 리뷰 P1) -->
        <h2 class="t-heading mb-1">{{ user.isMe ? '내 게임 기록' : '게임 기록' }}</h2>
        <UiList>
          <UiListItem v-for="b in bests" :key="b.key" :title="b.title" chevron @click="router.push(`/play/${b.key}`)">
            <template #leading><RuleThumb :rule="{ ruleTitle: b.title, appGameKey: b.key }" :size="36" bare /></template>
            <template #trailing><span class="t-heading tabular-nums">{{ b.line }}</span></template>
          </UiListItem>
        </UiList>
      </section>

      <!-- 많이 한 규칙 -->
      <!-- 남의 프로필에서 빈 칸은 그리지 않는다: 위 '경기 0'이 이미 말한다 (11/13 실제 기기 한 바퀴) -->
      <section v-if="user.top3Rules?.length || (!bests.length && (user.isMe || user.recordsHidden))" class="mt-10">
        <div class="flex items-center justify-between mb-1">
          <h2 class="t-heading">많이 한 규칙</h2>
          <UiButton v-if="stats.totalGames" size="sm" variant="secondary" icon="fas fa-chart-simple" :to="`/profile/${user.id}/stats`">기록 보기</UiButton>
        </div>
        <UiList v-if="user.top3Rules?.length">
          <UiListItem
            v-for="r in user.top3Rules"
            :key="r.ruleId"
            :title="r.ruleTitle"
            :subtitle="`경기 ${r.playCount}번`"
            chevron
            @click="router.push(`/rules/${r.ruleId}`)"
          >
            <template #leading>
              <RuleThumb :rule="r" :size="36" bare />
            </template>
            <template #trailing>
              <!-- 그 게임의 실력 점수. 순위는 뺐다: 견주고 싶으면 남의 프로필에서 점수를 본다 (11/13 숫자 정리) -->
              <span class="t-heading tabular-nums">{{ r.rating }}점</span>
            </template>
          </UiListItem>
        </UiList>
        <UiEmptyState v-else-if="user.recordsHidden" icon="eye-slash" title="기록을 공개하지 않았어요" />
        <UiEmptyState
          v-else
          mascot="match"
          title="아직 한 경기가 없어요"
        >
          <UiButton v-if="user.isMe" to="/">경기 찾기</UiButton>
        </UiEmptyState>
      </section>

      <!-- 최근 경기 -->
      <section v-if="user.recentGames?.length" class="mt-10">
        <div class="flex items-center justify-between mb-1">
          <h2 class="t-heading">최근 경기</h2>
          <UiButton size="sm" variant="ghost" class="-mr-2" :to="`/feed?userId=${user.id}`">모두 보기</UiButton>
        </div>
        <UiList>
          <UiListItem
            v-for="g in user.recentGames"
            :key="g.gameId"
            :ref="(el) => setGameRef(el, g.gameId)"
            :title="g.ruleTitle"
            :subtitle="`${g.players > 2 && !g.teams ? `${g.players}명 중 ${g.place}등` : `vs ${g.opponentNickname}`} · ${matchTime(g.playedAt)}`"
            :class="{ 'bg-surface-2': highlightId === g.gameId }"
            chevron
            @click="router.push(g.appGameKey ? `/play/${g.appGameKey}?duel=${g.gameId}` : `/games/${g.gameId}/result`)"
          >
            <template #leading>
              <span class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 t-label" :class="RESULT[resultKey(g.result)].class">
                {{ RESULT[resultKey(g.result)].label }}
              </span>
            </template>
            <template #trailing>
              <span v-if="g.myScore || g.opponentScore" class="t-heading tabular-nums">{{ g.myScore }}:{{ g.opponentScore }}</span>
            </template>
          </UiListItem>
        </UiList>
      </section>
    </main>

    <!-- 더보기 (남의 프로필) -->
    <UiSheet v-model="menuOpen">
      <UiList>
        <UiListItem v-if="friend.isFriend" icon="fas fa-user-minus" title="친구 끊기" @click="unfriend" />
        <UiListItem icon="far fa-flag" title="신고" @click="openReport" />
        <UiListItem icon="fas fa-ban" title="차단" subtitle="서로 메시지·신청·도전을 할 수 없어요" danger @click="block" />
      </UiList>
    </UiSheet>

    <!-- 신고 -->
    <UiSheet v-model="reportOpen" :title="`${user?.nickname || ''}님을 신고할까요?`">
      <p class="t-caption mb-4">어떤 문제인지 알려 주시면 <strong class="text-fg">운영진이 바로 확인하고 처리해요.</strong></p>
      <div class="flex flex-wrap gap-2 mb-4">
        <UiChip v-for="r in REPORT_REASONS" :key="r" :selected="reportReason === r" @click="reportReason = r">{{ r }}</UiChip>
      </div>
      <UiInput v-if="reportReason === '기타'" v-model="reportDetail" multiline :rows="3" placeholder="자세히 적어 주세요" />
      <template #footer>
        <UiButton block variant="danger" :disabled="!reportReason || (reportReason === '기타' && !reportDetail.trim())" :loading="reporting" @click="submitReport">신고</UiButton>
      </template>
    </UiSheet>

    <!-- 친구 목록 -->
    <UiSheet v-model="friendsOpen" :title="`친구 ${stats.friends || 0}명`">
      <UiButton v-if="user?.isMe" block variant="secondary" icon="user-plus" class="mb-3" @click="friendsOpen = false; showSearch = true">사람 찾기</UiButton>
      <UiListSkeleton v-if="friendsLoading" :rows="4" />
      <UiList v-else-if="friends.length">
        <UiListItem
          v-for="f in friends"
          :key="f.id"
          :title="f.nickname"
          :subtitle="`@${f.username}`"
          chevron
          @click="goFriend(f.id)"
        >
          <template #leading><UiAvatar :src="f.avatar" :name="f.nickname" :user-id="f.id" size="sm" /></template>
        </UiListItem>
      </UiList>
      <UiEmptyState v-else-if="friendsFailed" icon="fas fa-wifi" title="친구 목록을 불러오지 못했어요">
        <UiButton variant="secondary" @click="openFriends">다시 시도</UiButton>
      </UiEmptyState>
      <UiEmptyState v-else mascot="match" title="아직 친구가 없어요" />
    </UiSheet>

    <UserSearchModal v-if="showSearch" @close="showSearch = false" />
  </div>
</template>

<script setup>
import { API_BASE_URL } from '@/config/server'
import RuleThumb from '../../components/rule/RuleThumb.vue'
import OneGameSheet from '../../components/game/OneGameSheet.vue'
import TrustCard from '../../components/profile/TrustCard.vue'
import LiveRecordLine from '../../components/live/LiveRecordLine.vue'
// 프로필 (/profile/0 = 나, /profile/:id = 다른 사람)
// 누구인지(동네) → 숫자 한 줄 → 주 행동(나: 편집 / 남: 친구·메시지) → 챔피언 → 많이 쓴 능력 → 많이 한 규칙 → 최근 경기
// 신고·차단·친구 끊기는 더보기 안에. 빈 값(나이·성별·지역 없음)은 보여주지 않는다
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GET } from '@/api/client'
import api from '../../api/api'
import UserSearchModal from '../../components/profile/UserSearchModal.vue'
import InboxButtons from '../../components/inbox/InboxButtons.vue'
import {
  UiAiBadge, UiAvatar, UiButton, UiChip, UiEmptyState, UiIconButton, UiInput, UiList, UiListItem, UiListSkeleton,
  UiSheet, UiSkeleton, UiTopBar,
} from '../../components/ui'
import { confirmDialog } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import { matchTime } from '../../utils/format'
import { liveRoute } from '@/utils/battle'

// 사람 신고: 처음 보는 사람을 만나는 앱이라 성희롱·불쾌한 요구가 맨 위 가까이에 있어야 한다 (11/4 밤샘, ReportSheet 기본 목록과 맞춤)
const REPORT_REASONS = ['욕설·비방', '성희롱·불쾌한 요구', '노쇼·비매너', '사칭·사기', '만 14세 미만 같아요', '기타']
const RESULT = {
  win: { label: '승', class: 'bg-fg text-canvas' },
  lose: { label: '패', class: 'border border-line-strong text-fg-subtle' },
  draw: { label: '무', class: 'bg-surface-2 text-fg-muted' },
}
const resultKey = (r) => (r === 'win' ? 'win' : r === 'lose' || r === 'loss' ? 'lose' : 'draw')

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const isMeRoute = route.params.id === '0'
const user = ref(null)
const loading = ref(true)
const loadError = ref('')
const loadFailed = ref(false) // 서버가 이유를 말하지 않은 실패 (연결·서버 오류)
// 다시 시도는 페이지를 통째로 새로 열지 않고 이 화면만 다시 불러온다 (경로 6 리뷰)
const reload = () => {
  loading.value = true
  loadFailed.value = false
  loadError.value = ''
  load()
}
const friend = ref({ sent: false, isFriend: false, received: false })
const busy = ref(false)
const menuOpen = ref(false)
const oneGameOpen = ref(false)
const reportOpen = ref(false)
const reportReason = ref('')
const reportDetail = ref('')
const reporting = ref(false)
const friendsOpen = ref(false)
const friendsLoading = ref(false)
const friends = ref([])
const showSearch = ref(false)
const highlightId = ref(Number(route.query.id) || null)
const gameRefs = {}

const stats = computed(() => user.value?.stats || {})
// 지역·소속 중 있는 것만 한 줄로
// 동네가 있으면 예전 활동 지역(시·구)은 겹치니 뺀다
// 나이·성별은 본인이 '모두'로 열었을 때만 서버가 보낸다 (설정 > 내 정보 공개)
const subline = computed(() => {
  const u = user.value
  if (!u) return ''
  const age = u.age != null ? `만 ${u.age}세` : ''
  const gender = u.gender && u.gender !== '비공개' ? u.gender : ''
  return [gender, age, u.dong ? '' : u.location].filter((v) => v && v.trim()).join(' · ')
})

function setGameRef(el, id) {
  if (el) gameRefs[id] = el.$el || el
}

// AI 주민의 '앱 게임 한 판': 주 앱 게임(첫째)의 실시간 화면으로, ?ai=로 그 주민을 바로 부른다
const aiGame = computed(() => {
  const key = user.value?.isBot && user.value.aiAppGames?.[0]
  return key ? `${liveRoute(key)}?ai=${user.value.id}` : ''
})

async function loadFriendStatus() {
  if (!user.value || user.value.isMe || user.value.isBot) return
  friend.value = (await api.get(`/api/friends/status/${user.value.id}`).catch(() => ({ data: friend.value }))).data
}

const FRIEND_ACTIONS = {
  request: { call: (id) => api.post(`/api/friends/request/${id}`), done: '친구 요청을 보냈어요' },
  cancel: { call: (id) => api.delete(`/api/friends/cancel/${id}`), done: '요청을 취소했어요' },
  accept: { call: (id) => api.post(`/api/friends/accept/${id}`), done: '이제 친구예요' },
  reject: { call: (id) => api.post(`/api/friends/reject/${id}`), done: '요청을 거절했어요' },
}
function bumpFriends(d) {
  if (user.value?.stats && typeof user.value.stats.friends === 'number') user.value.stats.friends = Math.max(0, user.value.stats.friends + d)
}

async function friendAction(kind) {
  busy.value = true
  try {
    await FRIEND_ACTIONS[kind].call(user.value.id)
    showToast(FRIEND_ACTIONS[kind].done)
    // 친구 수가 바뀌는 건 수락뿐: 숫자 줄도 맞춘다 (예전엔 '이제 친구예요'인데 친구 0이 그대로였다)
    if (kind === 'accept') bumpFriends(1)
    await loadFriendStatus()
  } catch (e) {
    showToast(e.response?.data?.message || '처리하지 못했어요. 잠시 뒤 다시 해 주세요')
  } finally {
    busy.value = false
  }
}

async function unfriend() {
  menuOpen.value = false
  if (!(await confirmDialog({ title: '친구를 끊을까요?', message: `${user.value.nickname}님에게 알리지 않아요`, confirmText: '친구 끊기', danger: true }))) return
  try {
    await api.delete(`/api/friends/${user.value.id}`)
    showToast('친구를 끊었어요')
    bumpFriends(-1)
    await loadFriendStatus()
  } catch {
    showToast('처리하지 못했어요. 잠시 뒤 다시 해 주세요')
  }
}

async function block() {
  menuOpen.value = false
  if (!(await confirmDialog({ title: `${user.value.nickname}님을 차단할까요?`, message: '서로 메시지·신청·도전을 할 수 없고 프로필도 보이지 않아요. 설정에서 풀 수 있어요', confirmText: '차단', danger: true }))) return
  try {
    await api.post(`/api/block/${user.value.id}`)
    showToast('차단했어요')
    // 차단하고 나면 보던 곳(소식·채팅)으로 돌아간다. 예전엔 내 프로필이 갑자기 떴다 (목적 판정 6)
    goBack()
  } catch (e) {
    showToast(e.response?.data?.message || '차단하지 못했어요')
  }
}

function openReport() {
  menuOpen.value = false
  reportReason.value = ''
  reportDetail.value = ''
  reportOpen.value = true
}
async function submitReport() {
  reporting.value = true
  try {
    const reason = reportReason.value === '기타' ? reportDetail.value.trim() : reportReason.value
    const { data: done } = await api.post('/api/reports', { targetType: 'USER', targetId: user.value.id, reason })
    showToast(done?.message || '신고가 접수됐어요. 운영진이 바로 확인하고 처리해요')
    reportOpen.value = false
  } catch (e) {
    // 서버가 이유를 주면 그대로 (이미 신고했으면 서버가 그렇게 알려 준다). 연결 오류를 '이미 신고했어요'로 보이지 않게
    showToast(e.response?.data?.message || '신고하지 못했어요. 다시 해 주세요')
    // 연결 오류면 고른 사유·쓴 글을 버리지 않고 시트를 연 채로 둔다 (경로 6 리뷰 P7)
    if (e.response?.data?.message) reportOpen.value = false
  } finally {
    reporting.value = false
  }
}

// 뒤로 갈 앱 안 기록이 없으면(링크로 바로 열었으면) 홈으로
function goBack() {
  if (window.history.state?.back) router.back()
  else router.replace('/')
}

// 'LoL 골드'를 누른 사람은 "이 게임으로 붙자": 그 게임 규칙이 하나면 그 규칙(경기 만들기가 있는 곳)으로 바로,
// 여럿이면 그 게임 규칙 목록으로 (목적 판정 6)
async function openTierGame(t) {
  try {
    const { data } = await api.get('/api/rules/list', { params: { kind: 'POPULAR', search: t.label, withApp: false } })
    if (Array.isArray(data) && data.length === 1) return router.push(`/rules/${data[0].id}`)
  } catch { /* 목록으로 */ }
  router.push({ path: '/rules', query: { kind: 'POPULAR', q: t.label } })
}

const friendsFailed = ref(false)
async function openFriends() {
  friendsOpen.value = true
  friendsLoading.value = true
  friendsFailed.value = false
  try {
    friends.value = (await api.get('/api/friends/my', { params: { userId: user.value.id } })).data
  } catch {
    // 실패를 '친구 없음'으로 보이면 친구가 사라진 줄 안다 (목적 판정 6)
    friends.value = []
    friendsFailed.value = true
  } finally {
    friendsLoading.value = false
  }
}
function goFriend(id) {
  friendsOpen.value = false
  router.push('/profile/' + id)
}

const abilities = ref([])
const gameTiers = ref([])

// 앱 게임 최고 기록 (기록 화면과 같은 자료). 임기응변은 서버가 준 등급으로 (경로 6 리뷰 P2)
const bests = ref([])
async function loadBests(id) {
  const { data } = await GET('/api/user-profile/{userId}/stats', { path: { userId: id } }).catch(() => ({ data: null }))
  bests.value = (data?.bests ?? []).slice(0, 3).map((b) => ({ key: b.key, title: b.title, line: b.grade ? `${b.grade}등급` : `${Math.round(b.score)}${b.scoreUnit || '점'}` }))
}

// 가진 챔피언 자리(벨트). 1위 왕관은 뺐다: "누가 최고인가"는 챔피언 하나로 말한다 (11/13 숫자 정리)
const seats = ref({ belts: [], crowns: [] })
const seatLines = computed(() =>
  seats.value.belts.map((b) => ({ key: `b${b.ruleId}${b.seatLabel}`, title: b.title, to: b.appGameKey ? `/play/${b.appGameKey}` : `/rules/${b.ruleId}` })),
)

onMounted(() => load())
async function load() {
  try {
    user.value = (await api.get(`/api/user-profile/${route.params.id}`)).data
  } catch (e) {
    loadFailed.value = !e.response?.data?.message
    loadError.value = e.response?.data?.message || '프로필을 불러오지 못했어요'
  } finally {
    loading.value = false
  }
  // 프로필 다음 것들은 서로 기다릴 까닭이 없다: 한꺼번에 부른다 (예전엔 하나씩 기다려 열 때마다 네 번 기다렸다, 11/11 쌓이는 피로 전수표)
  const uid = user.value?.id
  await Promise.all([
    loadFriendStatus(),
    uid && GET('/api/champions/users/{userId}', { path: { userId: uid } }).catch(() => ({ data: null })).then((r) => (seats.value = r.data ?? { belts: [], crowns: [] })),
    uid && loadBests(uid),
    // 많이 쓴 능력 (없어도 화면은 그대로)
    uid && GET('/api/rules/top-played-abilities/{userId}', { path: { userId: uid } }).catch(() => ({ data: [] })).then((r) => (abilities.value = r.data)),
    uid && GET('/api/users/{userId}/game-tiers', { path: { userId: uid } }).catch(() => ({ data: [] })).then((r) => (gameTiers.value = r.data || [])),
  ])
  // 경기 결과를 보내고 넘어온 경우(?id=경기) 그 경기를 보여준다
  if (highlightId.value) {
    await nextTick()
    gameRefs[highlightId.value]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => (highlightId.value = null), 2000)
  }
}
</script>

<style scoped>
/* 광장 캐릭터 한 칸(16×32)을 3배로, 앞을 보고 선 모습 (2줄 18칸) */
.profile-char { width: 48px; height: 96px; margin-bottom: -18px; background-size: 2688px 288px; background-position: -864px -192px; image-rendering: pixelated; }
</style>
