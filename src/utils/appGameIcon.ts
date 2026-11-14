// 앱 게임마다 다른 그림. 서버가 주는 아이콘은 연필·격자·번개가 여러 게임에 겹쳐 게임이 구분되지 않았다 (11/3 디자인 리뷰).
// 놀이방의 얼굴은 화면이 정한다: 키마다 하나, 없으면 서버 아이콘
const ICONS: Record<string, string> = {
  alkkagi: 'circle-dot', auction: 'coins', balance: 'scale', battleship: 'ship', 'card-duel': 'spade',
  chosung: 'type', 'daily-chosung': 'calendar-days', debate: 'messages', 'drop-four': 'grid-2x2', excuse: 'message-question',
  flip: 'refresh', 'land-grab': 'map', 'last-stone': 'gem', 'letter-gomoku': 'envelope', 'math-race': 'calculator',
  'number-baseball': 'hash', 'number-bomb': 'bomb', pong: 'activity', predict: 'goal', 'quiz-race': 'lightbulb',
  recipe: 'chef-hat', rps: 'hand', sentence: 'feather', shake: 'vibrate', squat: 'dumbbell',
  'thirty-one': 'list-ol', trial: 'gavel', ghosted: 'eye-slash', typing: 'keyboard', 'word-battle': 'swords', wordchain: 'link',
  'energy-duel': 'flame', 'pitch-duel': 'crosshair', 'block-duel': 'blocks', 'liar-dice': 'dice', 'three-hills': 'mountain', 'power-level': 'biceps', majority: 'percent', 'hidden-word': 'search', 'minus-one': 'grab', boxes: 'square-dashed', 'fading-three': 'hourglass-half', chicken: 'flag-checkered', 'mine-duel': 'radar', 'two-truths': 'eye-slash', proverb: 'book-open', 'chosung-endure': 'heading', 'which-first': 'calendar', acrostic: 'list', 'greed-dice': 'piggy-bank', 'giant-hunt': 'shield',
  'daily-literacy': 'pen-to-square', 'time-sense': 'stopwatch', 'number-spots': 'border-all', 'daily-number': 'bullseye', 'rhythm-copy': 'volume',
}

export function gameIcon(key: string | undefined, fallback = 'dice'): string {
  return (key && ICONS[key]) || fallback
}
