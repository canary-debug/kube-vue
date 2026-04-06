<template>
  <aside class="sidebar">
    <div class="logo">
      <Server :size="28" />
      <span>Kube-Vue</span>
    </div>

    <nav class="nav-menu">
      <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
        <LayoutDashboard :size="20" />
        <span>Dashboard</span>
      </router-link>

      <div class="nav-group">
        <div class="nav-group-title" @click="toggleGroup('cluster')">
          <span>Cluster</span>
          <ChevronDown :size="16" class="chevron" :class="{ rotated: expandedGroups.cluster }" />
        </div>
        <div class="nav-group-items" v-show="expandedGroups.cluster">
          <router-link to="/nodes" class="nav-item" :class="{ active: route.path === '/nodes' }">
            <HardDrive :size="20" />
            <span>Nodes</span>
          </router-link>
          <router-link to="/namespaces" class="nav-item" :class="{ active: route.path === '/namespaces' }">
            <FolderTree :size="20" />
            <span>Namespaces</span>
          </router-link>
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-group-title" @click="toggleGroup('monitoring')">
          <span>监控大屏</span>
          <ChevronDown :size="16" class="chevron" :class="{ rotated: expandedGroups.monitoring }" />
        </div>
        <div class="nav-group-items" v-show="expandedGroups.monitoring">
          <router-link to="/monitoring" class="nav-item" :class="{ active: route.path === '/monitoring' }">
            <Activity :size="20" />
            <span>监控工具</span>
          </router-link>
        </div>
      </div>

      <div class="nav-group">
        <div class="nav-group-title" @click="toggleGroup('workloads')">
          <span>应用负载</span>
          <ChevronDown :size="16" class="chevron" :class="{ rotated: expandedGroups.workloads }" />
        </div>
        <div class="nav-group-items" v-show="expandedGroups.workloads">
          <router-link to="/deployments" class="nav-item" :class="{ active: route.path.startsWith('/deployments') }">
            <Box :size="20" />
            <span>Deployments</span>
          </router-link>
          <router-link to="/pods" class="nav-item" :class="{ active: route.path.startsWith('/pods') }">
            <Layers :size="20" />
            <span>Pods</span>
          </router-link>
          <router-link to="/daemonsets" class="nav-item" :class="{ active: route.path.startsWith('/daemonsets') }">
            <Repeat :size="20" />
            <span>DaemonSets</span>
          </router-link>
          <router-link to="/statefulsets" class="nav-item" :class="{ active: route.path.startsWith('/statefulsets') }">
            <Database :size="20" />
            <span>StatefulSets</span>
          </router-link>
          <router-link to="/services" class="nav-item" :class="{ active: route.path.startsWith('/services') }">
            <Network :size="20" />
            <span>Services</span>
          </router-link>
        </div>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <User :size="20" />
        <span>{{ authStore.user?.username || 'Admin' }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  Server,
  LayoutDashboard,
  HardDrive,
  FolderTree,
  Box,
  Layers,
  Repeat,
  Database,
  User,
  Network,
  Activity,
  ChevronDown,
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const expandedGroups = reactive({
  cluster: true,
  monitoring: false,
  workloads: false,
})

function toggleGroup(group: keyof typeof expandedGroups) {
  expandedGroups[group] = !expandedGroups[group]
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 260px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  font-size: 20px;
  font-weight: 700;
  color: #4f46e5;
  border-bottom: 1px solid #e5e7eb;
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-group {
  margin-bottom: 8px;
}

.nav-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  user-select: none;
}

.nav-group-title:hover {
  background: #f3f4f6;
  color: #4b5563;
}

.chevron {
  transition: transform 0.3s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.nav-group-items {
  margin-top: 4px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #4b5563;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #4f46e5;
}

.nav-item.active {
  background: #eef2ff;
  color: #4f46e5;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #4b5563;
}
</style>
