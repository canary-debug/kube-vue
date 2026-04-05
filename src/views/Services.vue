<template>
  <div class="services-page">
    <div class="page-header">
      <div class="header-left">
        <h2>Services</h2>
        <select v-model="selectedNamespace" class="namespace-select">
          <option value="all">All Namespaces</option>
          <option v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</option>
        </select>
      </div>
      <button class="refresh-btn" @click="loadServices" :disabled="loading">
        <RefreshCw :size="18" :class="{ spinning: loading }" />
        Refresh
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && services.length === 0" class="loading-message">
      Loading services...
    </div>

    <div v-else-if="filteredServices.length === 0" class="empty-message">
      No services found
    </div>

    <div v-else class="services-grid">
      <div v-for="service in filteredServices" :key="`${service.namespace}-${service.name}`" class="service-card">
        <div class="service-header">
          <div class="service-icon">
            <Network :size="20" />
          </div>
          <div class="service-info">
            <h3>{{ service.name }}</h3>
            <span class="service-namespace">{{ service.namespace }}</span>
          </div>
          <div class="service-type" :class="getServiceType(service)">
            {{ getServiceType(service) }}
          </div>
        </div>

        <div class="service-details">
          <div class="detail-item">
            <span class="label">Cluster IP</span>
            <span class="value">{{ service.cluster_ip }}</span>
          </div>
          <div class="detail-item" v-if="service.external_ip">
            <span class="label">External IP</span>
            <span class="value external">{{ service.external_ip }}</span>
          </div>
          <div class="detail-item" v-if="service.port">
            <span class="label">Port</span>
            <span class="value">{{ service.port }}</span>
          </div>
          <div class="detail-item" v-if="service.node_port">
            <span class="label">Node Port</span>
            <span class="value node-port">{{ service.node_port }}</span>
          </div>
          <div class="detail-item" v-if="service.target_port">
            <span class="label">Target Port</span>
            <span class="value">{{ service.target_port }}</span>
          </div>
          <div class="detail-item" v-if="service.protocol">
            <span class="label">Protocol</span>
            <span class="value protocol">{{ service.protocol }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Created</span>
            <span class="value">{{ formatDate(service.creation_timestamp) }}</span>
          </div>
        </div>

        <div class="service-access">
          <div v-if="service.node_port" class="access-info">
            <span class="access-label">Access:</span>
            <code>{{ service.node_port }}/{{ service.protocol?.toLowerCase() || 'tcp' }}</code>
          </div>
          <div v-else-if="service.port" class="access-info">
            <span class="access-label">Access:</span>
            <code>{{ service.cluster_ip }}:{{ service.port }}</code>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredServices.length > 0" class="services-footer">
      <span class="total-count">Total: {{ filteredServices.length }} services</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useK8sStore } from '../stores/k8s'
import { Network, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const k8sStore = useK8sStore()
const selectedNamespace = ref(route.params.namespace as string || 'all')
const loading = ref(false)
const error = ref('')
const services = ref(k8sStore.services)

const namespaces = computed(() => k8sStore.namespaces)

const filteredServices = computed(() => {
  if (selectedNamespace.value === 'all') return services.value
  return services.value.filter((s) => s.namespace === selectedNamespace.value)
})

async function loadServices() {
  loading.value = true
  error.value = ''
  services.value = []

  try {
    const namespace = selectedNamespace.value || 'all'
    await k8sStore.fetchServices(namespace)
    services.value = k8sStore.services
  } catch (err: any) {
    error.value = err.message || 'Failed to load services'
  } finally {
    loading.value = false
  }
}

function getServiceType(service: any): string {
  if (service.node_port) {
    return 'NodePort'
  } else if (service.external_ip) {
    return 'LoadBalancer'
  } else {
    return 'ClusterIP'
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(selectedNamespace, () => {
  loadServices()
})

onMounted(async () => {
  if (namespaces.value.length === 0) {
    await k8sStore.fetchNamespaces()
  }
  loadServices()
})
</script>

<style scoped>
.services-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.namespace-select:hover {
  border-color: #4f46e5;
}

.namespace-select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #4338ca;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 16px;
}

.loading-message,
.empty-message {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 16px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.service-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.service-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.service-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  border-radius: 8px;
  color: #4f46e5;
}

.service-info {
  flex: 1;
}

.service-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.service-namespace {
  font-size: 12px;
  color: #6b7280;
}

.service-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.service-type.NodePort {
  background: #fef3c7;
  color: #92400e;
}

.service-type.LoadBalancer {
  background: #dbeafe;
  color: #1e40af;
}

.service-type.ClusterIP {
  background: #d1fae5;
  color: #065f46;
}

.service-details {
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
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
}

.detail-item .value {
  font-size: 13px;
  color: #111827;
  font-weight: 500;
}

.detail-item .value.external {
  color: #2563eb;
}

.detail-item .value.node-port {
  color: #059669;
  font-family: 'Monaco', 'Courier New', monospace;
}

.detail-item .value.protocol {
  color: #7c3aed;
  font-weight: 600;
}

.service-access {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-top: 12px;
}

.access-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.access-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.access-info code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #4f46e5;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.services-footer {
  margin-top: 24px;
  text-align: center;
}

.total-count {
  font-size: 14px;
  color: #6b7280;
}
</style>
