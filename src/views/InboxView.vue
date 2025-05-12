<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Inbox</h1>
    <div class="flex space-x-4 mb-6">
      <button @click="activeTab = 'sent'" :class="tabClass('sent')">내가 보낸 요청</button>
      <button @click="activeTab = 'received'" :class="tabClass('received')">내 게임에 신청한 사람들</button>
    </div>
    <MyRequestsTab v-if="activeTab === 'sent'" />
    <ApplicantsTab v-else />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MyRequestsTab from '../components/Inbox/MyRequestsTab.vue'
import ApplicantsTab from '../components/Inbox/ApplicantsTab.vue'

const activeTab = ref('sent')
const tabClass = (tab) => `px-4 py-2 rounded ${activeTab.value === tab ? 'bg-blue-500 text-white' : 'bg-gray-200'}`
</script>

