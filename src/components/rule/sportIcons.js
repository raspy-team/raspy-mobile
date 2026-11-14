// 종목 아이콘 (2026-11-01 새로 그림). 앱의 다른 아이콘(Lucide)과 같은 24px 격자, 선 굵기 1.75, 둥근 끝.
// Lucide에 맞는 그림이 있으면 그것을, 없는 종목(구기 대부분)은 같은 규칙으로 직접 그린 선을 쓴다.
// 이름은 규칙의 종목·분류 이름 (규칙 만들기에서 고르는 이름과 같다)
import {
  BicepsFlexed, Beer, Dumbbell, BookOpen, Brain, BrainCircuit, Dices, Drama, Footprints, Gauge, HeartHandshake, HeartPulse,
  Lightbulb, Medal, Megaphone, Mountain, PersonStanding, Puzzle, Rabbit, Route, Scale, Shapes, Snowflake, Spline,
  Swords, Target, VenetianMask, Waves, Zap, Gamepad2, Volleyball, Bike,
} from 'lucide-vue-next'

// 직접 그린 것: path의 d 목록 + 원
const c = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
const p = (...ds) => ds.map((d) => `<path d="${d}"/>`).join('')

const DRAWN = {
  농구: c(12, 12, 9) + p('M12 3v18', 'M3 12h18', 'M5.6 5.6c2.5 2.6 2.5 10.2 0 12.8', 'M18.4 5.6c-2.5 2.6-2.5 10.2 0 12.8'),
  축구: c(12, 12, 9) + p('M12 8.5l3.3 2.4-1.3 3.9h-4l-1.3-3.9z', 'M12 8.5V3.2', 'M15.3 10.9l4.9-1.6', 'M14 14.8l3 4.2', 'M10 14.8l-3 4.2', 'M8.7 10.9L3.8 9.3'),
  테니스: c(12, 12, 9) + p('M5.2 5.8c3.5 3.4 3.5 9 0 12.4', 'M18.8 5.8c-3.5 3.4-3.5 9 0 12.4'),
  야구: c(12, 12, 9) + p(
    'M7.5 4.2c1.8 2.2 2.6 4.9 2.6 7.8s-.8 5.6-2.6 7.8', 'M16.5 4.2c-1.8 2.2-2.6 4.9-2.6 7.8s.8 5.6 2.6 7.8',
    'M8.8 7.2l1.5-.5', 'M9.7 10.6l1.5-.1', 'M9.7 13.5l1.5.1', 'M8.8 16.8l1.5.5',
    'M15.2 7.2l-1.5-.5', 'M14.3 10.6l-1.5-.1', 'M14.3 13.5l-1.5.1', 'M15.2 16.8l-1.5.5',
  ),
  배드민턴: p('M9 18.5a3 3 0 0 0 6 0z', 'M9 18.5L6 4.5h12l-3 14', 'M10.6 18.5L9.6 4.5', 'M13.4 18.5l1-14', 'M7 9h10'),
  // 돋보기처럼 보이지 않게 라켓을 세우고 손잡이를 넓게
  탁구: c(11, 8.5, 6) + p('M9.2 14.2v5.6a1.8 1.8 0 0 0 3.6 0v-5.6') + c(19, 18.5, 1.7),
  볼링: p(
    'M12 2.8c-1.5 0-2.2 1.3-2.2 2.8 0 1.4.8 2.3.8 3.3 0 1.2-2.6 3.4-2.6 7.2 0 2.4 1 4.1 1.5 5.1h5c.5-1 1.5-2.7 1.5-5.1 0-3.8-2.6-6-2.6-7.2 0-1 .8-1.9.8-3.3 0-1.5-.7-2.8-2.2-2.8z',
    'M10.6 9.8h2.8',
  ),
  당구: p('M3.5 20.5l8.5-8.5') + c(15.5, 8.5, 3.2) + c(19.5, 16, 2.6),
  미식축구: p(
    'M4.5 19.5c-1.5-5 .5-11 4-13.5 3.6-2.6 8.6-3 11-2.5 1.5 5-.5 11-4 13.5-3.6 2.6-8.6 3-11 2.5z',
    'M9.5 14.5l5-5', 'M10.3 11.7l2 2', 'M11.9 10.1l2 2', 'M8.7 13.3l2 2',
  ),
  복싱: p(
    'M7 9.5V7a4 4 0 0 1 4-4h2.5A4.5 4.5 0 0 1 18 7.5V13a4 4 0 0 1-4 4H9.5A2.5 2.5 0 0 1 7 14.5z',
    'M7 10.5H5.6A1.6 1.6 0 0 0 4 12.1v.4a3 3 0 0 0 3 3', 'M8.5 17v4h7v-4', 'M11 7.5h4',
  ),
  유도: p('M8.5 3L4 7v14h16V7l-4.5-4', 'M8.5 3L12 9l3.5-6', 'M4 14h16', 'M11 14l-1.5 4.5', 'M13 14l1.5 4.5'),
  라크로스: p('M4.5 19.5l9-9', 'M13.5 10.5c-1-3 0-6.3 3-7.2 2.6-.8 4.6 1.2 3.8 3.8-.9 3-4.2 4.2-6.8 3.4', 'M15 6.5l3 3', 'M16.5 4.5l3 3') + c(6.5, 7, 1.6),
}
DRAWN.태권도 = DRAWN.유도
// 11/14 전수 평가: 종목 고르기 21개 중 9개가 같은 세모·네모·동그라미였다. 고르는 화면에 나오는 종목은 모두 제 그림을 갖는다
Object.assign(DRAWN, {
  // 깃대와 홀
  골프: p('M11 18V3l8 3.5-8 3.5', 'M5.5 18.5c0-1.4 2.9-2.5 6.5-2.5s6.5 1.1 6.5 2.5S15.6 21 12 21s-6.5-1.1-6.5-2.5z'),
  // 철봉에 매달린 사람
  턱걸이: p('M3 4.5h18', 'M8 4.5V8c0 2.6 1.6 4 4 4s4-1.4 4-4V4.5', 'M12 12v5', 'M12 17l-2.5 4', 'M12 17l2.5 4') + c(12, 8.2, 1.9),
  // 네트 위로 넘어가는 공
  족구: c(12, 6.5, 3.3) + p('M3 13.5h18', 'M3 13.5V21', 'M21 13.5V21', 'M7.5 13.5V21', 'M12 13.5V21', 'M16.5 13.5V21', 'M3 17.2h18'),
  // 긴 손잡이 라켓과 작은 공
  스쿼시: c(14.8, 8.2, 5.2) + p('M11 12L4 19', 'M11.2 6.2l5.6 5.6', 'M13.4 4.3l5.4 5.4') + c(19.5, 19.2, 1.5),
  // 맞히는 공
  피구: c(13.5, 12, 6) + p('M2.5 7l2.5 1.6', 'M2 12h3', 'M2.5 17l2.5-1.6', 'M13.5 6c2.2 2.2 2.2 9.8 0 12'),
  // 받침대 위의 공
  티볼: c(12, 7, 4) + p('M12 11v8', 'M9 19h6', 'M7.5 21.5h9'),
})
DRAWN.포켓볼 = DRAWN.당구
DRAWN.풋살 = DRAWN.축구
DRAWN.소프트볼 = DRAWN.야구

