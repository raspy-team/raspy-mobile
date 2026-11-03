<template>
  <div class="relative rounded-xl overflow-hidden bg-surface" :style="{ height }">
    <div ref="el" class="absolute inset-0" />
    <p v-if="!ready" class="absolute inset-0 flex items-center justify-center t-caption px-6 text-center">{{ failed ? '지도를 그리지 못했어요. 아래 목록에서 골라 주세요' : '지도를 불러오는 중' }}</p>
  </div>
</template>

<script setup>
// 카카오 지도 하나 (안전·신뢰 G). pins: [{ id, lat, lon, label, tone: 'primary'|'muted' }], 핀을 누르면 select.
// 지도를 움직이면 moved(가운데 lat·lon)를 낸다. 키가 없으면 부모가 이 컴포넌트를 그리지 않는다 (kakaoMapKey)
import { onBeforeUnmount, onMounted, ref, watch, defineProps, defineEmits } from 'vue'
import { loadKakaoMap } from '../../utils/kakaoMap'

const props = defineProps({
  center: { type: Object, required: true }, // { lat, lon }
  pins: { type: Array, default: () => [] },
  level: { type: Number, default: 5 },
  height: { type: String, default: '260px' },
})
const emit = defineEmits(['select', 'moved'])
const el = ref(null)
const ready = ref(false)
const failed = ref(false)
let map = null
let overlays = []
let kakao = null

function draw() {
  if (!map) return
  overlays.forEach((o) => o.setMap(null))
  overlays = props.pins.map((p) => {
    const node = document.createElement('button')
    node.type = 'button'
    node.className = `map-pin ${p.tone === 'muted' ? 'map-pin--muted' : ''}`
    node.textContent = p.label
    node.onclick = () => emit('select', p)
    const o = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(p.lat, p.lon), content: node, yAnchor: 1.2 })
    o.setMap(map)
    return o
  })
}

onMounted(async () => {
  kakao = await loadKakaoMap()
  if (!kakao || !el.value) { failed.value = true; return }
  map = new kakao.maps.Map(el.value, { center: new kakao.maps.LatLng(props.center.lat, props.center.lon), level: props.level })
  kakao.maps.event.addListener(map, 'idle', () => {
    const c = map.getCenter()
    emit('moved', { lat: c.getLat(), lon: c.getLng() })
  })
  ready.value = true
  draw()
})
watch(() => props.pins, draw, { deep: true })
watch(() => [props.center.lat, props.center.lon], ([lat, lon]) => map?.panTo(new kakao.maps.LatLng(lat, lon)))
onBeforeUnmount(() => overlays.forEach((o) => o.setMap(null)))
</script>

<style>
.map-pin { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis;
  background: rgb(var(--c-signal)); color: rgb(17 17 19); box-shadow: 0 1px 4px rgba(0, 0, 0, .3); }
.map-pin--muted { background: rgb(var(--c-fg)); color: rgb(var(--c-canvas)); }
</style>
