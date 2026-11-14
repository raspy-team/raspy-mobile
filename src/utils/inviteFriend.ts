// 친구 부르기 (11/14): 결과 화면이 아니어도 홈에서 친구를 부른다. 예전엔 소식의 친구 탭이 비었을 때만 '친구 초대'가 있었다.
// 내가 임기응변을 한 적이 있으면 그 판의 링크로: 받은 친구가 같은 상황을 풀고 가입하면 나와의 1:1이 된다. 없으면 새 판 링크
import { GET } from '@/api/client'
import { sendLink } from './share'

export async function inviteFriend(place = 'invite'): Promise<string> {
  let url = `${window.location.origin}/try/improv?utm_source=invite`
  try {
    const duels = (await GET('/api/app-games/{key}/duels', { path: { key: 'improv' }, quiet: true })).data ?? []
    const mine = duels.find((d) => d.shareKey && d.myUserId && (d.myScore ?? 0) > 0 && d.status !== 'CANCELED')
    if (mine) url = `${window.location.origin}/try/improv?d=${mine.gameId}&u=${mine.myUserId}&k=${mine.shareKey}&utm_source=invite`
  } catch {
    // 못 불러오면 새 판 링크로
  }
  return sendLink(url, '나랑 임기응변 등급 붙어 볼래? 가입 없이 바로 돼', { title: '친구 부르기', button: '한 판 붙기', place })
}
