<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-white px-6">
    <span class="raspy mb-4">RASPY</span>
    <p class="tagline mb-12">즐기고 경쟁하는, <span class="text-[var(--point-color)] font-bold">스포츠 플랫폼</span></p>
    <button @click="goToLogin" class="start-btn">시작하기</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goToLogin = () => router.push('/login')

const pointColor = '#ff6f1f'
document.documentElement.style.setProperty('--point-color', pointColor)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600&display=swap');

/* 타이틀 */
.raspy {
  font-family: 'Kanit', sans-serif;
  font-weight: 600;
  font-size: 2.7rem;
  letter-spacing: 0.04em;
  color: var(--point-color);
}

/* 태그라인 */
.tagline {
  font-family: 'Kanit', sans-serif;
  font-size: 1.15rem;
  color: #333;
  text-align: center;
}

/* 플랫 버튼 */
.start-btn {
  width: 100%;
  max-width: 240px;
  padding: 0.85rem 0;
  font-family: 'Kanit', sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
  background: var(--point-color);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: background 0.17s;
}

.start-btn:hover {
  background: #e65c00;
}

.start-btn:active {
  opacity: 0.88;
}
</style>
