<template>
  <div class="namespaces-page">
    <div class="page-header">
      <h2>Namespaces</h2>
      <button class="refresh-btn" @click="refreshNamespaces" :disabled="loading">
        <RefreshCw :size="18" :class="{ spinning: loading }" />
        Refresh
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading && namespaces.length === 0" class="loading-message">
      Loading namespaces...
    </div>

    <div v-else class="namespaces-grid">
      <div
        v-for="(ns, index) in namespaces"
        :key="ns"
        class="namespace-card"
        @click="selectNamespace(ns)"
      >
        <div class="namespace-header">
          <div class="namespace-icon">
            <FolderTree :size="24" />
          </div>
          <div class="namespace-info">
            <h3>{{ ns }}</h3>
            <span class="namespace-index">#{{ index + 1 }}</span>
          </div>
        </div>
        <div class="namespace-actions">
          <router-link :to="`/deployments/${ns}`" class="action-btn">
            <Box :size="16" />
            Deployments
          </router-link>
          <router-link :to="`/pods/${ns}`" class="action-btn">
            <Layers :size="16" />
            Pods
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useK8sStore } from '../stores/k8s'
import { FolderTree, Box, Layers, RefreshCw } from 'lucide-vue-next'

const router = useRouter()
const k8sStore = useK8sStore()
const loading = ref(false)
const error = ref('')

const namespaces = computed(() => k8sStore.namespaces)

async function refreshNamespaces() {
  loading.value = true
  error.value = ''
  try {
    await k8sStore.fetchNamespaces()
  } catch (err: any) {
    error.value = err.message || 'Failed to load namespaces'
  } finally {
    loading.value = false
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.namespace-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.namespace-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.namespace-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.namespace-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.namespace-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.namespace-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.namespace-index {
  font-size: 12px;
  padding: 4px 12px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 12px;
}

.namespace-actions {
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
  border-radius: 8px;
  color: #4b5563;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #eef2ff;
  color: #4f46e5;
}
</style>
