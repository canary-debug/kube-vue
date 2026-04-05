## Service 相关接口

### 12. 获取所有或指定命名空间下的Service列表

- **接口地址**: `/api/k8s/get/services/:namespace`
- **请求方法**: `GET`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称，使用 `all` 获取所有命名空间下的Service |

#### 请求示例

**获取所有命名空间的Service：**
```
GET /api/k8s/get/services/all
```

**获取指定命名空间的Service：**
```
GET /api/k8s/get/services/default
GET /api/k8s/get/services/kube-system
```

#### 响应示例

**成功响应 (200)**

```json
{
  "services": [
    {
      "name": "kubernetes",
      "namespace": "default",
      "cluster_ip": "10.96.0.1",
      "external_ip": null,
      "port": 443,
      "node_port": 30001,
      "target_port": "443",
      "protocol": "TCP",
      "creation_timestamp": "2024-01-01 00:00:00"
    },
    {
      "name": "nginx-service",
      "namespace": "production",
      "cluster_ip": "10.98.123.45",
      "external_ip": "192.168.1.100",
      "port": 80,
      "node_port": 30080,
      "target_port": "80",
      "protocol": "TCP",
      "creation_timestamp": "2024-01-15 10:30:00"
    },
    {
      "name": "cluster-ip-service",
      "namespace": "default",
      "cluster_ip": "10.98.234.56",
      "external_ip": null,
      "port": 8080,
      "node_port": null,
      "target_port": "8080",
      "protocol": "TCP",
      "creation_timestamp": "2024-01-20 14:25:00"
    }
  ],
  "total": 3
}
```

**失败响应 (500) - Informer未初始化**

```json
{
  "error": "Services Informer 尚未初始化完成，请稍后重试"
}
```

**失败响应 (500) - 获取数据失败**

```json
{
  "error": "获取命名空间失败: ..."
}
```

```json
{
  "error": "获取 Service 失败: ..."
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | Service名称 |
| namespace | string | Service所在的命名空间 |
| cluster_ip | string | 集群内部访问IP（VIP） |
| external_ip | string/null | 外部访问IP，如果没有则返回null |
| port | int/null | Service端口，如果没有端口则返回null |
| node_port | int/null | NodePort（外部访问端口），如果没有则返回null |
| target_port | string/null | 目标容器端口 |
| protocol | string/null | 协议类型 (TCP/UDP)，如果没有端口则返回null |
| creation_timestamp | string | Service创建时间，格式：`YYYY-MM-DD HH:MM:SS` |
| total | int | Service总数 |