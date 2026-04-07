<template>
  <div class="nodes-page">
    <div class="page-header">
      <h2>Kubernetes Nodes</h2>
      <button class="refresh-btn" @click="refreshNodes" :disabled="k8sStore.loading">
        <RefreshCw :size="18" :class="{ spinning: k8sStore.loading }" />
        Refresh
      </button>
    </div>

    <div v-if="k8sStore.error" class="error-message">
      {{ k8sStore.error }}
    </div>

    <div v-if="k8sStore.loading && k8sStore.nodes.length === 0" class="loading-message">
      Loading nodes...
    </div>

    <div v-else class="nodes-grid">
      <div v-for="node in displayNodes" :key="node.name" class="node-card">
        <div class="node-header">
          <div class="node-title">
            <Server :size="20" />
            <h3>{{ node.name }}</h3>
          </div>
          <div class="node-status" :class="{ ready: node.status === 'Ready' }">
            {{ node.status }}
          </div>
        </div>

        <div class="node-info-grid">
          <div class="info-item">
            <span class="label">Role</span>
            <span class="value role-badge" :class="node.role">{{ node.role }}</span>
          </div>
          <div class="info-item">
            <span class="label">CPU</span>
            <span class="value">{{ node.cpu }} cores</span>
          </div>
          <div class="info-item">
            <span class="label">Memory</span>
            <span class="value">{{ formatMemory(node.memory) }}</span>
          </div>
        </div>

        <div v-if="node.labels && Object.keys(node.labels).length > 0" class="node-labels">
          <div class="labels-title">Labels</div>
          <div class="labels-list">
            <span v-for="(value, key) in getDisplayLabels(node.labels)" :key="key" class="label-badge">
              {{ key }}
            </span>
            <span v-if="Object.keys(node.labels).length > 4" class="more-badge">
              +{{ Object.keys(node.labels).length - 4 }}
            </span>
          </div>
        </div>

        <div class="node-actions">
          <button class="action-btn" @click="viewNodeDetails(node)">
            <Eye :size="16" />
            Details
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ selectedNode?.name }}</h3>
          <button class="close-btn" @click="closeDetailsModal">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedNode" class="details">
            <div class="detail-section">
              <h4>Basic Info</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">Role</span>
                  <span class="value role-badge" :class="selectedNode.role">{{ selectedNode.role }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Status</span>
                  <span class="value status-badge" :class="{ ready: selectedNode.status === 'Ready' }">
                    {{ selectedNode.status }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">CPU</span>
                  <span class="value">{{ selectedNode.cpu }} cores</span>
                </div>
                <div class="detail-item">
                  <span class="label">Memory</span>
                  <span class="value">{{ formatMemory(selectedNode.memory) }}</span>
                </div>
                <div v-if="'ip' in selectedNode && selectedNode.ip" class="detail-item">
                  <span class="label">IP</span>
                  <span class="value">{{ (selectedNode as NodeDetailInfo).ip }}</span>
                </div>
                <div v-if="'osType' in selectedNode && selectedNode.osType" class="detail-item">
                  <span class="label">OS</span>
                  <span class="value">{{ (selectedNode as NodeDetailInfo).osType }}</span>
                </div>
              </div>
            </div>

            <div v-if="hasVersionInfo" class="detail-section">
              <h4>Version</h4>
              <div class="detail-grid">
                <div v-if="'kubeletVersion' in selectedNode && selectedNode.kubeletVersion" class="detail-item">
                  <span class="label">Kubelet</span>
                  <span class="value">{{ (selectedNode as NodeDetailInfo).kubeletVersion }}</span>
                </div>
                <div v-if="'kubeProxy' in selectedNode && selectedNode.kubeProxy" class="detail-item">
                  <span class="label">Kube-Proxy</span>
                  <span class="value">{{ (selectedNode as NodeDetailInfo).kubeProxy }}</span>
                </div>
                <div v-if="'dockerVersion' in selectedNode && selectedNode.dockerVersion" class="detail-item">
                  <span class="label">Container</span>
                  <span class="value">{{ (selectedNode as NodeDetailInfo).dockerVersion }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedNode.taints && selectedNode.taints.length > 0" class="detail-section">
              <h4>Taints</h4>
              <div class="tags-list">
                <span v-for="taint in selectedNode.taints" :key="taint" class="taint-badge">
                  {{ taint }}
                </span>
              </div>
            </div>

            <div v-if="selectedNode.labels && Object.keys(selectedNode.labels).length > 0" class="detail-section">
              <h4>Labels</h4>
              <div class="tags-list">
                <span v-for="(value, key) in selectedNode.labels" :key="key" class="label-badge">
                  {{ key }}: {{ value }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useK8sStore } from '../stores/k8s'
import { Server, RefreshCw, Eye, X } from 'lucide-vue-next'
import type { NodeInfo, NodeDetailInfo } from '../api/k8s'

const k8sStore = useK8sStore()
const showDetailsModal = ref(false)
const selectedNode = ref<NodeInfo | NodeDetailInfo | null>(null)

const displayNodes = computed(() => {
  const basicNodes = k8sStore.nodes
  const detailedNodes = k8sStore.nodeDetails

  if (basicNodes.length > 0 && basicNodes[0].cpu) {
    return basicNodes
  }

  if (detailedNodes.length > 0) {
    return detailedNodes
  }

  return basicNodes
})

const hasVersionInfo = computed(() => {
  if (!selectedNode.value) return false
  const node = selectedNode.value as NodeDetailInfo
  return !!(node.kubeletVersion || node.kubeProxy || node.dockerVersion)
})

function getDisplayLabels(labels?: Record<string, string>) {
  if (!labels) return {}
  return Object.fromEntries(Object.entries(labels).slice(0, 4))
}

function viewNodeDetails(node: NodeInfo | NodeDetailInfo) {
  selectedNode.value = node
  showDetailsModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedNode.value = null
}

function formatMemory(memory: string): string {
  if (!memory) return 'N/A'
  const match = memory.match(/^(\d+)(Ki|Mi|Gi|Ti)$/i)
  if (match) {
    const value = parseInt(match[1])
    const unit = match[2].toUpperCase()
    if (unit === 'KI') {
      return `${(value / 1024 / 1024).toFixed(2)} GB`
    } else if (unit === 'MI') {
      return `${(value / 1024).toFixed(2)} GB`
    } else if (unit === 'GI') {
      return `${value} GB`
    } else if (unit === 'TI') {
      return `${value} TB`
    }
  }
  return memory
}

async function refreshNodes() {
  await Promise.all([k8sStore.fetchNodes(), k8sStore.fetchNodeDetails()])
}

onMounted(async () => {
  await refreshNodes()
})
</script>

<style scoped>
.nodes-page {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
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

.error-message, .loading-message {
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

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.node-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-title h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.node-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #fef2f2;
  color: #dc2626;
}

.node-status.ready {
  background: #ecfdf5;
  color: #059669;
}

.node-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #6b7280;
}

.info-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.role-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  text-transform: capitalize;
  display: inline-block;
}

.role-badge.master {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.worker {
  background: #dbeafe;
  color: #1e40af;
}

.node-labels {
  margin-bottom: 16px;
}

.labels-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label-badge {
  padding: 4px 10px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 8px;
  font-size: 12px;
}

.more-badge {
  padding: 4px 10px;
  background: #e5e7eb;
  color: #6b7280;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.node-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  color: #4f46e5;
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
  color: #111827;
}

.close-btn {
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
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

.details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.detail-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
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

.status-badge {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  background: #fef2f2;
  color: #dc2626;
}

.status-badge.ready {
  background: #ecfdf5;
  color: #059669;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.taint-badge {
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
}

.label-badge {
  padding: 4px 10px;
  background: white;
  color: #4b5563;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
}
</style>
