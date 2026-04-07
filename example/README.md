# Kube-Vue Kubernetes 部署指南

本目录包含将 Kube-Vue 应用部署到 Kubernetes 集群所需的所有配置文件。

## 📁 目录结构

```
example/
├── README.md                           # 本部署文档
├── nginx.conf                         # Nginx 配置
├── Dockerfile                         # Docker 构建文件
├── kube-vue-namespace.yaml           # 命名空间
├── kube-vue-deployment.yaml          # Deployment 配置
├── kube-vue-service.yaml             # Service 配置
└── kube-vue-ingress.yaml            # Ingress 配置（可选）
```

## 🚀 快速开始

### 前置要求

- Kubernetes 集群 (v1.19+)
- kubectl 工具
- Docker (用于构建镜像)
- Ingress Controller (如 nginx-ingress)

### 部署步骤

#### 1. 构建 Docker 镜像

```bash
# 在项目根目录执行
docker build -t kube-vue:latest -f example/Dockerfile .

# 如果需要推送到私有仓库
docker tag kube-vue:latest your-registry.com/kube-vue:latest
docker push your-registry.com/kube-vue:latest
```

#### 2. 部署到 Kubernetes

```bash
# 创建命名空间
kubectl apply -f example/kube-vue-namespace.yaml

# 部署应用
kubectl apply -f example/kube-vue-deployment.yaml

# 部署服务
kubectl apply -f example/kube-vue-service.yaml

# 部署 Ingress（可选）
kubectl apply -f example/kube-vue-ingress.yaml
```

#### 3. 验证部署

```bash
# 检查 Pod 状态
kubectl get pods -n kube-vue-system

# 查看 Pod 日志
kubectl logs -n kube-vue-system -l app=kube-vue

# 检查 Service
kubectl get svc -n kube-vue-system

# 检查 Ingress
kubectl get ingress -n kube-vue-system
```

#### 4. 访问应用

**方式一：使用 Ingress（推荐）**
```
http://kube-vue.example.com
```

**方式二：使用 NodePort**
```bash
# 修改 service.yaml 中的 type 为 NodePort
# 然后访问 http://<node-ip>:<node-port>
```

**方式三：使用 Port Forward**
```bash
# 临时转发本地端口
kubectl port-forward -n kube-vue-system svc/kube-vue 8080:80

# 访问 http://localhost:8080
```

## ⚙️ 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| VITE_API_BASE_URL | http://kube-vue-backend:9000 | 后端 API 地址 |

### 资源配置

默认配置已优化，适用于小型集群：

- **CPU 请求**: 100m
- **CPU 限制**: 500m
- **内存请求**: 128Mi
- **内存限制**: 256Mi

如需调整，请修改 `kube-vue-deployment.yaml` 中的 `resources` 部分。

### 探针配置

- **存活探针 (Liveness)**: 10秒后开始检测，每10秒检测一次
- **就绪探针 (Readiness)**: 5秒后开始检测，每5秒检测一次
- **健康检查端点**: `/health`

## 🔧 高级配置

### 使用私有镜像仓库

1. 创建 Secret：
```bash
kubectl create secret docker-registry regcred \
  --docker-server=https://your-registry.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --namespace=kube-vue-system
```

2. 修改 Deployment 添加 imagePullSecrets：
```yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### 配置 HTTPS

修改 `kube-vue-ingress.yaml` 添加 TLS 配置：

```yaml
spec:
  tls:
  - hosts:
    - kube-vue.example.com
    secretName: kube-vue-tls
```

### 自定义后端地址

修改 Deployment 中的环境变量：

```yaml
env:
- name: VITE_API_BASE_URL
  value: "http://your-backend-service:9000"
```

## 📊 监控和日志

### 查看日志

```bash
# 查看所有 Pod 日志
kubectl logs -n kube-vue-system -l app=kube-vue --tail=100

# 实时跟踪日志
kubectl logs -n kube-vue-system -l app=kube-vue -f
```

### 扩展应用

```bash
# 扩展到 3 个副本
kubectl scale deployment kube-vue -n kube-vue-system --replicas=3

# 自动扩缩容（需要 HPA）
kubectl autoscale deployment kube-vue -n kube-vue-system --min=2 --max=5 --cpu-percent=80
```

## 🐛 故障排查

### Pod 无法启动

```bash
# 查看 Pod 详情
kubectl describe pod -n kube-vue-system <pod-name>

# 查看日志
kubectl logs -n kube-vue-system <pod-name>
```

### 无法访问应用

```bash
# 检查 Service 端点
kubectl get endpoints -n kube-vue-system

# 测试 Service 连通性
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -qO- http://kube-vue/health
```

### 镜像拉取失败

```bash
# 检查 Secret 是否存在
kubectl get secret -n kube-vue-system

# 手动拉取镜像测试
docker pull your-registry.com/kube-vue:latest
```

## 🧹 清理

```bash
# 删除所有资源
kubectl delete -f example/

# 或者单独删除
kubectl delete ingress kube-vue -n kube-vue-system
kubectl delete svc kube-vue -n kube-vue-system
kubectl delete deployment kube-vue -n kube-vue-system
kubectl delete namespace kube-vue-system
```

## 📝 示例文件说明

### nginx.conf
Nginx 配置文件，负责：
- 静态文件服务
- API 代理到后端
- SPA 路由支持
- Gzip 压缩
- SSE 流支持

### Dockerfile
多阶段构建：
- 第一阶段：Node.js 构建
- 第二阶段：Nginx 生产镜像
- 包含健康检查配置

### Deployment YAML
应用部署配置：
- 2 个副本
- 滚动更新策略
- 资源限制
- 探针配置

### Service YAML
服务暴露配置：
- ClusterIP 类型
- 端口 80

### Ingress YAML
外部访问配置：
- 基于域名的路由
- Nginx Ingress Controller
- 支持路径重写

## 🔗 相关链接

- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
