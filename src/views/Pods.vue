<template>
  <div class="pods-page">
    <div class="page-header">
      <div class="header-left">
        <h2>Pods</h2>
        <select v-model="selectedNamespace" class="namespace-select">
          <option value="">All Namespaces</option>
          <option v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</option>
        </select>
      </div>
      <button class="refresh-btn" @click="loadPods" :disabled="loading">
        <RefreshCw :size="18" :class="{ spinning: loading }" />
        Refresh
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && pods.length === 0" class="loading-message">
      Loading pods...
    </div>

    <div v-else-if="filteredPods.length === 0" class="empty-message">
      No pods found
    </div>

    <div v-else class="pods-grid">
      <div v-for="pod in filteredPods" :key="pod.name" class="pod-card">
        <div class="pod-header">
          <div class="pod-icon">
            <Layers :size="20" />
          </div>
          <div class="pod-info">
            <h3>{{ pod.name }}</h3>
            <span class="pod-namespace">{{ pod.namespace }}</span>
          </div>
          <div class="pod-status" :class="{ running: pod.status === 'Running' }">
            {{ pod.status }}
          </div>
        </div>

        <div class="pod-details">
          <div class="detail-item">
            <span class="label">Node</span>
            <span class="value">{{ pod.node_name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">IP</span>
            <span class="value">{{ pod.pod_ip }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Restarts</span>
            <span class="value" :class="{ warning: pod.restart_count > 0 }">
              {{ pod.restart_count }}
            </span>
          </div>
          <div class="detail-item">
            <span class="label">Created</span>
            <span class="value">{{ formatDate(pod.created_at) }}</span>
          </div>
        </div>

        <div v-if="pod.labels" class="pod-labels">
          <span v-for="(value, key) in pod.labels" :key="key" class="label-tag">
            {{ key }}: {{ value }}
          </span>
        </div>

        <div class="pod-actions">
          <button class="action-btn" @click="viewLogs(pod)">
            <FileText :size="16" />
            Logs
          </button>
          <button class="action-btn delete" @click="deletePod(pod)">
            <Trash2 :size="16" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <div v-if="showLogsModal" class="modal-overlay" @click.self="closeLogsModal">
      <div class="modal logs-modal">
        <div class="modal-header">
          <h3>Logs: {{ selectedPod?.name }}</h3>
          <div class="modal-actions">
            <button class="action-btn" @click="loadLogs" :disabled="loadingLogs">
              <RefreshCw :size="16" :class="{ spinning: loadingLogs }" />
            </button>
            <button class="close-btn" @click="closeLogsModal">
              <X :size="20" />
            </button>
          </div>
        </div>
        <div class="modal-content">
          <div class="logs-controls">
            <select v-model="selectedContainer" class="container-select">
              <option v-for="container in podContainers" :key="container.name" :value="container.name">
                {{ container.name }}
              </option>
            </select>
            <input
              v-model.number="tailLines"
              type="number"
              placeholder="Tail lines"
              class="tail-input"
              min="10"
              max="500"
            />
            <label class="follow-toggle">
              <input type="checkbox" v-model="followLogs" @change="toggleFollow" />
              <span>实时</span>
            </label>
            <button class="refresh-btn small" @click="loadLogs">
              Load
            </button>
          </div>
          <div v-if="loadingLogs" class="loading-message">Loading logs...</div>
          <pre ref="logsContentRef" v-else class="logs-content">{{ podLogs || 'No logs available' }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useK8sStore } from '../stores/k8s'
import { Layers, RefreshCw, FileText, Trash2, X } from 'lucide-vue-next'
import type { PodInfo, ContainerInfo } from '../api/k8s'

interface PodWithNamespace extends PodInfo {
  namespace: string
}

const route = useRoute()
const k8sStore = useK8sStore()
const selectedNamespace = ref(route.params.namespace as string || '')
const loading = ref(false)
const error = ref('')
const pods = ref<PodWithNamespace[]>([])
const showLogsModal = ref(false)
const selectedPod = ref<PodWithNamespace | null>(null)
const loadingLogs = ref(false)
const podLogs = ref('')
const podContainers = ref<ContainerInfo[]>([])
const selectedContainer = ref('')
const tailLines = ref(100)
const followLogs = ref(false)
const logsContentRef = ref<HTMLPreElement | null>(null)
let streamController: AbortController | null = null

const namespaces = computed(() => k8sStore.namespaces)

const filteredPods = computed(() => {
  if (!selectedNamespace.value) return pods.value
  return pods.value.filter((p) => p.namespace === selectedNamespace.value)
})

async function loadPods() {
  loading.value = true
  error.value = ''
  pods.value = []

  try {
    const namespace = selectedNamespace.value || namespaces.value[0] || 'default'
    await k8sStore.fetchDeployments(namespace)

    const deployments = k8sStore.deployments.get(namespace) || []
    for (const deployment of deployments) {
      await k8sStore.fetchPods(deployment.name, namespace)
      const key = `${namespace}/${deployment.name}`
      const podList = k8sStore.pods.get(key) || []
      podList.forEach((pod) => {
        pods.value.push({ ...pod, namespace })
      })
    }

    if (!selectedNamespace.value) {
      for (const ns of namespaces.value) {
        if (ns !== namespace) {
          await k8sStore.fetchDeployments(ns)
          const deploys = k8sStore.deployments.get(ns) || []
          for (const dep of deploys) {
            await k8sStore.fetchPods(dep.name, ns)
            const k = `${ns}/${dep.name}`
            const pList = k8sStore.pods.get(k) || []
            pList.forEach((pod) => {
              pods.value.push({ ...pod, namespace: ns })
            })
          }
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load pods'
  } finally {
    loading.value = false
  }
}

async function viewLogs(pod: PodWithNamespace) {
  selectedPod.value = pod
  showLogsModal.value = true
  podContainers.value = []
  podLogs.value = ''

  try {
    const { k8sAPI } = await import('../api/k8s')
    const response = await k8sAPI.getPodContainers(pod.namespace, pod.name)
    podContainers.value = response.data.data
    if (podContainers.value.length > 0) {
      selectedContainer.value = podContainers.value[0].name
    }
    await loadLogs()
  } catch (err: any) {
    error.value = err.message || 'Failed to load containers'
  }
}

async function loadLogs() {
  if (!selectedPod.value) return

  loadingLogs.value = true
  try {
    const logs = await k8sStore.getPodLogs(selectedPod.value.namespace, selectedPod.value.name, {
      container: selectedContainer.value || undefined,
      tail: tailLines.value,
    })
    podLogs.value = logs || 'No logs available'
  } catch (err: any) {
    podLogs.value = 'Failed to load logs: ' + (err.message || 'Unknown error')
  } finally {
    loadingLogs.value = false
  }
}

function closeLogsModal() {
  showLogsModal.value = false
  selectedPod.value = null
  podLogs.value = ''
  podContainers.value = []
  followLogs.value = false
  stopStream()
}

function stopStream() {
  if (streamController) {
    streamController.abort()
    streamController = null
  }
}

async function toggleFollow() {
  if (followLogs.value) {
    await startStream()
  } else {
    stopStream()
  }
}

async function startStream() {
  if (!selectedPod.value) return

  stopStream()
  podLogs.value = ''
  loadingLogs.value = true
  podLogs.value = '正在建立实时日志连接...\n'

  try {
    const streamCallback = (data: string) => {
      podLogs.value += data + '\n'
      setTimeout(() => {
        if (logsContentRef.value) {
          logsContentRef.value.scrollTop = logsContentRef.value.scrollHeight
        }
      }, 0)
    }

    await k8sStore.getPodLogsStream(
      selectedPod.value.namespace,
      selectedPod.value.name,
      {
        container: selectedContainer.value || undefined,
        tail: tailLines.value,
      },
      streamCallback
    )
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      podLogs.value += '\n连接错误: ' + (err.message || '未知错误') + '\n'
    }
  } finally {
    loadingLogs.value = false
  }
}

watch([selectedContainer, tailLines], () => {
  if (followLogs.value) {
    followLogs.value = false
    stopStream()
  }
})

onUnmounted(() => {
  stopStream()
})

async function deletePod(pod: PodWithNamespace) {
  if (!confirm(`Are you sure you want to delete pod ${pod.name}?`)) {
    return
  }

  const success = await k8sStore.deletePod(pod.namespace, pod.name)
  if (success) {
    alert('Pod deleted successfully')
    await loadPods()
  } else {
    alert(k8sStore.error || 'Failed to delete pod')
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString()
  } catch {
    return dateStr
  }
}

watch(() => route.params.namespace, async (newNamespace) => {
  selectedNamespace.value = (newNamespace as string) || ''
  await loadPods()
})

onMounted(async () => {
  if (namespaces.value.length === 0) {
    await k8sStore.fetchNamespaces()
  }
  await loadPods()
})
</script>

<style scoped>
.pods-page {
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

.refresh-btn.small {
  padding: 6px 12px;
  font-size: 12px;
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

.pods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.pod-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.pod-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.pod-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 10px;
  color: white;
}

.pod-info {
  flex: 1;
}

.pod-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.pod-namespace {
  font-size: 12px;
  color: #6b7280;
}

.pod-status {
  padding: 6px 14px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.pod-status.running {
  background: #ecfdf5;
  color: #059669;
}

.pod-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item .label {
  font-size: 12px;
  color: #6b7280;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.detail-item .value.warning {
  color: #d97706;
}

.pod-labels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.label-tag {
  padding: 4px 10px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 12px;
  font-size: 11px;
  font-family: monospace;
}

.pod-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #f9fafb;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e5e7eb;
}

.action-btn.delete:hover {
  background: #fef2f2;
  color: #dc2626;
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
  max-width: 900px;
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

.modal-actions {
  display: flex;
  gap: 8px;
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
  display: flex;
  flex-direction: column;
}

.logs-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.container-select, .tail-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.container-select {
  flex: 1;
}

.tail-input {
  width: 120px;
}

.follow-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.follow-toggle:hover {
  background: #e5e7eb;
}

.follow-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.follow-toggle input[type="checkbox"]:checked + span {
  color: #4f46e5;
  font-weight: 600;
}

.follow-toggle.active {
  background: #eef2ff;
  color: #4f46e5;
}

.logs-content {
  flex: 1;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 400px;
  max-height: 60vh;
  overflow-y: auto;
}
</style>