const LUCIDE = {
  간단: Dices, 크로스핏: Dumbbell, 검도: Swords, 펜싱: Swords, 균형: Scale, 근력: BicepsFlexed, '기존 스포츠': Medal, 기타: Shapes,
  '논리·추리력': Puzzle, 두뇌: Brain, 런닝: Footprints, 상식: BookOpen, 속도: Gauge, '속도·반응': Zap, 수영: Waves,
  순발력: Rabbit, 술게임: Beer, 신체: PersonStanding, '심리·블러핑': VenetianMask, 심폐지구력: HeartPulse,
  아이스브레이킹: Snowflake, 암기력: BrainCircuit, 유연성: Spline, '전략·계획': Route, 정확성: Target,
  자전거: Bike, 사이클: Bike, 다트: Target, 양궁: Target, 사격: Target, 요가: PersonStanding, 필라테스: PersonStanding, 줄넘기: Zap,
  달리기: Footprints, 러닝: Footprints, 마라톤: Footprints, 팔씨름: BicepsFlexed, 배구: Volleyball, '헬스 PT': Dumbbell, 헬스: Dumbbell,
  '로블록스 라이벌즈': Gamepad2, 브롤스타즈: Gamepad2, 'EA SPORTS FC': Gamepad2, '리그 오브 레전드': Gamepad2, 발로란트: Gamepad2, 오버워치: Gamepad2,
  '즉흥 공연': Drama, 창의성: Lightbulb, '커플 게임': HeartHandshake, 클라이밍: Mountain, 표현력: Megaphone,
}

export function sportIcon(name) {
  if (DRAWN[name]) return { svg: DRAWN[name] }
  // 표에 없는 이름은 '대결' 그림으로. 세모·네모·동그라미는 덜 만든 자리처럼 보였다 (11/14 전수 평가)
  return { component: LUCIDE[name] || Swords }
}

export const SPORT_NAMES = new Set([...Object.keys(DRAWN), ...Object.keys(LUCIDE)])
