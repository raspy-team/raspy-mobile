// 지금 서버에 가 있는 요청 수와, 화면이 '다 받았나'를 묻는 도구.
// 화면 위쪽에 늦게 도착하는 칸(잡힌 경기·받은 요청·친구와의 승부)이 끼어들면 그 아래 것이 274px씩 밀렸다(11/15 화면 안정성 바퀴: 서버 답을 0.7초 늦춰 잼).
// 요청이 모두 돌아온 뒤 한 번에 그린다. 너무 오래 걸리면 기다리지 않고 그린다
import { ref, onMounted, onBeforeUnmount } from 'vue'

export const inflight = ref(0)
export const netStart = () => { inflight.value += 1 }
export const netEnd = () => { inflight.value = Math.max(0, inflight.value - 1) }

/** 화면을 연 뒤 서버 요청이 모두 돌아오면(또는 maxMs가 지나면) true가 되는 값 */
export function useSettled(maxMs = 2500) {
  const settled = ref(false)
  let quiet = 0
  let poll = 0
  let cap = 0
  onMounted(() => {
    cap = window.setTimeout(() => { settled.value = true }, maxMs)
    // 요청이 0인 채로 두 번(80ms) 이어지면 다 받은 것으로 본다: 한 요청이 끝나고 다음 요청이 바로 나가는 화면이 있다
    poll = window.setInterval(() => {
      quiet = inflight.value === 0 ? quiet + 1 : 0
      if (quiet >= 2) { settled.value = true; window.clearInterval(poll); window.clearTimeout(cap) }
    }, 40)
  })
  onBeforeUnmount(() => { window.clearInterval(poll); window.clearTimeout(cap) })
  return settled
}
