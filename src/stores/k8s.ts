import { defineStore } from 'pinia'
import { ref } from 'vue'
import { k8sAPI } from '../api/k8s'
import type { NodeInfo, NodeDetailInfo, ClusterHealth, NamespaceList, DeploymentStatus, PodInfo, ServiceInfo } from '../api/k8s'

export const useK8sStore = defineStore('k8s', () => {
  const nodes = ref<NodeInfo[]>([])
  const nodeDetails = ref<NodeDetailInfo[]>([])
  const nodeCount = ref(0)
  const clusterHealth = ref<ClusterHealth | null>(null)
  const namespaces = ref<string[]>([])
  const deployments = ref<Map<string, DeploymentStatus[]>>(new Map())
  const pods = ref<Map<string, PodInfo[]>>(new Map())
  const services = ref<ServiceInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNodes() {
    loading.value = true
    error.value = null
    try {
      const response = await k8sAPI.getNodes()
      nodes.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch nodes'
    } finally {
      loading.value = false
    }
  }

  async function fetchNodeCount() {
    try {
      const response = await k8sAPI.getNodeCount()
      nodeCount.value = response.data.node_len
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch node count'
    }
  }

  async function fetchNodeDetails() {
    loading.value = true
    error.value = null
    try {
      const response = await k8sAPI.getNodeDetails()
      nodeDetails.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch node details'
    } finally {
      loading.value = false
    }
  }

  async function fetchClusterHealth() {
    try {
      const response = await k8sAPI.getClusterHealth()
      clusterHealth.value = response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch cluster health'
    }
  }

  async function fetchNamespaces() {
    try {
      const response = await k8sAPI.getNamespaceList()
      namespaces.value = response.data.namespaces
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch namespaces'
    }
  }

  async function fetchDeployments(namespace: string) {
    loading.value = true
    error.value = null
    try {
      const response = await k8sAPI.getDeployments(namespace)
      deployments.value.set(namespace, response.data.Status)
    } catch (err: any) {
      error.value = err.message || `Failed to fetch deployments in ${namespace}`
    } finally {
      loading.value = false
    }
  }

  async function fetchPods(name: string, namespace: string) {
    loading.value = true
    error.value = null
    try {
      const response = await k8sAPI.getDeploymentPods(name, namespace)
      const key = `${namespace}/${name}`
      pods.value.set(key, response.data.data)
    } catch (err: any) {
      error.value = err.message || `Failed to fetch pods for ${name}`
    } finally {
      loading.value = false
    }
  }

  async function restartDeployment(name: string, namespace: string) {
    try {
      await k8sAPI.restartDeployment(name, namespace)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || `Failed to restart ${name}`
      return false
    }
  }

  async function deletePod(namespace: string, podName: string, force?: boolean) {
    try {
      await k8sAPI.deletePod(namespace, podName, force)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || `Failed to delete ${podName}`
      return false
    }
  }

  async function getPodLogs(namespace: string, pod: string, params?: { container?: string; tail?: number }) {
    try {
      const response = await k8sAPI.getPodLogs(namespace, pod, params)
      return response.data
    } catch (err: any) {
      error.value = err.message || `Failed to fetch logs for ${pod}`
      return null
    }
  }

  async function getPodLogsStream(
    namespace: string, 
    pod: string, 
    params: { container?: string; tail?: number },
    onMessage: (data: string) => void
  ) {
    try {
      const response = await k8sAPI.getPodLogsStream(namespace, pod, params)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      
      if (!reader) {
        throw new Error('Failed to get reader')
      }
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data) {
              onMessage(data)
            }
          } else if (line.trim()) {
            onMessage(line)
          }
        }
      }
      
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6).trim()
        if (data) {
          onMessage(data)
        }
      }
    } catch (err: any) {
      error.value = err.message || `Failed to stream logs for ${pod}`
      throw err
    }
  }

  async function fetchServices(namespace: string) {
    loading.value = true
    error.value = null
    try {
      const response = await k8sAPI.getServices(namespace)
      services.value = response.data.services
    } catch (err: any) {
      error.value = err.message || `Failed to fetch services in ${namespace}`
    } finally {
      loading.value = false
    }
  }

  async function deleteService(namespace: string, serviceName: string) {
    try {
      await k8sAPI.deleteService(namespace, serviceName)
      services.value = services.value.filter(
        (s) => !(s.namespace === namespace && s.name === serviceName)
      )
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || err.response?.data?.message || `Failed to delete ${serviceName}`
      return false
    }
  }

  return {
    nodes,
    nodeDetails,
    nodeCount,
    clusterHealth,
    namespaces,
    deployments,
    pods,
    services,
    loading,
    error,
    fetchNodes,
    fetchNodeCount,
    fetchNodeDetails,
    fetchClusterHealth,
    fetchNamespaces,
    fetchDeployments,
    fetchPods,
    restartDeployment,
    deletePod,
    getPodLogs,
    getPodLogsStream,
    fetchServices,
    deleteService,
  }
})
