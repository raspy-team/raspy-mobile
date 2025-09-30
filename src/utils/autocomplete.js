export default {
  mounted(el, binding) {
    if (!window.google?.maps?.places) {
      console.error('Google Places API가 로드되지 않았습니다.')
      return
    }

    const autocomplete = new window.google.maps.places.Autocomplete(el, {
      componentRestrictions: { country: 'kr' },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      types: ['establishment', 'geocode']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()

      if (!place.geometry) {
        console.warn('선택된 장소의 정보가 불완전합니다.')
        return
      }

      if (binding.value && typeof binding.value === 'function') {
        // 주소 구성 요소에서 도/시 정보 추출
        const addressComponents = place.address_components || []
        let region1 = '' // 시/도
        let region2 = '' // 시/군/구

        for (const component of addressComponents) {
          if (component.types.includes('administrative_area_level_1')) {
            region1 = component.long_name
          }
          if (component.types.includes('locality') || component.types.includes('sublocality_level_1')) {
            region2 = component.long_name
          }
        }

        const region = `${region1} ${region2}`.trim()

        binding.value({
          placeName: place.name || '',
          address: place.formatted_address || '',
          region: region,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        })
      }
    })
  }
}
