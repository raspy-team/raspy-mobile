// 꾸미기 부품이 새로 열리면 그 자리에서 알린다 (11/13 고병연: 첫 승처럼 열려도 아무도 몰랐다).
// 서버는 해낸 일 목록만 준다(/api/plaza/unlocks). 지난번 본 목록을 이 기기에 두고, 새로 생긴 일만 알린다.
// 이 기기에서 처음 보는 사람이면 조용히 지금 목록을 적어 둔다 (예전에 해낸 일까지 한꺼번에 쏟아내지 않게)
import api from '../api/api'
import { getMyId } from './me'
import { useToast } from '../composables/useToast'

let running = false

export async function checkUnlocks() {
  if (running) return
  running = true
  try {
    const me = await getMyId()
    if (!me) return
    const { data } = await api.get('/api/plaza/unlocks', { quiet: true })
    const now = (data || []).map((u) => u.goal)
    const key = `unlock_seen_${me}`
    let seen = null
    try { seen = JSON.parse(localStorage.getItem(key) || 'null') } catch { seen = null }
    try { localStorage.setItem(key, JSON.stringify(now)) } catch { /* 다음에 다시 알릴 뿐 */ }
    if (!Array.isArray(seen)) return
    const fresh = (data || []).filter((u) => !seen.includes(u.goal))
    if (!fresh.length) return
    const items = fresh.reduce((n, u) => n + (u.items || 0), 0)
    const head = fresh[fresh.length - 1].doneLabel // 가장 큰 일 하나만 말한다
    useToast().showToast(`${head} · 꾸미기 ${items}개가 열렸어요`, '/plaza/avatar')
  } catch {
    // 못 알려도 부품은 꾸미기에서 그대로 열려 있다
  } finally {
    running = false
  }
}
