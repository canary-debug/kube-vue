import apiClient from '../utils/axios'

export interface NodeInfo {
  name: string
  status: string
  taints: string[]
  role: string
  cpu: string
  memory: string
  labels?: Record<string, string>
}

export interface NodeDetailInfo extends NodeInfo {
  ip: string
  osType: string
  osVersion: string
  kubeletVersion: string
  kubeProxy: string
  dockerVersion: string
  coreVersion: string
  nodecreatetime: string
}

export interface ClusterHealth {
  status: string
  reason?: string
  details?: {
    unhealthy_pods: number
    crash_pods: number
    dns_active: boolean
  }
}

export interface NamespaceCount {
  namespaces: number
}

export interface NamespaceList {
  namespaces: string[]
}

export interface DeploymentStatus {
  name: string
  status: string
  replicas: number
  update_time: string
}

export interface PodInfo {
  name: string
  status: string
  restart_count: number
  ports: number[]
  node_name: string
  pod_ip: string
  created_at: string
  labels?: Record<string, string>
}

export interface PodListResponse {
  data: PodInfo[]
  total: number
  message: string
}

export interface ContainerInfo {
  name: string
  restart_count: number
  state: string
  ports: number[]
}

export interface ContainerListResponse {
  code: number
  data: ContainerInfo[]
}

export interface ServiceInfo {
  name: string
  namespace: string
  cluster_ip: string
  external_ip: string | null
  port: number | null
  node_port: number | null
  target_port: string | null
  protocol: string | null
  creation_timestamp: string
}

export interface ServiceListResponse {
  services: ServiceInfo[]
  total: number
}

export const k8sAPI = {
  getNodes: () => {
    return apiClient.get<NodeInfo[]>('/api/k8s/get/nodes')
  },

  getNodeCount: () => {
    return apiClient.get<{ node_len: number }>('/api/k8s/get/nodes/len')
  },

  getNodeDetails: () => {
    return apiClient.get<NodeDetailInfo[]>('/api/k8s/get/nodename')
  },

  getClusterHealth: () => {
    return apiClient.get<ClusterHealth>('/api/k8s/get/cluster_healthz')
  },

  getNamespaceCount: () => {
    return apiClient.get<NamespaceCount>('/api/k8s/get/namespaces')
  },

  getNamespaceList: () => {
    return apiClient.get<NamespaceList>('/api/k8s/get/namespaces/namespacename')
  },

  getDeployments: (namespace: string) => {
    return apiClient.get<{ Status: DeploymentStatus[] }>(`/api/k8s/get/deployment/${namespace}`)
  },

  getDeploymentPods: (name: string, namespace: string) => {
    return apiClient.post<PodListResponse>('/api/k8s/deployment/pods', { name, namespace })
  },

  restartDeployment: (name: string, namespace: string) => {
    return apiClient.post<{ message: string }>('/api/k8s/restart/deployment', { name, namespace })
  },

  getDaemonSets: (namespace: string) => {
    return apiClient.get<{ Status: DeploymentStatus[] }>(`/api/k8s/get/daemonset/${namespace}`)
  },

  getDaemonSetPods: (name: string, namespace: string) => {
    return apiClient.post<PodListResponse>('/api/k8s/daemonset/pods', { name, namespace })
  },

  getStatefulSets: (namespace: string) => {
    return apiClient.get<{ Status: DeploymentStatus[] }>(`/api/k8s/get/statefulset/${namespace}`)
  },

  getStatefulSetPods: (name: string, namespace: string) => {
    return apiClient.post<PodListResponse>('/api/k8s/statefulset/pods', { name, namespace })
  },

  deletePod: (namespace: string, podName: string, force?: boolean) => {
    const params = force ? `?force=${force}` : ''
    return apiClient.delete(`/api/k8s/delete/pod/${namespace}/${podName}${params}`)
  },

  getPodLogs: (namespace: string, pod: string, params?: { container?: string; follow?: boolean; tail?: number }) => {
    return apiClient.get(`/api/k8s/pod/logs/${namespace}/${pod}`, { params })
  },

  getPodContainers: (namespace: string, podName: string) => {
    return apiClient.get<ContainerListResponse>(`/api/k8s/get/pod/containers/${namespace}/${podName}`)
  },

  getServices: (namespace: string) => {
    return apiClient.get<ServiceListResponse>(`/api/k8s/get/services/${namespace}`)
  },

  deleteService: (namespace: string, serviceName: string) => {
    return apiClient.delete(`/api/k8s/delete/service/${namespace}/${serviceName}`)
  },
}
