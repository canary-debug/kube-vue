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