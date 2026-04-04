<template>
  <div class="deployments-page">
    <div class="page-header">
      <div class="header-left">
        <h2>Deployments</h2>
        <select v-model="selectedNamespace" @change="loadDeployments" class="namespace-select">
          <option value="">All Namespaces</option>
          <option v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</option>
        </select>
      </div>
      <button class="refresh-btn" @click="loadDeployments" :disabled="loading">
        <RefreshCw :size="18" :class="{ spinning: loading }" />
        Refresh
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && deployments.length === 0" class="loading-message">
      Loading deployments...
    </div>

    <div v-else-if="deployments.length === 0" class="empty-message">
      No deployments found
    </div>

    <div v-else class="deployments-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Status</th>
            <th>Replicas</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="deployment in deployments" :key="`${deployment.namespace}-${deployment.name}`">
            <td class="name-cell">
              <Box :size="16" />
              {{ deployment.name }}
            </td>
            <td>{{ deployment.namespace }}</td>
            <td>
              <span class="status-badge" :class="{ running: deployment.status.includes('运行中') }">
                {{ deployment.status }}
              </span>
            </td>
            <td>{{ deployment.replicas }}</td>
            <td>{{ deployment.update_time }}</td>
            <td class="actions-cell">
              <button class="action-btn" @click="viewPods(deployment)" title="View Pods">
                <Layers :size="16" />
              </button>
              <button class="action-btn restart" @click="restartDeployment(deployment)" title="Restart">
                <RotateCcw :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showPodsModal" class="modal-overlay" @click.self="closePodsModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Pods in {{ selectedDeployment?.name }}</h3>
          <button class="close-btn" @click="closePodsModal">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-content">
          <div v-if="loadingPods" class="loading-message">Loading pods...</div>
          <div v-else-if="currentPods.length === 0" class="empty-message">No pods found</div>
          <div v-else class="pods-list">
            <div v-for="pod in currentPods" :key="pod.name" class="pod-item">
              <div class="pod-header">
                <span class="pod-name">{{ pod.name }}</span>
                <span class="pod-status" :class="{ running: pod.status === 'Running' }">
                  {{ pod.status }}
                </span>
              </div>
              <div class="pod-details">
                <div class="detail">
                  <span class="label">Node:</span>
                  <span class="value">{{ pod.node_name }}</span>
                </div>
                <div class="detail">
                  <span class="label">IP:</span>
                  <span class="value">{{ pod.pod_ip }}</span>
                </div>
                <div class="detail">
                  <span class="label">Restarts:</span>
                  <span class="value">{{ pod.restart_count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useK8sStore } from '../stores/k8s'
import { Box, Layers, RefreshCw, RotateCcw, X } from 'lucide-vue-next'
import type { DeploymentStatus } from '../api/k8s'

interface DeploymentWithNamespace extends DeploymentStatus {
  namespace: string
}

const route = useRoute()
const k8sStore = useK8sStore()
const selectedNamespace = ref(route.params.namespace as string || '')
const loading = ref(false)
const error = ref('')
const showPodsModal = ref(false)
const selectedDeployment = ref<DeploymentWithNamespace | null>(null)
const loadingPods = ref(false)
const currentPods = ref<any[]>([])

const namespaces = computed(() => k8sStore.namespaces)

const deployments = computed(() => {
  const result: DeploymentWithNamespace[] = []
  k8sStore.deployments.forEach((deploymentsList, namespace) => {
    if (!selectedNamespace.value || namespace === selectedNamespace.value) {
      deploymentsList.forEach((d) => {
        result.push({ ...d, namespace })
      })
    }
  })
  return result
})

async function loadDeployments() {
  loading.value = true
  error.value = ''

  try {
    if (selectedNamespace.value) {
      await k8sStore.fetchDeployments(selectedNamespace.value)
    } else {
      for (const ns of namespaces.value) {
        await k8sStore.fetchDeployments(ns)
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load deployments'
  } finally {
    loading.value = false
  }
}

async function viewPods(deployment: DeploymentWithNamespace) {
  selectedDeployment.value = deployment
  showPodsModal.value = true
  loadingPods.value = true

  try {
    await k8sStore.fetchPods(deployment.name, deployment.namespace)
    const key = `${deployment.namespace}/${deployment.name}`
    currentPods.value = k8sStore.pods.get(key) || []
  } catch (err: any) {
    error.value = err.message || 'Failed to load pods'
  } finally {
    loadingPods.value = false
  }
}

function closePodsModal() {
  showPodsModal.value = false
  selectedDeployment.value = null
  currentPods.value = []
}

async function restartDeployment(deployment: DeploymentWithNamespace) {
  if (!confirm(`Are you sure you want to restart ${deployment.name}?`)) {
    return
  }

  const success = await k8sStore.restartDeployment(deployment.name, deployment.namespace)
  if (success) {
    alert('Deployment restarted successfully')
    await loadDeployments()
  } else {
    alert(k8sStore.error || 'Failed to restart deployment')
  }
}

watch(() => route.params.namespace, async (newNamespace) => {
  selectedNamespace.value = (newNamespace as string) || ''
  await loadDeployments()
})

onMounted(async () => {
  if (namespaces.value.length === 0) {
    await k8sStore.fetchNamespaces()
  }
  await loadDeployments()
})
</script>

<style scoped>
.deployments-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.namespace-select {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #4338ca;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message, .loading-message, .empty-message {
  padding: 24px;
  background: white;
  border-radius: 12px;
  text-align: center;
  color: #6b7280;
  margin-bottom: 24px;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
}

.deployments-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: #f9fafb;
}

td {
  padding: 16px;
  font-size: 14px;
  color: #111827;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.running {
  background: #ecfdf5;
  color: #059669;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
}

.action-btn:hover {
  background: #e5e7eb;
}

.action-btn.restart:hover {
  background: #fef3c7;
  color: #d97706;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.pods-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pod-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.pod-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pod-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.pod-status {
  padding: 4px 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pod-status.running {
  background: #ecfdf5;
  color: #059669;
}

.pod-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail .label {
  font-size: 12px;
  color: #6b7280;
}

.detail .value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}
</style>
