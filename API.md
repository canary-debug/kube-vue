# Kube-Vue-Admin 后端接口文档

## 项目简介

**项目名称**: Kube-Vue-Admin  
**项目类型**: Kubernetes 集群管理后台系统  
**后端技术栈**: Go + Gin Framework  
**数据库**: MySQL + Redis  
**认证方式**: JWT (JSON Web Token)  
**服务端口**: 9000  
**API前缀**: `/api/auth` (认证接口) 和 `/api/k8s` (K8s管理接口)

---

## 认证相关接口

### 1. 用户登录

- **接口地址**: `/api/auth/login`
- **请求方法**: `POST`
- **认证要求**: 否
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，长度3-20字符 |
| password | string | 是 | 密码，长度6-30字符 |

#### 请求示例

```json
{
  "username": "admin",
  "password": "password123"
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "code": 200,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZXhwIjoxNzA5ODQ0MDAwfQ.xxx"
}
```

**用户不存在 (200)**

```json
{
  "code": 400,
  "msg": "用户不存在"
}
```

**密码错误 (401)**

```json
{
  "error": "用户名或密码错误"
}
```

**参数错误 (400)**

```json
{
  "message": "参数错误",
  "error": "Key: 'LoginRequest.Username' Error:Field validation for 'Username' failed"
}
```

#### 业务逻辑

1. 根据用户名从MySQL数据库查询用户记录
2. 使用bcrypt比对存储的密码哈希与输入密码
3. 验证通过后调用 `tokens.GenerateToken()` 生成JWT Token
4. 返回Token给客户端用于后续请求认证

---

### 2. 用户注册

- **接口地址**: `/api/auth/register`
- **请求方法**: `POST`
- **认证要求**: 否
- **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，长度3-20字符 |
| password | string | 是 | 密码，长度6-30字符 |
| email | string | 是 | 邮箱地址，标准email格式 |

#### 请求示例

