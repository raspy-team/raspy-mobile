<template>
  <!-- 결과 밖으로 보내기 (docs/feed-media.md 2겹): 링크(미리보기 그림이 펼쳐진다) · 스토리 그림 · 글자 격자 -->
  <UiSheet :model-value="!!post" title="결과 보내기" @update:model-value="close">
    <UiList>
      <UiListItem icon="fas fa-link" title="링크 보내기" subtitle="카톡·메시지에 붙이면 경기 그림이 펼쳐져요" @click="sendLink" />
      <UiListItem icon="images" title="스토리에 올릴 그림" :subtitle="saving ? '그림을 만드는 중…' : '세로 그림 한 장을 저장해요'" @click="saveStory" />
      <UiListItem icon="file-lines" title="글자로 복사" subtitle="X·단톡방에 붙여 넣는 몇 줄. 이름은 넣지 않아요" @click="copyGrid" />
    </UiList>
    <pre v-if="post" class="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-sm whitespace-pre-line font-sans tabular-nums text-fg-muted">{{ grid }}</pre>
  </UiSheet>
</template>

<script setup lang="ts">
// 공유 주소는 matchapp.me/m/{경기}. Vercel이 서버로 넘겨 경기마다 미리보기 그림을 낸다 (raspy-api share/)
// ?s= 는 어디로 보냈는지. 받은 사람이 '나도 한 판'을 누르면 유입 꼬리표(utm_source)가 되어 관리자 > 유입에 잡힌다
import { computed, ref } from 'vue'
import { UiList, UiListItem, UiSheet } from '../../ui'
import { copyText } from '../../../utils/clipboard'
import { useToast } from '../../../composable/useToast'

const props = defineProps<{
  /** 소식의 경기 한 장. null이면 닫힘 */
  post: any | null
  /** 보내는 사람 (선수면 그 사람 기준으로 세트 칸을 칠한다) */
  myId?: number | null
}>()
const emit = defineEmits(['close'])
const { showToast } = useToast()
const saving = ref(false)

const link = (s: string) => `${location.origin}/m/${props.post?.id}?s=${s}`
const close = () => emit('close')

// 워들처럼: 칸 하나가 세트 하나, 볼트 칸은 보내는 사람(선수가 아니면 이긴 사람)이 이긴 세트
const grid = computed(() => {
  const p = props.post
  if (!p) return ''
  const lines = [`매치 · ${p.rule?.ruleTitle || p.appDuel?.title || ''}`]
  const story = p.story
  if (p.appDuel) {
    const [a, b] = p.appDuel.scores || []
    const fmt = (v: number | null) => (v == null ? '-' : Number.isInteger(v) ? v : v.toFixed(1))
    lines.push(`${fmt(a)}${p.appDuel.scoreUnit || ''} : ${fmt(b)}${p.appDuel.scoreUnit || ''}`)
  } else {
    const r = p.result || {}
    const players = p.players || []
    const mine = props.myId != null ? players.findIndex((x: any) => x.id === props.myId) : -1
    // 팀 경기는 선수 목록이 [앞 팀..., 뒤 팀...]
    const half = r.sideNames?.length === 2 ? players.length / 2 : 1
    const mySide = mine < 0 ? null : mine < half ? 0 : 1
    const winSide = r.winner == null ? null : r.sideNames ? r.sideNames.indexOf(r.winner) : players.findIndex((x: any) => x.name === r.winner)
    const side = mySide ?? (winSide != null && winSide >= 0 ? winSide : 0)
    const sets = r.setScores || []
    if (sets.length > 1) {
      const cells = sets.map((s: any) => ((side === 0 ? s.scoreA > s.scoreB : s.scoreB > s.scoreA) ? '🟨' : '⬛')).join('')
      lines.push(`${cells} ${side === 0 ? `${r.scoreA}:${r.scoreB}` : `${r.scoreB}:${r.scoreA}`}`)
    } else if (sets.length === 1) {
      const s = sets[0]
      lines.push(side === 0 ? `${s.scoreA}:${s.scoreB}` : `${s.scoreB}:${s.scoreA}`)
    }
  }
  // 이야기 줄은 이름이 들어가지 않은 사실 줄만 (beats 중 첫 줄)
  const beat = story?.beats?.map((b: any) => (typeof b === 'string' ? b : b?.text)).find((b: string) => b && !(p.players || []).some((x: any) => x.name && b.includes(x.name)))
  if (beat) lines.push(`⚡ ${beat}`)
  lines.push(link('x').replace(/^https?:\/\//, ''))
  return lines.join('\n')
})

async function sendLink() {
  const url = link('link')
  if (navigator.share) {
    try {
      await navigator.share({ url })
      return close()
    } catch (e: any) {
      if (e?.name === 'AbortError') return
    }
  }
  showToast((await copyText(url)) ? '링크를 복사했어요' : '복사하지 못했어요')
  close()
}

async function saveStory() {
  const id = props.post?.id
  if (!id || saving.value) return
  saving.value = true
  try {
    const res = await fetch(`/m/${id}/story.png`)
    if (!res.ok) throw new Error()
    const file = new File([await res.blob()], `match-${id}.png`, { type: 'image/png' })
    // 폰은 공유 시트로 넘겨 바로 인스타 스토리에 올리게 한다. 안 되면 내려받기
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return close()
      } catch (e: any) {
        if (e?.name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    showToast('그림을 저장했어요')
    close()
  } catch {
    showToast('그림을 만들지 못했어요')
  } finally {
    saving.value = false
  }
}

async function copyGrid() {
  showToast((await copyText(grid.value)) ? '복사했어요. 붙여 넣으세요' : '복사하지 못했어요')
  close()
}
</script>
