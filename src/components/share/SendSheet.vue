<template>
  <!-- 보내기 시트 (11/14 고병연: 스포티파이 공유 기능 수준으로). 예전엔 기기의 공유 창을 그대로 열었고, 공유 창이 없는
       앱 안 브라우저(인스타·에타·카톡)에서는 말없이 '링크 복사'가 됐다. 이제 위는 무엇이 가는지, 아래는 어디로 보낼지를 우리가 펼친다.
       가장 많이 가는 곳이 맨 앞이다: 카카오톡 → 인스타 스토리 → 메시지 → 링크 복사 → QR(옆에 있는 친구) → 그림 저장 → 더보기 -->
  <UiSheet :model-value="sendSheet.open" :title="req?.title || '보내기'" @update:model-value="(v) => !v && closeSendSheet()">
    <template v-if="req">
      <!-- QR: 옆에 있는 친구가 카메라로 찍는다 (말로만 알리던 길) -->
      <div v-if="qr" class="flex flex-col items-center">
        <img :src="qr" alt="이 링크의 QR 코드" class="w-56 h-56 rounded-2xl bg-white p-3" />
        <p class="t-body mt-4 text-center break-keep">친구가 카메라로 찍으면 바로 열려요</p>
        <UiButton variant="ghost" class="mt-2" @click="qr = ''">다른 곳으로 보내기</UiButton>
      </div>
      <template v-else>
        <!-- 무엇이 가나 -->
        <div class="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <img v-if="preview" :src="preview" alt="" class="w-16 aspect-[9/16] rounded-lg object-cover flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="t-body text-fg break-keep line-clamp-3">{{ req.text }}</p>
            <p class="t-micro mt-1 truncate">{{ host }}</p>
          </div>
        </div>
        <!-- 어디로 -->
        <div class="mt-5 grid grid-cols-4 gap-x-2 gap-y-4">
          <button v-for="d in dests" :key="d.key" type="button" class="flex flex-col items-center gap-2 min-w-0" @click="go(d.key)">
            <span class="w-14 h-14 rounded-full flex items-center justify-center" :class="d.tone" :style="d.style">
              <UiSpinner v-if="busy === d.key" />
              <UiIcon v-else :name="d.icon" class="text-xl" aria-hidden="true" />
            </span>
            <span class="t-micro text-fg text-center leading-tight break-keep">{{ d.label }}</span>
          </button>
        </div>
      </template>
    </template>
  </UiSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UiButton, UiIcon, UiSheet, UiSpinner } from '../ui'
import { sendSheet, closeSendSheet } from '../../stores/sendSheet'
import { copyText } from '../../utils/clipboard'
import { useToast } from '../../composables/useToast'
import { kakaoShare, kakaoShareAvailable, warmKakaoShare } from '../../utils/kakaoShare'
import { shareFiles, isPhone } from '../../utils/storyShare'
import { track } from '../../utils/trackLog'

type Key = 'kakao' | 'story' | 'sms' | 'copy' | 'qr' | 'save' | 'more'
const { showToast } = useToast()
const req = computed(() => sendSheet.req)
const busy = ref<Key | ''>('')
const qr = ref('')
const preview = ref('')
const host = computed(() => { try { return new URL(req.value?.url || location.href).host } catch { return 'matchapp.me' } })

watch(() => sendSheet.open, (open) => {
  qr.value = ''
  busy.value = ''
  if (preview.value) { URL.revokeObjectURL(preview.value); preview.value = '' }
  if (!open) return
  if (req.value?.file) preview.value = URL.createObjectURL(req.value.file)
  warmKakaoShare()
})

const dests = computed(() => {
  const r = req.value
  if (!r) return []
  const base = 'bg-surface-3 text-fg'
  const all: { key: Key; icon: string; label: string; tone: string; style?: string; on: boolean }[] = [
    // 카카오 버튼 색 규칙: 노란 바탕 #FEE500, 검정 85%
    { key: 'kakao', icon: 'comment', label: '카카오톡', tone: '', style: 'background:#FEE500;color:rgba(0,0,0,.85)', on: kakaoShareAvailable },
    { key: 'story', icon: 'instagram', label: '인스타 스토리', tone: 'bg-signal text-signal-on', on: !!r.onStory },
    { key: 'sms', icon: 'sms', label: '메시지', tone: base, on: isPhone },
    { key: 'copy', icon: 'link', label: '링크 복사', tone: base, on: true },
    { key: 'qr', icon: 'qrcode', label: 'QR로 보여 주기', tone: base, on: true },
    { key: 'save', icon: 'download', label: '그림 저장', tone: base, on: !!r.file },
    { key: 'more', icon: 'ellipsis', label: '더보기', tone: base, on: typeof navigator.share === 'function' },
  ]
  return all.filter((d) => d.on)
})

function sent(key: Key) {
  track('share_sent', { value: `${key}${req.value?.place ? `;${req.value.place}` : ''}` })
  closeSendSheet(key)
}
// 어디로 보냈는지 주소에 남긴다 (관리자 > 유입의 꼬리표가 된다). 이미 붙어 있으면 그대로
const linkFor = (key: Key) => {
  const u = req.value!.url
  return /[?&]s=/.test(u) ? u : `${u}${u.includes('?') ? '&' : '?'}s=${key}`
}

async function go(key: Key) {
  const r = req.value
  if (!r || busy.value) return
  const url = linkFor(key)
  if (key === 'story') { const f = r.onStory; sent(key); return f?.() }
  if (key === 'copy') {
    const ok = await copyText(url)
    showToast(ok ? '링크를 복사했어요. 붙여 넣어 보내 주세요' : '복사가 안 됐어요. 한 번만 다시 눌러 주세요')
    if (ok) sent(key)
    return
  }
  if (key === 'sms') {
    // 아이폰은 sms:&body=, 안드로이드는 sms:?body=
    const sep = /iphone|ipad|ipod/i.test(navigator.userAgent) ? '&' : '?'
    location.href = `sms:${sep}body=${encodeURIComponent(`${r.text}\n${url}`)}`
    return sent(key)
  }
  if (key === 'more') {
    try {
      await navigator.share({ text: r.text, url })
      sent(key)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') showToast('공유 창을 열지 못했어요. 링크 복사로 보내 주세요')
    }
    return
  }
  if (key === 'save') {
    const res = await shareFiles([r.file!])
    if (res === 'unsupported') return showToast('앱에서는 그림 저장이 아직 안 돼요. 화면을 찍어 주세요')
    if (res !== 'cancelled') { showToast(res === 'saved' ? '그림을 저장했어요' : ''); sent(key) }
    return
  }
  busy.value = key
  try {
    if (key === 'kakao') {
      const ok = await kakaoShare({ title: r.text, description: host.value, url, button: r.button })
      if (ok) return sent(key)
      // 카카오톡을 못 열었으면 기기 공유 창, 그것도 없으면 복사
      if (typeof navigator.share === 'function') { busy.value = ''; return go('more') }
      showToast((await copyText(url)) ? '카카오톡을 열지 못해 링크를 복사했어요' : '카카오톡을 열지 못했어요')
      return
    }
    if (key === 'qr') {
      const QR = (await import('qrcode')).default
      qr.value = await QR.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      track('share_sent', { value: `qr${r.place ? `;${r.place}` : ''}` })
    }
  } catch {
    showToast('잠깐 안 됐어요. 다른 곳으로 보내 주세요')
  } finally {
    busy.value = ''
  }
}
</script>
