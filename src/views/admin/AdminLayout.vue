<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="h-14 border-b bg-white flex items-center justify-between px-6">
      <div class="font-semibold">Raspy Admin</div>
      <nav class="flex gap-4 text-sm">
        <router-link to="/admin" class="hover:underline">Dashboard</router-link>
        <router-link to="/admin/users" class="hover:underline">Users</router-link>
        <router-link to="/admin/reports" class="hover:underline">Reports</router-link>
        <router-link to="/admin/games" class="hover:underline">Games</router-link>
      </nav>
    </header>
    <main class="p-6">
      <router-view />
    </main>
  </div>
  
</template>

<script setup>
</script>

<style scoped>
</style>


