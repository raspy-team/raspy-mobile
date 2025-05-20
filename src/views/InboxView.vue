<template>
  <Header :has-referer="true" title="인박스"></Header>
  <div class="pt-20 pb-6 px-4 max-w-3xl mx-auto">
    <div class="flex justify-center space-x-4 mb-6">
      <button @click="activeTab = 'sent'" :class="tabClass('sent')">보낸 요청</button>
      <button @click="activeTab = 'received'" :class="tabClass('received')">받은 요청</button>
    </div>
    <MyRequestsTab v-if="activeTab === 'sent'" />
    <ApplicantsTab v-else />
  </div>
  <Footer tab="inbox"></Footer>
</template>

<script setup>
import { ref } from 'vue'
import Header from "../components/HeaderComp.vue"
import Footer from "../components/FooterNav.vue"
import MyRequestsTab from '../components/Inbox/MyRequestsTab.vue'
import ApplicantsTab from '../components/Inbox/ApplicantsTab.vue'

const activeTab = ref('sent')
const tabClass = (tab) =>
  `px-4 py-2 rounded-full font-semibold border ${activeTab.value === tab ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`
</script>
