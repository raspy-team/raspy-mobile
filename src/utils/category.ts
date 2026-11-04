// 카테고리를 화면에서 쓰는 말 (docs/direction.md '카테고리'). 값과 한국어 이름은 서버(/api/rules/category-options)가 주고,
// 여기에는 만드는 사람에게 묻는 쉬운 질문과 예시만 둔다
import type { components } from '@/api/schema'

export type CategoryInput = components['schemas']['CategoryInput']
export type CategoryView = components['schemas']['GameCategoryView']

/** ① 맞닿는 방식을 만드는 사람에게 물을 때 쓰는 쉬운 말 */
export const FACE_HELP: Record<string, { title: string; example: string }> = {
  SEPARATE: { title: '각자 하고 결과 비교', example: '볼링, 다트, 컵 쌓기' },
  EXCHANGE: { title: '번갈아 한 수씩', example: '바둑, 당구, 야구, 가위바위보' },
  RACE: { title: '동시에 출발해서 먼저', example: '달리기, 퀴즈 먼저 맞히기' },
  NET: { title: '공을 넘겨 주고받기', example: '탁구, 배드민턴, 족구' },
  FIELD: { title: '한 곳에서 뛰며 부딪치기', example: '축구, 농구, 술래잡기' },
  GRAPPLE: { title: '직접 맞붙기', example: '씨름, 팔씨름, 웃기기 대결' },
}

/** 빈 카테고리 (AI를 못 쓸 때 직접 고르기 시작점) */
export function emptyCategory(): CategoryInput {
  return { face: '', abilities: [], traits: [], luck: 'NONE', places: [], parties: [], length: 'TEN_MINUTES', gears: [], sport: '' }
}

/** 서버가 준 분류(이름 포함)를 고칠 수 있는 값으로 */
export function toInput(v: CategoryView): CategoryInput {
  const keys = (xs: { key: string }[]) => xs.map((x) => x.key)
  return {
    face: v.face.key,
    abilities: keys(v.abilities),
    traits: keys(v.traits),
    luck: v.luck.key,
    places: keys(v.places),
    parties: keys(v.parties),
    length: v.length.key,
    gears: keys(v.gears),
    sport: v.sport ?? '',
  }
}

/**
 * 빠진 칸이 있으면 무엇을 고르라는 말, 다 채웠으면 ''.
 * 빠진 것을 한 번에 다 말한다 (11/4 밤샘: 하나씩 알려 줘서 '규칙 만들기'를 다섯 번 눌러야 다 알았다)
 */
export function missing(c: CategoryInput, maxAbilities = 3) {
  if (c.abilities.length > maxAbilities) return `어려운 것은 ${maxAbilities}개까지 골라 주세요`
  const left = [
    !c.face && '상대와 어떻게',
    !c.abilities.length && '무엇이 어려운지',
    !c.places.length && '어디서',
    !c.parties.length && '몇 명이',
    !c.gears.length && '준비물',
  ].filter(Boolean)
  return left.length ? `골라 주세요: ${left.join(' · ')}` : ''
}
