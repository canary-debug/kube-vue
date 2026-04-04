<template>
  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="page-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 260px;
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
