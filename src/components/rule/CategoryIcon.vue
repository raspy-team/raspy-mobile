<template>
  <!-- 그림의 모양만 쓰고 색은 글자색을 따른다 (주황 그림이 흑백 화면과 따로 놀지 않게) -->
  <span
    class="inline-block bg-current flex-shrink-0"
    :style="{
      width: size, height: size,
      WebkitMaskImage: `url('${src}')`, maskImage: `url('${src}')`,
      WebkitMaskSize: 'contain', maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
    }"
    aria-hidden="true"
  ></span>
</template>

<script setup>
// 종목 그림 (public/category-picture). 그림 파일은 모양 틀로만 쓴다
import { computed, defineProps } from 'vue'
import { categoryImage } from '../../utils/rule'
const props = defineProps({
  rule: { type: Object, default: null },
  name: { type: String, default: '' }, // 큰 분류 이름처럼 그림 이름을 바로 줄 때
  size: { type: String, default: '1.5rem' },
})
const src = computed(() => (props.name ? `/category-picture/${props.name}.png` : categoryImage(props.rule)))
</script>
