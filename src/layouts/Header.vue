<template>
  <header class="header">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-right">
      <div class="cluster-status" :class="healthStatusClass">
        <Activity :size="16" />
        <span>{{ healthStatusText }}</span>
      </div>

      <button class="logout-btn" @click="handleLogout">
        <LogOut :size="18" />
        <span>Logout</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useK8sStore } from '../stores/k8s'
import { Activity, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const k8sStore = useK8sStore()

const pageTitleMap: Record<string, string> = {
  Dashboard: 'Dashboard',
  Nodes: 'Nodes',
  Namespaces: 'Namespaces',
  Deployments: 'Deployments',
  Pods: 'Pods',
  DaemonSets: 'DaemonSets',
  StatefulSets: 'StatefulSets',
}

const pageTitle = computed(() => {
  return pageTitleMap[route.name as string] || 'Dashboard'
})

const healthStatusClass = computed(() => {
  if (!k8sStore.clusterHealth) return ''
  return k8sStore.clusterHealth.status === 'Healthy' ? 'healthy' : 'unhealthy'
})

const healthStatusText = computed(() => {
  if (!k8sStore.clusterHealth) return 'Loading...'
  return k8sStore.clusterHealth.status === 'Healthy' ? 'Cluster Healthy' : 'Cluster Unhealthy'
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cluster-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.cluster-status.healthy {
  background: #ecfdf5;
  color: #059669;
}

.cluster-status.unhealthy {
  background: #fef2f2;
  color: #dc2626;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}
</style>
