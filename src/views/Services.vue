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

        <div class="service-actions">
          <button class="action-btn delete" @click="confirmDelete(service)">
            <Trash2 :size="16" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal delete-modal">
        <div class="modal-header">
          <h3>确认删除服务</h3>
          <button class="close-btn" @click="closeDeleteModal">
            <X :size="20" />
          </button>
        </div>
        <!-- <div class="modal-content">
          <p>Are you sure you want to delete the service <strong>{{ selectedService?.name }}</strong> in namespace <strong>{{ selectedService?.namespace }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div> -->
        <div class="modal-content">
          <p>您确定要删除命名空间 <strong>{{ selectedService?.namespace }}</strong> 中的服务 <strong>{{ selectedService?.name }}</strong> 吗？</p>
          <p class="warning-text">此操作无法撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn delete" @click="deleteService" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
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
import { Network, RefreshCw, Trash2, X } from 'lucide-vue-next'
import type { ServiceInfo } from '../api/k8s'

const route = useRoute()
const k8sStore = useK8sStore()
const selectedNamespace = ref(route.params.namespace as string || 'all')
const loading = ref(false)
const error = ref('')
const services = ref<ServiceInfo[]>([])
const showDeleteModal = ref(false)
const selectedService = ref<ServiceInfo | null>(null)
const deleting = ref(false)

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

function confirmDelete(service: ServiceInfo) {
  selectedService.value = service
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedService.value = null
}

async function deleteService() {
  if (!selectedService.value) return

  deleting.value = true
  error.value = ''

  try {
    const success = await k8sStore.deleteService(
      selectedService.value.namespace,
      selectedService.value.name
    )

    if (success) {
      services.value = services.value.filter(
        (s) => !(s.namespace === selectedService.value!.namespace && s.name === selectedService.value!.name)
      )
      closeDeleteModal()
    } else {
      error.value = k8sStore.error || 'Failed to delete service'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to delete service'
  } finally {
    deleting.value = false
  }
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

.service-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #374151;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.action-btn.delete {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.action-btn.delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-content {
  padding: 24px;
}

.modal-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.modal-content .warning-text {
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.cancel {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn.cancel:hover {
  background: #f9fafb;
}

.btn.delete {
  background: #dc2626;
  border: none;
  color: white;
}

.btn.delete:hover:not(:disabled) {
  background: #b91c1c;
}

.btn.delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
