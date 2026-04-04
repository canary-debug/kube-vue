<template>
  <div class="namespaces-page">
    <div class="page-header">
      <h2>Namespaces</h2>
      <button class="refresh-btn" @click="refreshNamespaces" :disabled="k8sStore.loading">
        <RefreshCw :size="18" :class="{ spinning: k8sStore.loading }" />
        Refresh
      </button>
    </div>

    <div v-if="k8sStore.error" class="error-message">
      {{ k8sStore.error }}
    </div>

    <div v-if="k8sStore.loading && namespaces.length === 0" class="loading-message">
      Loading namespaces...
    </div>

    <div v-else class="namespaces-grid">
      <div
        v-for="ns in namespaces"
        :key="ns"
        class="namespace-card"
        @click="selectNamespace(ns)"
      >
        <div class="namespace-icon">
          <FolderTree :size="32" />
        </div>
        <div class="namespace-name">{{ ns }}</div>
        <div class="namespace-badge">Active</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useK8sStore } from '../stores/k8s'
import { FolderTree, RefreshCw } from 'lucide-vue-next'

const router = useRouter()
const k8sStore = useK8sStore()

const namespaces = computed(() => k8sStore.namespaces)

async function refreshNamespaces() {
  try {
    await k8sStore.fetchNamespaces()
  } catch (err) {
    console.error('Failed to fetch namespaces:', err)
  }
}

function selectNamespace(ns: string) {
  router.push(`/deployments/${ns}`)
}

onMounted(async () => {
  if (namespaces.value.length === 0) {
    await refreshNamespaces()
  }
})
</script>

<style scoped>
.namespaces-page {
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

.namespaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}

.namespace-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 180px;
}

.namespace-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.namespace-card:hover .namespace-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.namespace-card:hover .namespace-name {
  color: white;
}

.namespace-card:hover .namespace-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.namespace-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  transition: all 0.2s;
}

.namespace-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  word-break: break-word;
  transition: color 0.2s;
}

.namespace-badge {
  padding: 4px 12px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}
</style>
