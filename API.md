### 13. 删除指定命名空间下的Service

- **接口地址**: `/api/k8s/delete/service/:namespace/:servicename`
- **请求方法**: `DELETE`
- **认证要求**: 是
- **Authorization**: `Bearer <token>`

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| namespace | string | 是 | 命名空间名称 |
| servicename | string | 是 | Service名称 |

#### 请求示例

```
DELETE /api/k8s/delete/service/default/nginx-service
DELETE /api/k8s/delete/service/kube-system/kube-dns
```

#### 响应示例

**成功响应 (200)**

```json
{
  "status": "success",
  "message": "Service nginx-service 删除成功"
}
```

**失败响应 (404) - Service不存在**

```json
{
  "message": "Service 不存在"
}
```

**失败响应 (500) - 删除失败**

```json
{
  "error": "services \"nginx-service\" not found"
}
```

```json
{
  "error": "Unauthorized"
}
```

#### 业务逻辑

1. 从请求路径中获取命名空间和Service名称
2. 调用Kubernetes API删除指定的Service
3. 如果Service不存在，返回404错误
4. 如果删除失败，返回500错误
5. 删除成功返回200状态码