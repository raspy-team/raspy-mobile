<template>
  <div class="relative rounded-xl overflow-hidden bg-surface" :style="{ height }">
    <div ref="el" class="absolute inset-0" />
    <p v-if="!ready" class="absolute inset-0 flex items-center justify-center t-caption px-6 text-center">{{ failed ? '지도를 그리지 못했어요. 아래 목록에서 골라 주세요' : '지도를 불러오는 중' }}</p>
  </div>
</template>

<script setup>
// 카카오 지도 하나 (안전·신뢰 G). pins: [{ id, lat, lon, label, tone: 'primary'|'muted'|'approx', icon?: 규칙(종목 아이콘), count? }], 핀을 누르면 select.
// 핀은 둥근 머리(종목 아이콘, 여럿이면 숫자) + 꼬리 + 아래 이름표 (UX 리뷰 ⑦: 알약 글자만이라 무엇이 어디 있는지 안 보였다)
// 지도를 움직이면 moved(가운데 lat·lon)를 낸다. 키가 없으면 부모가 이 컴포넌트를 그리지 않는다 (kakaoMapKey)
// - fit: 핀이 바뀔 때마다 모든 핀이 보이게 범위를 맞춘다 (장소 검색 결과)
// - selectedId: 고른 핀을 테두리로 보인다
// - 바텀시트처럼 크기가 0에서 커지는 곳에서는 카카오 지도가 빈 칸으로 그려진다. 크기가 바뀌면 relayout하고 가운데를 다시 맞춘다
import { h, render, onBeforeUnmount, onMounted, ref, watch, defineProps, defineEmits } from 'vue'
import CategoryIcon from '../rule/CategoryIcon.vue'
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
    node.setAttribute('aria-label', p.aria || p.label)
    node.onclick = () => emit('select', p)
    const head = document.createElement('span')
    head.className = 'map-pin__head'
    if (p.icon) render(h(CategoryIcon, { rule: p.icon, size: '20px' }), head)
    else head.appendChild(Object.assign(document.createElement('span'), { className: 'map-pin__dot' }))
    if (p.count > 1) head.appendChild(Object.assign(document.createElement('span'), { className: 'map-pin__count', textContent: String(p.count) }))
    const tail = Object.assign(document.createElement('span'), { className: 'map-pin__tail' })
    const label = Object.assign(document.createElement('span'), { className: 'map-pin__label', textContent: p.label })
    node.append(head, tail, label)
    // 꼬리 끝(머리 40 + 꼬리 7 = 47px)이 그 자리에 오게. 이름표(약 20px)는 그 아래
    const o = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(p.lat, p.lon), content: node, yAnchor: 47 / 69, zIndex: p.id === props.selectedId ? 2 : 1 })
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
/* 지도 위는 늘 밝은 지도라 다크 모드와 상관없이 같은 색 (검정 머리 + 형광 아이콘, 흰 이름표) */
.map-pin { display: flex; flex-direction: column; align-items: center; background: none; padding: 0; border: 0; cursor: pointer; }
.map-pin__head { position: relative; width: 40px; height: 40px; border-radius: 9999px; display: flex; align-items: center; justify-content: center;
  background: rgb(17 17 19); color: rgb(var(--c-signal)); border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, .35); transition: transform .15s; }
.map-pin__dot { width: 10px; height: 10px; border-radius: 9999px; background: rgb(var(--c-signal)); }
.map-pin__tail { width: 0; height: 0; margin-top: -1px; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid rgb(17 17 19); }
.map-pin__count { position: absolute; top: -6px; right: -8px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 9999px; font-size: 11px; font-weight: 700; line-height: 20px; text-align: center;
  background: rgb(var(--c-signal)); color: rgb(17 17 19); border: 2px solid #fff; }
.map-pin__label { margin-top: 2px; max-width: 120px; padding: 1px 7px; border-radius: 9999px; font-size: 11px; font-weight: 600; line-height: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  background: #fff; color: rgb(17 17 19); box-shadow: 0 1px 3px rgba(0, 0, 0, .25); }
/* 끝난 경기: 흰 머리 */
.map-pin--muted .map-pin__head { background: #fff; color: rgb(17 17 19); border-color: rgb(17 17 19 / .15); }
.map-pin--muted .map-pin__tail { border-top-color: #fff; }
.map-pin--muted .map-pin__dot { background: rgb(17 17 19); }
/* 장소를 아직 안 정한 경기: 동 가운데에 둔 대략의 자리라 흰 머리에 점선 */
.map-pin--approx .map-pin__head { background: rgb(255 255 255 / .96); color: rgb(17 17 19); border: 2px dashed rgb(17 17 19 / .6); }
.map-pin--approx .map-pin__tail { border-top-color: rgb(17 17 19 / .6); }
.map-pin--approx .map-pin__dot { background: rgb(17 17 19); }
.map-pin--on .map-pin__head { transform: scale(1.15); box-shadow: 0 0 0 3px rgb(var(--c-signal)), 0 2px 8px rgba(0, 0, 0, .4); }
</style>
