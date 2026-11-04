// 시연용 데이터 채우기: 실제 화면과 같은 API 흐름으로 경기·결과·채팅·친구·리뷰를 만든다.
// 시연 계정(matchdemo)과 상대 4명(demo_*)을 만들고 끝난 경기 8판, 확인 대기 1판, 잡힌 경기 1판, 신청 대기 1판을 채운다.
//
//   cd raspy-mobile
//   DEMO_PW='비밀번호8자이상' BASE=https://raspy-api.fly.dev node scripts/seed-demo.mjs
//
// 비밀번호는 코드에 두지 않는다. 같은 서버에 두 번 돌리면 경기가 한 번 더 쌓인다 (계정은 그대로 쓴다)
import { Client } from '@stomp/stompjs'

const BASE = process.env.BASE || 'http://localhost:8080'
const WS = BASE.replace(/^http/, 'ws') + '/ws'
const PW = process.env.DEMO_PW
if (!PW || PW.length < 8) {
  console.error('DEMO_PW(8~20자)를 지정해 주세요')
  process.exit(1)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 동네: 경기를 열고 신청하려면 동네 인증이 있어야 해서(neighborhood/) 다섯 명 모두 마포구 가까운 동네에 둔다 (동 중심 좌표)
const PEOPLE = {
  demo: { id: 'matchdemo', username: 'matchdemo', nickname: '주말 스매셔', at: [37.54691, 126.90934], bio: '주말마다 탁구·배드민턴 쳐요. 한 판 하실 분!' }, // 합정동
  minjun: { id: 'demo_minjun', username: 'minjun_tt', nickname: '민준', at: [37.55477, 126.92094], bio: '회사 탁구 동호회 3년차' }, // 서교동
  seoyeon: { id: 'demo_seoyeon', username: 'seoyeon_b', nickname: '서연', at: [37.56303, 126.92154], bio: '배드민턴 좋아해요' }, // 연남동
  jiho: { id: 'demo_jiho', username: 'jiho_hoops', nickname: '지호', at: [37.54681, 126.92599], bio: '점심시간 농구파' }, // 서강동
  hayun: { id: 'demo_hayun', username: 'hayun_play', nickname: '하윤', at: [37.55347, 126.90033], bio: '뭐든 한 판 좋아요' }, // 망원1동
}

async function call(who, method, path, body, form) {
  const headers = {}
  if (who?.token) headers.Authorization = `Bearer ${who.token}`
  let payload
  if (form) {
    const fd = new FormData()
    for (const [k, v] of Object.entries(form)) fd.append(k, v)
    payload = fd
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, { method, headers, body: payload })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 200)}`)
  try { return JSON.parse(text) } catch { return text }
}

async function setupPerson(key) {
  const p = PEOPLE[key]
  try { await call(null, 'POST', '/api/auth/register', { email: p.id, password: PW }) } catch (e) { if (!/409|already|Duplicate/i.test(e.message)) throw e }
  const { token } = await call(null, 'POST', '/api/auth/login', { email: p.id, password: PW })
  p.token = token
  p.userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).userId
  await call(p, 'POST', '/api/auth/terms')
  await call(p, 'POST', '/api/auth/complete', { username: p.username, nickname: p.nickname })
  await call(p, 'PATCH', '/api/user-profile/save', undefined, { nickname: p.nickname, bio: p.bio })
  // 활동 지역(서울 마포구)은 동네 인증이 채운다
  await call(p, 'POST', '/api/neighborhoods/verify', { lat: p.at[0], lon: p.at[1], accuracy: 20 })
  console.log('user', key, p.userId)
  return p
}

const PLACES = [
  ['서울 마포구 월드컵로 240', '망원 한강공원 체육관'],
  ['서울 마포구 마포대로 212', '마포구민 체육센터'],
  ['서울 마포구 성미산로 70', '연남 야외 농구장'],
]

async function createGame(owner, ruleId, place, daysFromNow = 0) {
  const d = new Date(Date.now() + daysFromNow * 86400000)
  d.setHours(19, 0, 0, 0)
  const matchDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19)
  return call(owner, 'POST', '/api/games/create', { referencedRuleId: ruleId, matchDate, placeRoad: place[0], placeDetail: place[1] })
}

async function playGame({ owner, guest, ruleId, place, submitter, sets, confirm = true, chat = [], reviews = true, likes = [], comments = [] }) {
  const gameId = await createGame(owner, ruleId, place, -1)
  await call(guest, 'POST', `/api/games/${gameId}/apply`)
  await call(owner, 'POST', '/api/games/approve', { gameId, userId: guest.userId })
  await call(owner, 'POST', `/api/games/${gameId}/start`, undefined, {})
  if (chat.length) {
    const room = await call(owner, 'GET', `/api/chat-room/by-game/${gameId}`)
    await sendChats(Object.values(room)[0], chat.map(([w, t]) => [w === 'owner' ? owner : guest, t]))
  }
  await call(submitter, 'POST', `/api/games/${gameId}/result`, { sets: sets.map(([my, opp]) => ({ myScore: my, opponentScore: opp })) })
  if (!confirm) return gameId
  const other = submitter === owner ? guest : owner
  await call(other, 'POST', `/api/games/${gameId}/result/confirm`)
  if (reviews) {
    await call(owner, 'POST', `/api/games/${gameId}/review`, { manner: 5, performance: 4, text: '매너 좋고 실력도 좋아요' }).catch((e) => console.warn('review', e.message))
    await call(guest, 'POST', `/api/games/${gameId}/review`, { manner: 5, performance: 5, text: '또 하고 싶어요!' }).catch((e) => console.warn('review', e.message))
    await call(owner, 'POST', `/api/rules/${ruleId}/rating`, { gameId, rating: 5, comment: '규칙 깔끔해요' }).catch(() => {})
    await call(guest, 'POST', `/api/rules/${ruleId}/rating`, { gameId, rating: 4, comment: '재밌어요' }).catch(() => {})
  }
  for (const who of likes) await call(who, 'POST', `/api/games/${gameId}/like`).catch(() => {})
  for (const [who, text] of comments) await call(who, 'POST', `/api/games/${gameId}/comments`, undefined, { content: text })
  console.log('game done', gameId)
  return gameId
}

// 채팅은 화면과 같이 STOMP로 보낸다 (보내는 사람마다 연결)
async function sendChats(roomId, lines) {
  const clients = new Map()
  const connect = (who) =>
    new Promise((resolve, reject) => {
      const c = new Client({ webSocketFactory: () => new WebSocket(WS), connectHeaders: { token: who.token }, reconnectDelay: 0 })
      c.onConnect = () => resolve(c)
      c.onStompError = (f) => reject(new Error(f.headers.message))
      c.onWebSocketError = () => reject(new Error('ws error'))
      c.activate()
    })
  for (const [who, text] of lines) {
    if (!clients.has(who)) clients.set(who, await connect(who))
    clients.get(who).publish({ destination: `/app/chat/${roomId}`, body: JSON.stringify({ content: text }) })
    await sleep(350)
  }
  await sleep(500)
  for (const c of clients.values()) await c.deactivate()
}

async function main() {
  const P = {}
  for (const k of Object.keys(PEOPLE)) P[k] = await setupPerson(k)
  const { demo, minjun, seoyeon, jiho, hayun } = P

  // 규칙
  const base = { ruleExtraInfo: '', duration: -1 }
  const tt = await call(minjun, 'POST', '/api/rules', {
    ...base, ruleTitle: '탁구 11점 3세트', majorCategory: '기존 스포츠', minorCategory: '탁구', pointsToWin: 11, setsToWin: 3, winBy: 'SETS_HALF_WIN',
    ruleGoal: '11점을 먼저 내면 세트를 가져가고, 3세트 중 2세트를 먼저 이기면 승리', ruleScoreDefinition: '상대가 공을 못 넘기거나 테이블 밖으로 치면 1점',
    rulePreparation: '탁구대, 라켓 2개, 공', ruleOrder: '서브는 2점마다 번갈아 넣어요', ruleDecision: '10:10이면 2점 차가 날 때까지', ruleFoul: '서브 때 공을 손바닥 위에 올리고 16cm 이상 띄워요',
  })
  const bd = await call(demo, 'POST', '/api/rules', {
    ...base, ruleTitle: '배드민턴 21점 단판', majorCategory: '기존 스포츠', minorCategory: '배드민턴', pointsToWin: 21, setsToWin: 1, winBy: 'SETS_HALF_WIN',
    ruleGoal: '21점을 먼저 내면 승리', ruleScoreDefinition: '셔틀콕이 상대 코트에 떨어지면 1점', rulePreparation: '라켓 2개, 셔틀콕',
    ruleOrder: '점수를 낸 쪽이 다음 서브', ruleDecision: '20:20이면 2점 차가 날 때까지 (최대 30점)', ruleFoul: '네트를 건드리면 상대 점수',
  })
  const ft = await call(jiho, 'POST', '/api/rules', {
    ...base, ruleTitle: '자유투 먼저 7개', majorCategory: '기존 스포츠', minorCategory: '농구', pointsToWin: 7, setsToWin: 3, winBy: 'SETS_HALF_WIN',
    ruleGoal: '자유투를 번갈아 던져 7개를 먼저 넣으면 세트 승리, 2세트 먼저', ruleScoreDefinition: '들어가면 1점', rulePreparation: '농구공, 골대',
    ruleOrder: '한 번씩 번갈아 던져요', ruleDecision: '같은 차례에 둘 다 7개면 한 개씩 더', ruleFoul: '자유투 라인을 밟으면 무효',
  })
  console.log('rules', tt.id, bd.id, ft.id)

  // 친구
  await call(demo, 'POST', `/api/friends/request/${minjun.userId}`); await call(minjun, 'POST', `/api/friends/accept/${demo.userId}`)
  await call(jiho, 'POST', `/api/friends/request/${demo.userId}`); await call(demo, 'POST', `/api/friends/accept/${jiho.userId}`)
  // 처음 만나는 1:1은 앱 게임 한 판이 먼저다(신뢰 사다리, TrustLadder). 시연 경기를 바로 잡으려고 서연과도 친구로 둔다
  await call(seoyeon, 'POST', `/api/friends/request/${demo.userId}`); await call(demo, 'POST', `/api/friends/accept/${seoyeon.userId}`)
  await call(hayun, 'POST', `/api/friends/request/${demo.userId}`) // 받은 친구 요청 (알림)

  // 끝난 경기 8판 (시연 계정 5승 3패)
  await playGame({ owner: demo, guest: minjun, ruleId: tt.id, place: PLACES[0], submitter: demo, sets: [[11, 7], [9, 11], [11, 8]],
    chat: [['guest', '오늘 7시 맞죠?'], ['owner', '네! 체육관 2층이에요'], ['guest', '라켓 하나 더 챙겨갈게요']],
    likes: [jiho, seoyeon, hayun], comments: [[jiho, '3세트 접전이었네요 ㄷㄷ'], [minjun, '다음엔 제가 이깁니다']] })
  await playGame({ owner: minjun, guest: demo, ruleId: tt.id, place: PLACES[0], submitter: minjun, sets: [[11, 9], [11, 6]], likes: [jiho] })
  await playGame({ owner: demo, guest: jiho, ruleId: tt.id, place: PLACES[0], submitter: demo, sets: [[11, 3], [11, 4]], likes: [minjun] })
  await playGame({ owner: demo, guest: seoyeon, ruleId: bd.id, place: PLACES[1], submitter: seoyeon, sets: [[17, 21]],
    chat: [['owner', '셔틀콕은 제가 가져갈게요'], ['guest', '좋아요 ㅎㅎ 마포구민체육센터 B코트 예약했어요']],
    likes: [minjun, hayun], comments: [[seoyeon, '스매시 너무 세요...']] })
  await playGame({ owner: seoyeon, guest: demo, ruleId: bd.id, place: PLACES[1], submitter: seoyeon, sets: [[21, 19]], likes: [hayun] })
  await playGame({ owner: jiho, guest: demo, ruleId: ft.id, place: PLACES[2], submitter: jiho, sets: [[5, 7], [7, 4], [6, 7]],
    likes: [minjun, seoyeon], comments: [[jiho, '마지막 자유투 미쳤다']] })
  await playGame({ owner: demo, guest: minjun, ruleId: tt.id, place: PLACES[0], submitter: minjun, sets: [[8, 11], [11, 9], [7, 11]] })
  await playGame({ owner: demo, guest: minjun, ruleId: bd.id, place: PLACES[1], submitter: demo, sets: [[15, 21]], likes: [seoyeon] })

  // 할 일: 민준이 낸 결과를 시연 계정이 확인해야 함
  await playGame({ owner: minjun, guest: demo, ruleId: tt.id, place: PLACES[0], submitter: minjun, sets: [[11, 8], [6, 11], [11, 9]], confirm: false,
    chat: [['owner', '결과 올렸어요! 확인 부탁해요'], ['guest', '넵 금방 볼게요']] })

  // 잡힌 경기: 서연과 이번 주 토요일
  const sched = await createGame(demo, bd.id, PLACES[1], 3)
  await call(seoyeon, 'POST', `/api/games/${sched}/apply`)
  await call(demo, 'POST', '/api/games/approve', { gameId: sched, userId: seoyeon.userId })

  // 내가 연 경기에 하윤이 신청 (승인 대기)
  const mine = await createGame(demo, ft.id, PLACES[2], 5)
  await call(hayun, 'POST', `/api/games/${mine}/apply`)
  await call(jiho, 'POST', `/api/games/${mine}/comments`, undefined, { content: '저도 다음에 껴주세요!' })

  // 둘러볼 열린 경기
  await createGame(jiho, ft.id, PLACES[2], 2)
  await createGame(seoyeon, bd.id, PLACES[1], 4)
  await createGame(minjun, tt.id, PLACES[0], 1)

  // 메시지(DM)
  const dm1 = await call(demo, 'POST', `/api/chat-room/dm-room?targetUserId=${minjun.userId}`)
  await sendChats(dm1.roomId, [[minjun, '어제 경기 재밌었어요'], [demo, '저도요! 다음 주에 한 판 더?'], [minjun, '좋죠 ㅋㅋ 이번엔 안 봐줍니다'], [minjun, '결과 확인 눌러주세요~']])
  const dm2 = await call(demo, 'POST', `/api/chat-room/dm-room?targetUserId=${seoyeon.userId}`)
  await sendChats(dm2.roomId, [[seoyeon, '토요일 2시 괜찮으세요?'], [demo, '네 좋아요'], [seoyeon, '그럼 B코트에서 봬요!']])

  console.log('\n완료')
  console.log('시연 계정:', PEOPLE.demo.id, '/', PW)
}

main().catch((e) => { console.error('실패:', e.message); process.exit(1) })
