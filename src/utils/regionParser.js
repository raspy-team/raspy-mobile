// 지역 목록은 assets/regionMap.json 하나만 쓴다 (서버 RegionUtil과 같은 이름)
import regionMap from '../assets/regionMap.json'

// 시/도 별칭 매핑
const provinceAliases = {
  서울특별시: '서울',
  서울시: '서울',
  경기도: '경기',
  인천광역시: '인천',
  인천시: '인천',
  부산광역시: '부산',
  부산시: '부산',
  대구광역시: '대구',
  대구시: '대구',
  강원도: '강원특별자치도',
  강원: '강원특별자치도',
  충청북도: '충북',
  충북도: '충북',
  충청남도: '충남',
  충남도: '충남',
  전라북도: '전북특별자치도',
  전북도: '전북특별자치도',
  전북: '전북특별자치도',
  전라남도: '전남',
  전남도: '전남',
  경상북도: '경북',
  경북도: '경북',
  경상남도: '경남',
  경남도: '경남',
  제주도: '제주특별자치도',
  제주: '제주특별자치도'
}

/**
 * Google Places API 주소를 파싱하여 1차, 2차 지역 정보 추출
 * @param {string} address - Google Places API에서 받은 전체 주소
 * @returns {{ region1: string, region2: string, cleanAddress: string } | null}
 */
export function parseRegion(address) {
  if (!address) return null

  // "대한민국" 제거
  let cleanAddress = address.replace(/^대한민국\s*/, '').trim()

  // 주소를 공백으로 분리
  const parts = cleanAddress.split(/\s+/)

  if (parts.length < 2) return null

  // 1차 지역(시/도) 추출
  let region1Raw = parts[0]
  let region1 = provinceAliases[region1Raw] || region1Raw

  // regionMap에 없는 1차 지역이면 실패
  if (!regionMap[region1]) {
    return null
  }

  // 2차 지역 추출
  let region2 = null

  // 경기, 충북, 충남 등은 "시/군/구" 단위로 매핑
  // 예: "수원시 팔달구", "성남시 분당구"
  const possibleRegion2Candidates = []

  // 2단계: "시 구" 형태 (예: 수원시 팔달구)
  if (parts.length >= 3) {
    possibleRegion2Candidates.push(`${parts[1]} ${parts[2]}`)
  }

  // 1단계: "시/군/구" 단독 (예: 수원시, 강남구)
  if (parts.length >= 2) {
    possibleRegion2Candidates.push(parts[1])
  }

  // 매핑 테이블에서 매칭되는 2차 지역 찾기
  const validRegion2List = regionMap[region1]

  for (const candidate of possibleRegion2Candidates) {
    if (validRegion2List.includes(candidate)) {
      region2 = candidate
      break
    }
  }

  // 2차 지역을 찾지 못하면 실패
  if (!region2) {
    return null
  }

  // 전체 주소 = 변환된 1차 지역 + 나머지 (2차 지역부터)
  const restAddress = parts.slice(1).join(' ')
  const fullAddress = `${region1} ${restAddress}`

  return {
    region1, // 서버에 보낼 1차 지역 (변환됨: "경기도" -> "경기")
    region2, // 서버에 보낼 2차 지역 (예: "수원시 영통구")
    fullAddress // 유저에게 표시할 주소 (예: "경기 수원시 영통구 ...")
  }
}