```json
{
  "username": "newuser",
  "password": "securepass123",
  "email": "user@example.com"
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "message": "注册成功",
  "user": {
    "id": 2,
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

**用户名已存在 (409)**

```json
{
  "error": "用户名已存在"
}
```

**邮箱已注册 (409)**

```json
{
  "error": "邮箱已被注册"
}
```

**参数无效 (400)**

```json
{
  "error": "请求参数无效: username: length must be at least 3"
}
```

**服务器错误 (500)**

```json
{
  "error": "服务器内部错误"
}
```

#### 业务逻辑

1. 验证请求参数格式（使用Gin binding标签）
2. 查询数据库检查用户名是否已存在
3. 查询数据库检查邮箱是否已被注册
4. 使用bcrypt加密密码（成本因子：DefaultCost）
5. 创建用户记录到MySQL数据库
6. 返回新创建的用户信息（不含密码）

---

### 3. 用户退出登录

- **接口地址**: `/api/auth/logout`
- **请求方法**: `POST`
- **认证要求**: 是 (需要有效的JWT Token)
- **Authorization**: `Bearer <token>`

#### 响应示例

**成功响应 (200)**

```json
{
  "code": 200,
  "message": "退出登录成功",
  "data": {
    "username": "username"
  }
}
```

**未授权 (401)**

```json
{
  "code": 401,
  "message": "未找到认证信息，请重新登录"
}
```

```json
{
  "code": 401,
  "message": "Token 格式错误"
}
```

#### 业务逻辑

1. 从请求上下文获取JWT Token
2. 类型断言验证Token格式
3. 从Redis中删除该Token（键格式：`valid_token:<raw_token>`）
4. 解析Token获取用户Claims信息
5. 返回退出成功响应

---

## Kubernetes 集群管理接口

> 以下所有接口均需要携带有效的JWT Token进行认证

---

### 4. 获取节点列表

- **接口地址**: `/api/k8s/get/nodes`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 请求参数

无

#### 响应示例

**成功响应 (200)**

```json
[
  {
    "name": "master-node",
    "status": "Ready",
    "taints": ["node-role.kubernetes.io/master:NoSchedule"],
    "role": "master",
    "cpu": "4",
    "memory": "8123456Ki",
    "labels": {
      "kubernetes.io/arch": "amd64",
      "node-role.kubernetes.io/master": ""
    }
  },
  {
    "name": "worker-node-1",
    "status": "Ready",
    "taints": [],
    "role": "worker",
    "cpu": "8",
    "memory": "16777216Ki",
    "labels": {
      "kubernetes.io/arch": "amd64"
    }
  }
]
```

**失败响应 (500)**

```json
{
  "error": "Nodes Informer 尚未初始化"
}
```

```json
{
  "error": "获取缓存数据失败: ..."
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 节点名称 |
| status | string | 节点状态 (Ready/NotReady/Unknown) |
| taints | array | 节点污点列表，格式：`key=value:effect` |
| role | string | 节点角色 (master/worker) |
| cpu | string | CPU容量 |
| memory | string | 内存容量 |
| labels | object | 节点标签键值对 |

#### 业务逻辑

1. 检查Nodes Informer是否已初始化
2. 从本地Informer缓存获取所有节点列表
3. 遍历每个节点获取以下信息：
   - 污点列表：从 `Spec.Taints` 获取
   - 状态：根据 `Status.Conditions` 中 `Ready` 条件判断
   - 角色：根据标签识别 master 或 worker
   - 资源：从 `Status.Capacity` 获取CPU和内存
4. 返回节点信息数组

---

### 5. 获取节点数量

- **接口地址**: `/api/k8s/get/nodes/len`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

**成功响应 (200)**

```json
{
  "node_len": 5
}
```

#### 业务逻辑

从Nodes Informer缓存获取节点列表并返回长度

---

### 6. 获取节点详细信息

- **接口地址**: `/api/k8s/get/nodename`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

```json
[
  {
    "name": "master-node",
    "status": "Ready",
    "role": "master",
    "ip": "192.168.1.100",
    "osType": "linux",
    "osVersion": "Ubuntu 22.04.1 LTS",
    "kubeletVersion": "v1.27.0",
    "kube-proxy": "v1.27.0",
    "dockerVersion": "containerd://1.6.20",
    "coreVersion": "5.15.0-generic",
    "nodecreatetime": "2024-01-01 00:00:00 +0000 UTC",
    "taints": ["node-role.kubernetes.io/master:NoSchedule"]
  }
]
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 节点名称 |
| status | string | 节点状态 |
| role | string | 节点角色 |
| ip | string | 节点IP地址 (InternalIP) |
| osType | string | 操作系统类型 |
| osVersion | string | 操作系统版本 |
| kubeletVersion | string | Kubelet版本 |
| kube-proxy | string | Kube-Proxy版本 |
| dockerVersion | string | 容器运行时版本 |
| coreVersion | string | 内核版本 |
| nodecreatetime | string | 节点创建时间 |
| taints | array | 节点污点列表 |

#### 业务逻辑

直接调用Kubernetes Clientset获取节点详细信息，包含操作系统、版本、IP地址等

---

### 7. 获取集群健康状态

- **接口地址**: `/api/k8s/get/cluster_healthz`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

**健康状态 (200)**

```json
{
  "status": "Healthy"
}
```

**不健康状态 (500)**

```json
{
  "status": "Not Health",
  "reason": "存在异常Pod或网络问题",
  "details": {
    "unhealthy_pods": 5,
    "crash_pods": 3,
    "dns_active": true
  }
}
```

**失败响应 (500)**

```json
{
  "error": "Failed to list pods",
  "message": "connection refused"
}
```

#### 健康判断规则

1. 统计所有处于非Ready状态的容器数量
2. 统计处于CrashLoopBackOff或Error状态的容器
3. 检查CoreDNS Endpoints是否存在
4. 综合判断：
   - 如果CrashLoopBackOff容器 > 5，返回不健康
   - 如果CoreDNS不可用，返回不健康
   - 否则返回健康

---

## 命名空间相关接口

### 8. 获取命名空间数量

- **接口地址**: `/api/k8s/get/namespaces`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

```json
{
  "namespaces": 10
}
```

#### 业务逻辑

从Namespaces Informer缓存获取所有命名空间并返回数量

---

### 9. 获取命名空间列表

- **接口地址**: `/api/k8s/get/namespaces/namespacename`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

```json
{
  "namespaces": [
    "default",
    "kube-system",
    "kube-public",
    "production",
    "staging"
  ]
}
```

---

## Deployment 相关接口

### 10. 获取指定命名空间的Deployment列表

- **接口地址**: `/api/k8s/get/deployment/:namespace`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |

#### 响应示例

```json
{
  "Status": [
    {
      "name": "nginx-deployment",
      "status": "运行中 (3/3)",
      "replicas": 3,
      "update_time": "2024-01-15 10:30:00"
    },
    {
      "name": "redis-deployment",
      "status": "未就绪 (2/3)",
      "replicas": 2,
      "update_time": "2024-01-14 15:20:00"
    }
  ]
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | Deployment名称 |
| status | string | 运行状态，格式：`状态 (ReadyReplicas/Replicas)` |
| replicas | int32 | 当前就绪副本数 |
| update_time | string | 最后更新时间 |

#### 业务逻辑

1. 从Deployments Informer获取指定命名空间下的所有Deployment
2. 遍历获取每个Deployment的状态信息
3. 根据Available条件判断运行状态
4. 从ManagedFields获取最后更新时间

---

### 11. 获取Deployment下的所有Pod

- **接口地址**: `/api/k8s/deployment/pods`
- **请求方法**: `POST`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`
- **Content-Type**: `application/json`

#### 请求参数

```json
{
  "name": "nginx-deployment",
  "namespace": "default"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | Deployment名称 |
| namespace | string | 是 | 命名空间名称 |

#### 响应示例

```json
{
  "data": [
    {
      "name": "nginx-deployment-7fb96c846b-abc12",
      "status": "Running",
      "restart_count": 0,
      "ports": [80, 443],
      "node_name": "worker-node-1",
      "pod_ip": "10.244.1.15",
      "created_at": "2024-01-15T10:30:00Z",
      "labels": {
        "app": "nginx",
        "version": "v1"
      }
    }
  ],
  "total": 3,
  "message": "获取成功"
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | Pod名称 |
| status | string | Pod状态 (Pending/Running/Waiting/Terminated/Succeeded/Failed/Unknown) |
| restart_count | int32 | 所有容器的重启总次数 |
| ports | array | 容器端口列表 |
| node_name | string | 所在节点名称 |
| pod_ip | string | Pod IP地址 |
| created_at | time | 创建时间 |
| labels | object | Pod标签 |
| total | int | Pod总数 |
| message | string | 响应消息 |

#### 业务逻辑

1. 获取Deployment的LabelSelector
2. 使用Pod Informer根据选择器筛选Pod
3. 遍历Pod收集详细信息
4. 计算所有容器的重启次数总和
5. 判断Pod状态（综合容器状态）

---

### 12. 重启Deployment

- **接口地址**: `/api/k8s/restart/deployment`
- **请求方法**: `POST`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`
- **Content-Type**: `application/json`

#### 请求参数

```json
{
  "name": "nginx-deployment",
  "namespace": "default"
}
```

#### 响应示例

**成功响应 (200)**

```json
{
  "message": "Deployment nginx-deployment 在命名空间 default 中已触发重启"
}
```

**Deployment不存在 (500)**

```json
{
  "error": "deployment nginx-deployment 在命名空间 default 中不存在"
}
```

#### 业务逻辑

1. 获取当前Deployment配置
2. 在Pod Template的Annotations中添加时间戳：
   `kubectl.kubernetes.io/restartedAt: <RFC3339时间>`
3. 调用Kubernetes API更新Deployment
4. 触发滚动更新实现重启

---

## DaemonSet 相关接口

### 13. 获取指定命名空间的DaemonSet列表

- **接口地址**: `/api/k8s/get/daemonset/:namespace`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |

#### 响应示例

```json
{
  "Status": [
    {
      "name": "kube-proxy",
      "status": "运行中 (3/3)",
      "replicas": 3,
      "update_time": "2024-01-15 10:30:00"
    },
    {
      "name": "calico-node",
      "status": "同步中/部分就绪 (2/3)",
      "replicas": 2,
      "update_time": "2024-01-14 15:20:00"
    }
  ]
}
```

#### 业务逻辑

1. 从DaemonSets Informer获取指定命名空间下的所有DaemonSet
2. 获取DesiredNumberScheduled和NumberReady判断状态
3. 从ManagedFields获取最后更新时间

---

### 14. 获取DaemonSet下的所有Pod

- **接口地址**: `/api/k8s/daemonset/pods`
- **请求方法**: `POST`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`
- **Content-Type**: `application/json`

#### 请求参数

```json
{
  "name": "kube-proxy",
  "namespace": "kube-system"
}
```

#### 响应示例

```json
{
  "data": [
    {
      "name": "kube-proxy-abc12",
      "status": "Running",
      "restart_count": 0,
      "ports": [],
      "node_name": "master-node",
      "pod_ip": "192.168.1.10",
      "created_at": "2024-01-10T08:00:00Z",
      "labels": {
        "k8s-app": "kube-proxy"
      }
    }
  ],
  "total": 3,
  "message": "获取成功"
}
```

#### 业务逻辑

与Deployment获取Pod逻辑相同，使用DaemonSet的LabelSelector筛选Pod

---

## StatefulSet 相关接口

### 15. 获取指定命名空间的StatefulSet列表

- **接口地址**: `/api/k8s/get/statefulset/:namespace`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |

#### 响应示例

```json
{
  "Status": [
    {
      "name": "mysql",
      "status": "运行中 (2/2)",
      "replicas": 2,
      "update_time": "2024-01-15 09:00:00"
    },
    {
      "name": "redis",
      "status": "已停止 (0/0)",
      "replicas": 0,
      "update_time": "2024-01-15 10:00:00"
    }
  ]
}
```

#### 业务逻辑

1. 从StatefulSets Informer获取指定命名空间下的所有StatefulSet
2. 获取ReadyReplicas和期望副本数判断状态
3. 处理副本数为0的特殊情况
4. 从ManagedFields获取最后更新时间

---

### 16. 获取StatefulSet下的所有Pod

- **接口地址**: `/api/k8s/statefulset/pods`
- **请求方法**: `POST`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`
- **Content-Type**: `application/json`

#### 请求参数

```json
{
  "name": "mysql",
  "namespace": "production"
}
```

#### 响应示例

```json
{
  "data": [
    {
      "name": "mysql-0",
      "status": "Running",
      "restart_count": 0,
      "ports": [3306],
      "node_name": "worker-node-1",
      "pod_ip": "10.244.1.20",
      "created_at": "2024-01-15T08:00:00Z",
      "labels": {
        "app": "mysql"
      }
    },
    {
      "name": "mysql-1",
      "status": "Running",
      "restart_count": 1,
      "ports": [3306],
      "node_name": "worker-node-2",
      "pod_ip": "10.244.2.20",
      "created_at": "2024-01-15T08:01:00Z",
      "labels": {
        "app": "mysql"
      }
    }
  ],
  "total": 2,
  "message": "获取成功"
}
```

#### 业务逻辑

与Deployment获取Pod逻辑相同，使用StatefulSet的LabelSelector筛选Pod

---

## Pod 相关接口

### 17. 删除Pod

- **接口地址**: `/api/k8s/delete/pod/:namespace/:podname`
- **请求方法**: `DELETE`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |
| podname | string | 是 | Pod名称 |

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| force | string | 否 | "false" | 是否强制删除 (true/false) |

#### 响应示例

**成功响应 (200)**

```json
{
  "status": "success",
  "message": "Pod nginx-deployment-7fb96c846b-abc12 deletion triggered"
}
```

**Pod不存在 (404)**

```json
{
  "message": "Pod 不存在"
}
```

**删除失败 (500)**

```json
{
  "error": "pods \"nginx\" not found"
}
```

#### 业务逻辑

1. 检查force参数
2. 如果force=true，设置GracePeriodSeconds为0，使用后台删除策略
3. 调用Kubernetes API删除Pod
4. 返回删除结果

---

### 18. 获取Pod日志

- **接口地址**: `/api/k8s/pod/logs/:namespace/:pod`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |
| pod | string | 是 | Pod名称 |

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| container | string | 否 | - | 容器名称（多容器Pod必填） |
| follow | string | 否 | "false" | 是否实时流日志 (true/false) |
| tail | string | 否 | - | 显示最后多少行 |

#### 响应示例

**非实时日志 (200)**

```
Content-Type: text/plain

2024-01-15T10:30:00.000000000Z stdout F Starting nginx...
2024-01-15T10:30:01.000000000Z stdout F Nginx started successfully
2024-01-15T10:30:05.000000000Z stderr F [error] connection failed...
```

**实时流日志**

```
Content-Type: text/event-stream

data: 2024-01-15T10:30:00.000 stdout F Starting nginx...

data: 2024-01-15T10:30:01.000 stdout F Nginx started successfully
```

**参数错误 (400)**

```json
{
  "error": "namespace and pod are required"
}
```

**获取失败 (500)**

```json
{
  "error": "Failed to open stream: pods \"nginx\" not found"
}
```

#### 业务逻辑

1. 构建PodLogOptions配置
2. 调用Kubernetes API获取日志流
3. 根据follow参数决定返回方式：
   - follow=true: 使用SSE实时推送
   - follow=false: 一次性返回完整日志
4. 支持tail参数控制返回行数

---

### 19. 获取Pod的容器列表

- **接口地址**: `/api/k8s/get/pod/containers/:namespace/:podname`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |
| podname | string | 是 | Pod名称 |

#### 响应示例

**成功响应 (200)**

```json
{
  "code": 200,
  "data": [
    {
      "name": "nginx",
      "restart_count": 0,
      "state": "Running",
      "ports": [80, 443]
    },
    {
      "name": "sidecar",
      "restart_count": 2,
      "state": "Waiting",
      "ports": []
    }
  ]
}
```

**Pod不存在 (404)**

```json
{
  "code": 404,
  "message": "找不到指定的 Pod",
  "error": "pods \"nginx\" not found"
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 容器名称 |
| restart_count | int32 | 容器重启次数 |
| state | string | 容器状态 (Running/Waiting/Terminated/Unknown) |
| ports | array | 容器端口列表 |

#### 业务逻辑

1. 调用Kubernetes API获取Pod详情
2. 遍历Pod.Spec.Containers获取容器规格
3. 匹配Pod.Status.ContainerStatuses获取容器状态
4. 综合返回容器信息

---

### 20. 获取容器组（Pod列表）

- **接口地址**: `/api/k8s/get/container_group/:namespace`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称（空字符串表示所有命名空间） |

#### 响应示例

```json
{
  "pod": {
    "metadata": {...},
    "spec": {...},
    "status": {...}
  }
}
```

> 注：该接口对每个Pod返回一条JSON，格式为 `{ "pod": <pod_object> }`

---

### 21. 获取Pod总数

- **接口地址**: `/api/k8s/get/pods/len`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

```json
{
  "pod_count": 42
}
```

#### 业务逻辑

从Pods Informer缓存获取所有Pod并返回总数

---

## etcd 相关接口

### 22. 获取etcd状态

- **接口地址**: `/api/k8s/etcd/status`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

**成功响应 (200)**

```json
{
  "data": [
    {
      "name": "etcd-master-node",
      "healthy": true,
      "message": "",
      "ip": "192.168.1.10"
    },
    {
      "name": "etcd-worker-node-1",
      "healthy": false,
      "message": "Container not ready",
      "ip": "192.168.1.11"
    }
  ],
  "total": 2,
  "message": "通过 Pod 状态获取 etcd 信息成功"
}
```

**Informer未初始化 (500)**

```json
{
  "error": "Pod Informer 未初始化"
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | etcd Pod名称 |
| healthy | boolean | 是否健康 |
| message | string | 健康状态详情（不健康时包含原因） |
| ip | string | Pod IP地址 |
| total | int | etcd实例总数 |
| message | string | 响应消息 |

#### 业务逻辑

1. 在kube-system命名空间查找带有 `component=etcd` 标签的Pod
2. 如果按标签未找到，则按Pod名称模糊匹配包含"etcd"的Pod
3. 检查每个Pod的状态：
   - Pod处于Running且所有容器Ready → healthy=true
   - 否则 → healthy=false，记录原因
4. 返回所有etcd实例的健康状态

---

## WebSocket 终端接口

### 23. WebSocket终端连接

- **接口地址**: `/ws/terminal` (无需认证) 或 `/api/k8s/ws/terminal` (需要认证)
- **请求方法**: `GET`
- **协议**: WebSocket
- **认证要求**: 否（生产环境建议添加）

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| namespace | string | 否 | "default" | 命名空间名称 |
| pod | string | 是 | - | Pod名称 |
| container | string | 否 | - | 容器名称（多容器Pod必填） |

#### 客户端消息格式

**标准输入消息**

```json
{
  "operation": "stdin",
  "data": "ls -la\n"
}
```

**调整终端大小**

```json
{
  "operation": "resize",
  "rows": 30,
  "cols": 120
}
```

#### 服务端消息格式

服务端直接返回原始终端输出内容（字符串）

#### 使用示例

```javascript
// 建立WebSocket连接
const ws = new WebSocket('ws://localhost:9000/ws/terminal?namespace=default&pod=nginx-abc123&container=nginx');

// 发送命令
ws.send(JSON.stringify({
  operation: 'stdin',
  data: 'ls -la\n'
}));

// 接收输出
ws.onmessage = (event) => {
  console.log(event.data);
};

// 调整终端大小
ws.send(JSON.stringify({
  operation: 'resize',
  rows: 40,
  cols: 150
}));
```

#### 业务逻辑

1. 将HTTP连接升级为WebSocket连接
2. 使用SPDY协议与Kubernetes API Server建立exec连接
3. 在目标Pod中执行Shell命令 (`/bin/sh`)
4. 双向传递stdin/stdout/stderr数据
5. 支持终端窗口大小动态调整
6. 过滤可能导致显示问题的控制序列

---

## 其他接口

### 24. 获取天气信息

- **接口地址**: `/api/k8s/weather`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 响应示例

**成功响应 (200)**

```json
{
  "code": 200,
  "msg": "获取天气信息成功",
  "data": {
    "time_of_day": "早安",
    "temp": 15,
    "dressing_index": {
      "name": "穿衣指数",
      "brief": "较冷",
      "detail": "建议着厚外套加毛衣等服装"
    }
  }
}
```

**获取失败 (500)**

```json
{
  "code": 500,
  "msg": "获取天气信息失败",
  "error": "Get \"https://api.map.baidu.com/weather/v1/...\": dial tcp: lookup api.map.baidu.com..."
}
```

#### 业务逻辑

1. 调用百度天气API获取天气数据
2. 从返回数据中筛选"穿衣指数"
3. 根据当前时间返回问候语：
   - 06:00-12:00: "早安"
   - 12:00-18:00: "中午好"
   - 其他时间: "晚上好"
4. 返回温度和穿衣建议

---

### 25. 根路径测试

- **接口地址**: `/`
- **请求方法**: `GET`
- **认证要求**: 否

#### 响应示例

```json
{
  "message": "pong"
}
```

---

## 通用说明

### 认证机制

除以下接口外，其他接口均需要JWT Token认证：

- `/api/auth/login` - 用户登录
- `/api/auth/register` - 用户注册
- `/ws/terminal` - WebSocket终端（可选认证）
- `/` - 根路径测试

**认证头格式**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CORS 跨域支持

系统已启用全局CORS中间件，支持以下配置：

- **Access-Control-Allow-Origin**: `*` (允许所有源)
- **Access-Control-Allow-Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Access-Control-Allow-Headers**: `Content-Type, Authorization`

### HTTP状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 204 | 请求成功，无返回内容 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token无效或过期） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

### 统一响应格式

**成功响应**

```json
{
  "code": 200,
  "message": "success message",
  "data": { ... }
}
```

**错误响应**

```json
{
  "code": 400,
  "error": "error message"
}
```

或

```json
{
  "error": "error message"
}
```

---

## 数据模型

### Users 表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint | 主键，自增 |
| username | string | 用户名，唯一索引 |
| password | string | 密码（bcrypt加密存储） |
| email | string | 邮箱，唯一索引 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| deleted_at | datetime | 删除时间（软删除） |

---

## 环境配置

配置文件路径: `configs/config.yaml`

### 主要配置项

```yaml
database:
  username: "root"
  password: "password"
  host: "localhost"
  port: 3306
  name: "kube_admin"

redis:
  host: "localhost"
  port: 6379

weather:
  api_key: "your_baidu_api_key"
  district_id: "your_district_id"

jwt:
  secret: "your_jwt_secret_key"
```

---

## 启动说明

### 环境要求

- Go 1.18+
- MySQL 5.7+
- Redis 6.0+
- Kubernetes集群访问配置 (`~/.kube/config`)

### 启动命令

```bash
# 开发环境
go run main.go

# 生产环境
GIN_MODE=release go run main.go
```

### 服务地址

- HTTP服务: `http://localhost:9000`
- WebSocket: `ws://localhost:9000/ws/terminal`

---

## 日志说明

系统日志同时输出到：

- 控制台 (stdout)
- 文件: `gin.log`

---

*文档版本: 1.0.0*  
*最后更新: 2026-04-04*  
*项目地址: https://github.com/canary-debug/kube-vue-admin*
