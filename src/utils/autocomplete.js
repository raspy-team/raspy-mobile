// kakaoAutocompleteDirective.js
export default {
  mounted(el, binding) {
    let timeout = null

    el.addEventListener('input', (e) => {
      const query = e.target.value
      if (!query) return
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
            {
              headers: {
                Authorization: `KakaoAK ${  process.env.VUE_APP_KAKAO_REST_API_KEY }`
              }
            }
          )
          const data = await res.json()
          const first = data.documents?.[0]

          if (first && binding.value && typeof binding.value === 'function') {
            const regionParts = first.address_name.split(' ')
            const region1 = regionParts[0] || ''
            const region2 = regionParts[1] || ''
            const full = `${region1} ${region2}`

            binding.value({
              placeName: first.place_name,
              address: first.road_address_name || first.address_name,
              region: full,
              lat: first.y,
              lng: first.x
            })
          }
        } catch (err) {
          console.error('카카오 API 오류:', err)
        }
      }, 300)
    })
  }
}
