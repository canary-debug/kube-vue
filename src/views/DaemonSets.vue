<template>
  <div class="daemonsets-page">
    <div class="page-header">
      <div class="header-left">
        <h2>DaemonSets</h2>
        <select v-model="selectedNamespace" class="namespace-select">
          <option value="">All Namespaces</option>
          <option v-for="ns in namespaces" :key="ns" :value="ns">{{ ns }}</option>
        </select>
      </div>
      <button class="refresh-btn" @click="loadDaemonSets" :disabled="loading">
        <RefreshCw :size="18" :class="{ spinning: loading }" />
        Refresh
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="loading && daemonSets.length === 0" class="loading-message">
      Loading DaemonSets...
    </div>

    <div v-else-if="filteredDaemonSets.length === 0" class="empty-message">
      No DaemonSets found
    </div>

    <div v-else class="daemonsets-grid">
      <div v-for="ds in filteredDaemonSets" :key="`${ds.namespace}-${ds.name}`" class="daemonset-card">
        <div class="ds-header">
          <div class="ds-icon"><Repeat :size="20" /></div>
          <div class="ds-info">
            <h3>{{ ds.name }}</h3>
            <span class="ds-namespace">{{ ds.namespace }}</span>
          </div>
          <div class="ds-status" :class="{ running: ds.status.includes('运行中') }">
            {{ ds.status }}
          </div>
        </div>
        <div class="ds-details">
          <div class="detail"><span class="label">Replicas:</span><span class="value">{{ ds.replicas }}</span></div>
          <div class="detail"><span class="label">Updated:</span><span class="value">{{ ds.update_time }}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useK8sStore } from '../stores/k8s'
import { Repeat, RefreshCw } from 'lucide-vue-next'
import { k8sAPI } from '../api/k8s'

const k8sStore = useK8sStore()
const selectedNamespace = ref('')
const loading = ref(false)
const error = ref('')
const daemonSets = ref<any[]>([])

const namespaces = computed(() => k8sStore.namespaces)
const filteredDaemonSets = computed(() => {
  if (!selectedNamespace.value) return daemonSets.value
  return daemonSets.value.filter(ds => ds.namespace === selectedNamespace.value)
})

async function loadDaemonSets() {
  loading.value = true
  error.value = ''
  daemonSets.value = []
  try {
    const nss = selectedNamespace.value ? [selectedNamespace.value] : namespaces.value
    for (const ns of nss) {
      const response = await k8sAPI.getDaemonSets(ns)
      response.data.Status.forEach((ds: any) => {
        daemonSets.value.push({ ...ds, namespace: ns })
      })
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load DaemonSets'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (namespaces.value.length === 0) await k8sStore.fetchNamespaces()
  await loadDaemonSets()
})
</script>

<style scoped>
.daemonsets-page { max-width: 1400px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.header-left { display: flex; align-items: center; gap: 16px; }
.page-header h2 { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
.namespace-select { padding: 8px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; }
.refresh-btn:hover:not(:disabled) { background: #4338ca; }
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.error-message, .loading-message, .empty-message { padding: 24px; background: white; border-radius: 12px; text-align: center; color: #6b7280; margin-bottom: 24px; }
.error-message { background: #fef2f2; color: #dc2626; }
.daemonsets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; }
.daemonset-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); padding: 20px; }
.ds-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
.ds-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; }
.ds-info { flex: 1; }
.ds-info h3 { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 4px 0; }
.ds-namespace { font-size: 12px; color: #6b7280; }
.ds-status { padding: 6px 14px; background: #fef2f2; color: #dc2626; border-radius: 20px; font-size: 12px; font-weight: 600; }
.ds-status.running { background: #ecfdf5; color: #059669; }
.ds-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.detail { display: flex; flex-direction: column; gap: 4px; }
.detail .label { font-size: 12px; color: #6b7280; }
.detail .value { font-size: 14px; font-weight: 500; color: #111827; }
</style>
