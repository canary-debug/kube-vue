# Kube-Vue 部署指南

本指南将引导您使用 Docker 构建 Kube-Vue 应用镜像，并将其部署到 Kubernetes 集群中。

## 目录结构

```
example/
├── Dockerfile          # Docker 构建文件
├── nginx.conf          # Nginx 配置文件
├── kube-deployment.yaml  # Kubernetes 部署配置
└── README.md           # 本部署指南
```

## 前提条件

- Docker 环境已安装并配置
- Kubernetes 集群已部署（例如：Minikube、EKS、GKE 等）
- `kubectl` 已安装并配置正确的集群上下文
- 项目代码已克隆到本地

## 步骤 1：构建 Docker 镜像

### 1.1 进入项目根目录

```bash
cd /path/to/kube-vue
```

### 1.2 构建 Docker 镜像

使用以下命令构建 Docker 镜像：

```bash
cp example/Dockerfile ./
docker build -t kube-vue:v1.0 .
```

参数说明：
- `.`：指定构建上下文为当前目录

### 1.3 验证镜像构建成功

```bash
docker images | grep kube-vue
```

您应该能看到类似以下输出：

```
kube-vue           v1.0    a1b2c3d4e5f6   2 minutes ago   123MB
```

### 1.4 （可选）推送镜像到容器仓库

如果您的 Kubernetes 集群无法直接访问本地镜像，需要将镜像推送到容器仓库（如 Docker Hub、Harbor 等）：

```bash
# 登录到 Docker Hub（或其他容器仓库）
docker login

# 标记镜像
docker tag kube-vue:v1.0 <your-registry>/kube-vue:v1.0

# 推送镜像
docker push <your-registry>/kube-vue:v1.0
```

## 步骤 2：配置 Kubernetes 部署文件

### 2.1 修改配置

根据您的实际环境修改 `kube-deployment.yaml` 文件：

1. **如果使用远程镜像仓库**，修改镜像名称：
   ```yaml
   image: <your-registry>/kube-vue:latest  # 修改为远程仓库地址
   ```

2. **（可选）调整副本数量**：
   ```yaml
   replicas: 2  # 根据实际需求调整
   ```

3. **（可选）修改 NodePort 端口**：
   ```yaml
   nodePort: 30081  # 在 30000-32767 范围内选择
   ```

## 步骤 3：部署到 Kubernetes 集群

### 3.1 应用配置文件

使用 `kubectl` 部署应用：

```bash
kubectl apply -f example/kube-deployment.yaml
```

### 3.2 验证部署

查看部署状态：

```bash
# 查看 ConfigMap
kubectl get configmap kube-vue-config -o yaml

# 查看 Deployment
kubectl get deployment kube-vue

# 查看 Pods
kubectl get pods -l app=kube-vue

# 查看 Service
kubectl get service kube-vue-service
```

### 3.3 访问应用

根据 Service 类型，有以下几种访问方式：

1. **NodePort 方式**（默认配置）：
   ```
   http://<node-ip>:30080  # node-ip 是 Kubernetes 节点的 IP 地址
   ```

2. **端口转发方式**（用于开发测试）：
   ```bash
   kubectl port-forward service/kube-vue-service 8080:80
   ```
   然后访问：`http://localhost:8080`

3. **Ingress 方式**（如果已启用）：
   ```
   http://kube-vue.example.com  # 根据 Ingress 配置的域名访问
   ```

## 步骤 4：更新应用

### 4.1 构建新镜像

```bash
docker build -t kube-vue:v1.1.0 -f example/Dockerfile .
```

### 4.2 更新 Deployment

方法 1：使用 `kubectl set image` 命令

```bash
kubectl set image deployment/kube-vue kube-vue=kube-vue:v1.1.0
```

方法 2：修改 `kube-deployment.yaml` 文件后重新应用

```bash
kubectl apply -f example/kube-deployment.yaml
```

### 4.3 验证更新

```bash
# 查看滚动更新状态
kubectl rollout status deployment/kube-vue

# 查看历史版本
kubectl rollout history deployment/kube-vue
```

## 步骤 5：维护操作

### 5.1 查看日志

```bash
# 查看 Pod 日志
kubectl logs <pod-name>

# 实时查看日志
kubectl logs -f <pod-name>

# 查看所有 Pod 日志
kubectl logs -l app=kube-vue
```

### 5.2 进入 Pod 调试

```bash
kubectl exec -it <pod-name> -- /bin/sh
```

### 5.3 缩放应用

```bash
# 缩放到 3 个副本
kubectl scale deployment/kube-vue --replicas=3
```

### 5.4 删除应用

```bash
kubectl delete -f example/kube-deployment.yaml
```

## 高级配置

### 1. 使用 Secrets 管理敏感信息

如果需要管理敏感信息（如 API 密钥），建议使用 Kubernetes Secrets：

```bash
# 创建 Secret
kubectl create secret generic kube-vue-secrets --from-literal=GEMINI_API_KEY=your-api-key

# 在 Deployment 中引用
```yaml
envFrom:
- configMapRef:
    name: kube-vue-config
- secretRef:
    name: kube-vue-secrets
```

### 2. 配置资源限制

根据应用需求调整资源限制：

```yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### 3. 启用 HPA（水平自动缩放）

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kube-vue-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kube-vue
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 常见问题

1. **镜像拉取失败**
   - 检查镜像名称是否正确
   - 检查镜像仓库是否可访问
   - 检查 `imagePullPolicy` 配置

2. **应用无法访问**
   - 检查 Pod 是否正常运行
   - 检查 Service 配置是否正确
   - 检查网络策略是否允许访问

3. **API 代理失败**
   - 检查后端服务是否正常
   - 检查 `VITE_BACKEND_URL` 配置是否正确
   - 检查 Nginx 配置中的 `proxy_pass` 设置

## 故障排查

```bash
# 查看事件
kubectl get events

# 查看 Pod 详细信息
kubectl describe pod <pod-name>

# 查看 Service 详细信息
kubectl describe service kube-vue-service

# 测试 API 连接
kubectl exec <pod-name> -- wget -O- http://your-backend-service:9000
```

## 总结

本指南提供了使用 Docker 构建镜像并部署到 Kubernetes 集群的完整流程。根据您的实际环境和需求，可以调整配置以获得最佳性能和可靠性。

如果您在部署过程中遇到任何问题，请参考 Kubernetes 官方文档或社区支持。
