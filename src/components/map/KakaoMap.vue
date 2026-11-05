<template>
  <div class="relative rounded-xl overflow-hidden bg-surface" :style="{ height }">
    <div ref="el" class="absolute inset-0" />
    <p v-if="!ready" class="absolute inset-0 flex items-center justify-center t-caption px-6 text-center">{{ failed ? '지도를 그리지 못했어요. 아래 목록에서 골라 주세요' : '지도를 불러오는 중' }}</p>
  </div>
</template>

<script setup>
// 카카오 지도 하나 (안전·신뢰 G). pins: [{ id, lat, lon, label, tone: 'primary'|'muted'|'approx' }], 핀을 누르면 select.
// 지도를 움직이면 moved(가운데 lat·lon)를 낸다. 키가 없으면 부모가 이 컴포넌트를 그리지 않는다 (kakaoMapKey)
// - fit: 핀이 바뀔 때마다 모든 핀이 보이게 범위를 맞춘다 (장소 검색 결과)
// - selectedId: 고른 핀을 테두리로 보인다
// - 바텀시트처럼 크기가 0에서 커지는 곳에서는 카카오 지도가 빈 칸으로 그려진다. 크기가 바뀌면 relayout하고 가운데를 다시 맞춘다
import { onBeforeUnmount, onMounted, ref, watch, defineProps, defineEmits } from 'vue'
import { loadKakaoMap } from '../../utils/kakaoMap'

const props = defineProps({
  center: { type: Object, required: true }, // { lat, lon }
  pins: { type: Array, default: () => [] },
  level: { type: Number, default: 5 },
  height: { type: String, default: '260px' },
  fit: { type: Boolean, default: false },
  selectedId: { type: [String, Number], default: null },
})
const emit = defineEmits(['select', 'moved'])
const el = ref(null)
const ready = ref(false)
const failed = ref(false)
let map = null
let overlays = []
let kakao = null
let resize = null
let lastSize = ''

function fitPins() {
  if (!map || !props.fit || !props.pins.length) return
  if (props.pins.length === 1) { map.setCenter(new kakao.maps.LatLng(props.pins[0].lat, props.pins[0].lon)); return }
  const b = new kakao.maps.LatLngBounds()
  props.pins.forEach((p) => b.extend(new kakao.maps.LatLng(p.lat, p.lon)))
  map.setBounds(b, 40, 24, 24, 24)
}

function draw() {
  if (!map) return
  overlays.forEach((o) => o.setMap(null))
  overlays = props.pins.map((p) => {
    const node = document.createElement('button')
    node.type = 'button'
    node.className = ['map-pin', p.tone === 'muted' && 'map-pin--muted', p.tone === 'approx' && 'map-pin--approx', p.id === props.selectedId && 'map-pin--on'].filter(Boolean).join(' ')
    node.textContent = p.label
    node.setAttribute('aria-label', p.aria || p.label)
    node.onclick = () => emit('select', p)
    const o = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(p.lat, p.lon), content: node, yAnchor: 1.2, zIndex: p.id === props.selectedId ? 2 : 1 })
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
  resize = new ResizeObserver(([e]) => {
    const size = `${Math.round(e.contentRect.width)}x${Math.round(e.contentRect.height)}`
    if (!map || size === lastSize || !e.contentRect.width) return
    lastSize = size
    const c = map.getCenter()
    map.relayout()
    if (props.fit && props.pins.length) fitPins()
    else map.setCenter(c)
  })
  resize.observe(el.value)
  ready.value = true
  draw()
  fitPins()
})
// 핀 목록이 바뀌면 다시 그리고 (fit이면) 범위를 맞춘다. 고른 핀만 바뀌면 다시 그리기만
watch(() => props.pins, () => { draw(); fitPins() }, { deep: true })
watch(() => props.selectedId, draw)
watch(() => [props.center.lat, props.center.lon], ([lat, lon]) => { if (!props.fit) map?.panTo(new kakao.maps.LatLng(lat, lon)) })
onBeforeUnmount(() => { overlays.forEach((o) => o.setMap(null)); resize?.disconnect() })
</script>

<style>
.map-pin { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis;
  background: rgb(var(--c-signal)); color: rgb(17 17 19); box-shadow: 0 1px 4px rgba(0, 0, 0, .3); }
.map-pin--muted { background: rgb(var(--c-fg)); color: rgb(var(--c-canvas)); }
/* 장소를 아직 안 정한 경기: 동 가운데에 둔 대략의 자리라 흰 바탕에 점선 */
.map-pin--approx { background: rgb(255 255 255 / .94); color: rgb(17 17 19); border: 1.5px dashed rgb(17 17 19 / .55); }
.map-pin--on { outline: 2px solid rgb(17 17 19); outline-offset: 1px; }
</style>
