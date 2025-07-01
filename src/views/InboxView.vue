<template>
  <Header :has-referer="true" title="인박스"></Header>
  <div class="min-h-screen w-screen flex flex-col mt-[4rem]">
    <div class="flex justify-center sticky top-0 bg-white z-10 py-3">
      <button @click="activeTab = 'sent'"  class="flex-1 py-2 text-sm font-semibold" :class="activeTab === 'sent' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'">
        보낸 요청
      </button>
      <button @click="activeTab = 'received'" class="flex-1 py-2 text-sm font-semibold" :class="activeTab === 'received' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500'">
        받은 요청
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <MyRequestsTab v-if="activeTab === 'sent'" />
      <ApplicantsTab v-else />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Header from "../components/HeaderComp.vue"
import MyRequestsTab from '../components/Inbox/MyRequestsTab.vue'
import ApplicantsTab from '../components/Inbox/ApplicantsTab.vue'

const activeTab = ref('sent')

</script>
