<template>
  <svg
    v-if="parsed.stroked"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    :stroke-width="strong ? 2.25 : 1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="ui-icon"
    :class="parsed.extra"
    aria-hidden="true"
    v-html="parsed.stroked"
  ></svg>
  <svg
    v-else-if="parsed.custom"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    class="ui-icon"
    :class="parsed.extra"
    aria-hidden="true"
    v-html="parsed.custom"
  ></svg>
  <component
    :is="parsed.component"
    v-else
    size="1em"
    :stroke-width="strong ? 2.25 : 1.75"
    :fill="parsed.filled ? 'currentColor' : 'none'"
    class="ui-icon"
    :class="parsed.extra"
    aria-hidden="true"
  />
</template>

<script setup>
// 앱의 모든 아이콘. 한 벌(Lucide, 선 굵기 1.75)로 통일한다.
// 예전 Font Awesome 이름('fas fa-plus')을 그대로 받아 같은 뜻의 아이콘으로 그린다. 크기는 글자 크기(1em)를 따른다
// 새 코드는 name="plus"처럼 이름만 써도 된다. 'fas'(꽉 찬)는 하트·별처럼 켜진 상태를 보여줄 때만 채운다
import { computed, defineProps } from 'vue'
import {
  ArrowDown, ArrowLeft, ArrowRight, Award, Ban, Bell, BookOpen, Calendar, CalendarCheck, Camera, ChartBar,
  ChartLine, ChartNoAxesColumn, Check, ChefHat, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, CircleHelp,
  CircleX, ClipboardCheck, Clock, Coins, Crown, Dices, Download, Ellipsis, Eye, EyeOff, FileText, Flag, FlagTriangleRight,
  Folder, FolderOpen, Gavel, Hand, Heading, Heart, Hourglass, House, Keyboard, Images, Inbox, Info, Instagram, Layers,
  LayoutGrid, List, ListOrdered, LogOut, Mail, MapPin, MessageCircle, Minus, Pencil, Play, Plus, RotateCcw, RotateCw,
  Search, Send, Settings, Share, Ship, ShieldHalf, Square, SquarePen, Star, Target, Timer, TriangleAlert, Trophy, Trash2,
  Unplug, User, Swords, Handshake, Scale, CircleCheck, Circle, Activity, Globe, SunMoon, GalleryVerticalEnd, UserCheck, UserMinus, UserPlus, Users, UserX, Video, X, Zap, AtSign, Newspaper, Gamepad2,
} from 'lucide-vue-next'

const props = defineProps({
  name: { type: String, required: true },
  filled: { type: Boolean, default: false },
  strong: { type: Boolean, default: false }, // 켜진 탭처럼 조금 굵게
})

