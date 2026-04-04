<template>
  <div class="dashboard">
    <div class="greeting-section">
      <h2 class="greeting">{{ greeting }}, {{ username }}!</h2>
      <p class="greeting-time">{{ currentTime }}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon nodes">
          <HardDrive :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ nodeCount }}</div>
          <div class="stat-label">Total Nodes</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon namespaces">
          <FolderTree :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ namespaceCount }}</div>
          <div class="stat-label">Namespaces</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon deployments">
          <Box :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalDeployments }}</div>
          <div class="stat-label">Deployments</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon health" :class="{ healthy: isHealthy, unhealthy: !isHealthy }">
          <Activity :size="24" />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ clusterStatus }}</div>
          <div class="stat-label">Cluster Health</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <h3>Recent Nodes</h3>
          <router-link to="/nodes" class="view-all">View All</router-link>
        </div>
        <div class="card-content">
          <div v-if="k8sStore.loading" class="loading">Loading...</div>
          <div v-else-if="k8sStore.error" class="error">{{ k8sStore.error }}</div>
          <div v-else class="node-list">
            <div v-for="node in recentNodes" :key="node.name" class="node-item">
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-role">{{ node.role }}</div>
              </div>
              <div class="node-status" :class="{ ready: node.status === 'Ready' }">
                {{ node.status }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Cluster Health Details</h3>
        </div>
        <div class="card-content">
          <div v-if="k8sStore.clusterHealth" class="health-details">
            <div class="health-item">
              <span class="label">Status:</span>
              <span class="value" :class="{ healthy: isHealthy }">{{ k8sStore.clusterHealth.status }}</span>
            </div>
            <div v-if="k8sStore.clusterHealth.details" class="health-item">
              <span class="label">Unhealthy Pods:</span>
              <span class="value">{{ k8sStore.clusterHealth.details.unhealthy_pods }}</span>
            </div>
            <div v-if="k8sStore.clusterHealth.details" class="health-item">
              <span class="label">Crash Pods:</span>
              <span class="value">{{ k8sStore.clusterHealth.details.crash_pods }}</span>
            </div>
            <div v-if="k8sStore.clusterHealth.details" class="health-item">
              <span class="label">DNS Active:</span>
              <span class="value" :class="{ healthy: k8sStore.clusterHealth.details.dns_active }">
                {{ k8sStore.clusterHealth.details.dns_active ? 'Yes' : 'No' }}
              </span>
            </div>
            <div v-if="k8sStore.clusterHealth.reason" class="health-reason">
              <span class="label">Reason:</span>
              <span class="value">{{ k8sStore.clusterHealth.reason }}</span>
            </div>
          </div>
          <div v-else class="loading">Loading...</div>
        </div>
      </div>
    </div>

    <div class="card full-width">
      <div class="card-header">
        <h3>Quick Actions</h3>
      </div>
      <div class="card-content">
        <div class="actions-grid">
          <router-link to="/nodes" class="action-btn">
            <HardDrive :size="20" />
            <span>Manage Nodes</span>
          </router-link>
          <router-link to="/namespaces" class="action-btn">
            <FolderTree :size="20" />
            <span>View Namespaces</span>
          </router-link>
          <router-link to="/deployments" class="action-btn">
            <Box :size="20" />
            <span>Deployments</span>
          </router-link>
          <router-link to="/pods" class="action-btn">
            <Layers :size="20" />
            <span>Pods</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useK8sStore } from '../stores/k8s'
import { useAuthStore } from '../stores/auth'
import { HardDrive, FolderTree, Box, Layers, Activity } from 'lucide-vue-next'

const k8sStore = useK8sStore()
const authStore = useAuthStore()

const currentTime = ref('')
let timeInterval: number | null = null

const username = computed(() => {
  return authStore.user?.username || 'Admin'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) {
    return '早上好'
  } else if (hour >= 12 && hour < 18) {
    return '下午好'
  } else if (hour >= 18 && hour < 22) {
    return '晚上好'
  } else {
    return '夜深了'
  }
})

const updateTime = () => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }
  currentTime.value = now.toLocaleDateString('zh-CN', options)
}

const nodeCount = computed(() => k8sStore.nodeCount || k8sStore.nodes.length)
const namespaceCount = computed(() => k8sStore.namespaces.length)

const totalDeployments = computed(() => {
  let total = 0
  k8sStore.deployments.forEach((deployments) => {
    total += deployments.length
  })
  return total
})

const isHealthy = computed(() => {
  return k8sStore.clusterHealth?.status === 'Healthy'
})

const clusterStatus = computed(() => {
  return isHealthy.value ? 'Healthy' : 'Unhealthy'
})

const recentNodes = computed(() => {
  return k8sStore.nodes.slice(0, 5)
})

onMounted(async () => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 60000)

  await Promise.all([
    k8sStore.fetchNodes(),
    k8sStore.fetchNodeCount(),
    k8sStore.fetchNamespaces(),
    k8sStore.fetchClusterHealth(),
  ])
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.greeting-section {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.greeting {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.greeting-time {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
}

.stat-icon.nodes { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.namespaces { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.deployments { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.health.healthy { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.stat-icon.health.unhealthy { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.view-all {
  font-size: 14px;
  color: #4f46e5;
  text-decoration: none;
}

.view-all:hover {
  text-decoration: underline;
}

.card-content {
  min-height: 200px;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
}

.error {
  color: #dc2626;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.node-role {
  font-size: 12px;
  color: #6b7280;
  text-transform: capitalize;
}

.node-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
  background: #fef2f2;
  color: #dc2626;
}

.node-status.ready {
  background: #ecfdf5;
  color: #059669;
}

.health-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-item, .health-reason {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.label {
  font-size: 14px;
  color: #6b7280;
}

.value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.value.healthy {
  color: #059669;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  text-decoration: none;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
}
</style>
