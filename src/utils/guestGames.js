// 가입 없이 한 판 할 수 있는 게임 (3단계 수요 조사의 도착 게임). 서버 GuestPlayService.GUEST_KEYS와 맞춘다
// 혼자 바로 되고 서버가 채점하는 게임만. 더하려면 양쪽에 키를 넣고, GuestPlayView에 그 게임의 판을 붙인다
import { IMPROV_LINE } from './improv'

export const GUEST_GAMES = {
  improv: { title: '임기응변 등급', line: IMPROV_LINE },
  nunchi: { title: '눈치 한 판', line: '남들은 뭘 골랐을까? 문제당 3초, 열 문제' },
  'daily-chosung': { title: '오늘의 초성', line: '모두 같은 초성 다섯 문제. 몇 개 맞힐 수 있어요?' },
  'time-sense': { title: '감 잡기', line: '숨은 초시계로 정해진 초에 딱 멈춰요' },
}