const ICONS = {
  'arrow-down': ArrowDown, 'arrow-left': ArrowLeft, 'arrow-right': ArrowRight,
  'arrow-up-from-bracket': Share, share: Share, 'share-nodes': Share,
  at: AtSign, ban: Ban, bell: Bell, bolt: Zap, 'book-open': BookOpen, 'border-all': LayoutGrid,
  handshake: Handshake, 'scale-unbalanced': Scale, 'circle-check': CircleCheck, circle: Circle,
  bullseye: Target, calendar: Calendar, 'calendar-check': CalendarCheck, camera: Camera,
  'chart-bar': ChartBar, 'chart-line': ChartLine, 'chart-simple': ChartNoAxesColumn,
  check: Check, 'chef-hat': ChefHat, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-up': ChevronUp,
  'circle-question': CircleHelp, 'circle-xmark': CircleX, 'clipboard-check': ClipboardCheck, clock: Clock, coins: Coins,
  comment: MessageCircle, crown: Crown, dice: Dices, download: Download, ellipsis: Ellipsis, envelope: Mail,
  'exclamation-circle': CircleAlert, eye: Eye, 'eye-slash': EyeOff, 'file-lines': FileText,
  flag: Flag, 'flag-checkered': FlagTriangleRight, folder: Folder, 'folder-open': FolderOpen,
  gavel: Gavel, gear: Settings, hand: Hand, heading: Heading, heart: Heart, 'hourglass-half': Hourglass,
  home: House, images: Images, keyboard: Keyboard, inbox: Inbox, 'info-circle': Info, instagram: Instagram,
  'layer-group': Layers, list: List, 'list-ol': ListOrdered, 'location-dot': MapPin,
  gamepad: Gamepad2, minus: Minus, 'magnifying-glass': Search, search: Search, newspaper: Newspaper, 'paper-plane': Send,
  pen: Pencil, 'pen-to-square': SquarePen, play: Play, 'plug-circle-exclamation': Unplug, plus: Plus,
  'ranking-star': Award, redo: RotateCw, 'right-from-bracket': LogOut, 'rotate-left': RotateCcw, 'rotate-right': RotateCw,
  'shield-halved': ShieldHalf, ship: Ship, star: Star, stop: Square, stopwatch: Timer, times: X, xmark: X,
  trash: Trash2, 'triangle-exclamation': TriangleAlert, trophy: Trophy,
  user: User, 'user-check': UserCheck, 'user-group': Users, users: Users, 'user-minus': UserMinus,
  'user-plus': UserPlus, 'user-slash': UserX, video: Video, swords: Swords, activity: Activity, globe: Globe, 'sun-moon': SunMoon, feed: GalleryVerticalEnd,
}

// Lucide에 없는 상표 아이콘
const CUSTOM = {
  apple:
    '<path d="M16.37 12.6c-.02-2.16 1.77-3.2 1.85-3.25-1-1.47-2.57-1.67-3.13-1.7-1.33-.13-2.6.79-3.28.79-.68 0-1.72-.77-2.83-.75-1.46.02-2.8.85-3.55 2.15-1.51 2.63-.39 6.52 1.09 8.65.72 1.04 1.58 2.21 2.71 2.17 1.09-.04 1.5-.7 2.81-.7 1.31 0 1.68.7 2.83.68 1.17-.02 1.91-1.06 2.62-2.1.83-1.21 1.17-2.38 1.19-2.44-.03-.01-2.28-.87-2.31-3.5zM14.22 6.27c.6-.73 1-1.74.89-2.75-.86.03-1.9.57-2.52 1.3-.55.64-1.04 1.67-.91 2.66.96.07 1.94-.49 2.54-1.21z"/>',
}

// 직접 그린 선 아이콘 (Lucide와 같은 격자·굵기)
const STROKED = {
  // 두 사람이 만나 한 판: 겹친 두 원 ('경기' 탭)
  versus: '<circle cx="8.5" cy="12" r="6"/><circle cx="15.5" cy="12" r="6"/>',
}

// 꽉 찬 모양이 '켜짐'을 뜻하는 것들 (좋아요, 평점)
const FILLABLE = new Set(['heart', 'star'])

const parsed = computed(() => {
  const tokens = props.name.trim().split(/\s+/)
  const solid = tokens.includes('fas')
  const icon = tokens.find((t) => t.startsWith('fa-') && t !== 'fa-lg' && t !== 'fa-fw')?.slice(3) || tokens.find((t) => !t.startsWith('fa')) || ''
  const extra = tokens.filter((t) => !['fas', 'far', 'fab', 'fa-lg', 'fa-fw'].includes(t) && !t.startsWith('fa-') && t !== icon)
  if (tokens.includes('fa-lg')) extra.push('text-[1.33em]')
  return {
    stroked: STROKED[icon],
    custom: CUSTOM[icon],
    component: ICONS[icon] || CircleHelp,
    filled: props.filled || (solid && FILLABLE.has(icon)),
    extra,
  }
})
</script>

<style>
.ui-icon { display: inline-block; flex-shrink: 0; vertical-align: -0.125em; }
</style>
