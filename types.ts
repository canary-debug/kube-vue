
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  code: number;
  token?: string;
  msg?: string;
  error?: string;
}

export interface RegisterResponse {
  message?: string;
  user?: User;
  error?: string;
}

export interface ControllerResource {
  name: string;
  replicas: number;
  images: string[];
  ready: number;
  updated: number;
  available: number;
  created_at: string;
  update_at: string;
  port: number;
}

// New deployment response format from API
export interface DeploymentResponse {
  Status: Array<{
    name: string;
    replicas: number;
    status: string;
    update_time: string;
  }>;
}

export interface NamespaceControllers {
  namespace: string;
  deployments: ControllerResource[];
  statefulsets: ControllerResource[];
  daemonsets: any[]; // Similar structure
}

export interface ApiResponse<T> {
  code: number;
  data: T;
}

export interface NamespaceListResponse {
  namespaces: string[];
}

export interface NamespaceControllersResponse {
  namespace: string;
  deployments: ControllerResource[];
  statefulsets: ControllerResource[];
  daemonsets: any[];
}

export interface NodeBrief {
  name: string;
  status: string;
  role: string;
  cpu: string;
  memory: string;
  taints: any[];
}

// New interface for node count API response
export interface NodeCountResponse {
  node_len: number;
}

export interface NodeDetail {
  name: string;
  status: string;
  role: string;
  ip: string;
  osType: string;
  osVersion: string;
  kubeletVersion: string;
  kubeProxy: string;
  dockerVersion: string;
  coreVersion: string;
  nodecreatetime: string;
  taints: any[];
}

export interface NamespaceList {
  namespaces: string[];
}

export interface PodResource {
  pod: {
    metadata: {
      name: string;
      namespace: string;
      labels: Record<string, string>;
    };
    spec: {
      containers: Array<{
        name: string;
        image: string;
        ports: Array<{ containerPort: number }>;
      }>;
    };
    status: {
      phase: string;
      conditions: Array<{ type: string; status: string }>;
    };
  };
}
