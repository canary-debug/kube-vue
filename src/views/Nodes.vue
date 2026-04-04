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
      <div v-for="node in k8sStore.nodeDetails" :key="node.name" class="node-card">
        <div class="node-header">
          <div class="node-title">
            <Server :size="20" />
            <h3>{{ node.name }}</h3>
          </div>
          <div class="node-status" :class="{ ready: node.status === 'Ready' }">
            {{ node.status }}
          </div>
        </div>

        <div class="node-details">
          <div class="detail-row">
            <span class="label">Role:</span>
            <span class="value role-badge">{{ node.role }}</span>
          </div>
          <div class="detail-row">
            <span class="label">IP Address:</span>
            <span class="value">{{ node.ip }}</span>
          </div>
          <div class="detail-row">
            <span class="label">OS Type:</span>
            <span class="value">{{ node.osType }}</span>
          </div>
          <div class="detail-row">
            <span class="label">OS Version:</span>
            <span class="value">{{ node.osVersion }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Kubelet Version:</span>
            <span class="value">{{ node.kubeletVersion }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Kube-Proxy:</span>
            <span class="value">{{ node.kubeProxy }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Container Runtime:</span>
            <span class="value">{{ node.dockerVersion }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Kernel Version:</span>
            <span class="value">{{ node.coreVersion }}</span>
          </div>
          <div class="detail-row">
            <span class="label">CPU:</span>
            <span class="value">{{ node.cpu }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Memory:</span>
            <span class="value">{{ node.memory }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Created:</span>
            <span class="value">{{ formatDate(node.nodecreatetime) }}</span>
          </div>
        </div>

        <div v-if="node.taints && node.taints.length > 0" class="node-taints">
          <div class="taints-title">Taints:</div>
          <div class="taints-list">
            <span v-for="taint in node.taints" :key="taint" class="taint-badge">
              {{ taint }}
            </span>
          </div>
        </div>

        <div v-if="node.labels" class="node-labels">
          <div class="labels-title">Labels:</div>
          <div class="labels-list">
            <span v-for="(value, key) in node.labels" :key="key" class="label-badge">
              {{ key }}: {{ value }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useK8sStore } from '../stores/k8s'
import { Server, RefreshCw } from 'lucide-vue-next'

const k8sStore = useK8sStore()

async function refreshNodes() {
  await Promise.all([k8sStore.fetchNodes(), k8sStore.fetchNodeDetails()])
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString()
  } catch {
    return dateStr
  }
}

onMounted(async () => {
  if (k8sStore.nodes.length === 0) {
    await refreshNodes()
  }
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
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
}

.node-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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
  padding: 6px 16px;
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

.node-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
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

.role-badge {
  padding: 4px 12px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.node-taints, .node-labels {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.taints-title, .labels-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.taints-list, .labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.taint-badge {
  padding: 4px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
  font-family: monospace;
}

.label-badge {
  padding: 4px 12px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 12px;
  font-size: 12px;
  font-family: monospace;
}
</style>
