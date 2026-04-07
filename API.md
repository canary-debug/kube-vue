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

**实时流日志 (SSE)**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: 2024-01-15T10:30:00.000 stdout F Starting nginx...

data: 2024-01-15T10:30:01.000 stdout F Nginx started successfully

data: 2024-01-15T10:30:05.000 stderr F [error] connection failed...

data: 2024-01-15T10:30:10.000 stdout F Request received from 10.1.20.5
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

#### 前端调用示例

**非实时日志调用**

```typescript
import { k8sAPI } from '@/api/k8s'

// 使用axios（适用于非实时日志）
const response = await k8sAPI.getPodLogs('default', 'nginx-pod', {
  container: 'nginx',
  tail: 100
})
console.log(response.data)
```

**实时流日志调用（使用fetch）**

```typescript
// 实时流日志必须使用fetch API，axios不支持SSE
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000'
const queryParams = new URLSearchParams({
  container: 'nginx',
  tail: '100',
  follow: 'true'
})

const response = await fetch(
  `${baseURL}/api/k8s/pod/logs/default/nginx-pod?${queryParams}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
)

// 读取SSE流
const reader = response.body?.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim()
      console.log(data) // 处理日志数据
    }
  }
}
```

#### 前端Vue组件示例

```vue
<template>
  <div>
    <button @click="toggleFollow">
      {{ isFollowing ? '停止实时' : '开始实时' }}
    </button>
    <pre ref="logsRef">{{ logs }}</pre>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useK8sStore } from '@/stores/k8s'

const k8sStore = useK8sStore()
const logs = ref('')
const isFollowing = ref(false)
const logsRef = ref(null)

async function toggleFollow() {
  if (isFollowing.value) {
    isFollowing.value = false
    return
  }

  isFollowing.value = true
  logs.value = ''

  try {
    await k8sStore.getPodLogsStream(
      'default',
      'nginx-pod',
      { container: 'nginx', tail: 100 },
      (data) => {
        logs.value += data + '\n'
        // 自动滚动到底部
        setTimeout(() => {
          if (logsRef.value) {
            logsRef.value.scrollTop = logsRef.value.scrollHeight
          }
        }, 0)
      }
    )
  } catch (err) {
    console.error('Stream error:', err)
  } finally {
    isFollowing.value = false
  }
}

onUnmounted(() => {
  isFollowing.value = false
})
</script>
```

#### 实际调用示例

**获取非实时日志**

```bash
curl -X GET "http://localhost:9000/api/k8s/pod/logs/default/nginx-double-deployment-5cc449f47d-td8bg?container=nginx-2&tail=1" \
  -H "Authorization: Bearer <token>"
```

**获取实时日志（使用podman）**

```bash
curl -N -X GET "http://localhost:9000/api/k8s/pod/logs/default/nginx-double-deployment-5cc449f47d-td8bg?container=nginx-2&follow=true&tail=1" \
  -H "Authorization: Bearer <token>"
```

**实时日志的SSE格式说明**

- 每条日志以 `data: ` 开头
- 消息之间以空行分隔
- 使用 `text/event-stream` Content-Type
- 支持长连接持续接收新日志
- 客户端应正确处理连接断开和重连

#### 注意事项

1. **认证**: 所有请求都需要有效的JWT token
2. **多容器Pod**: 必须指定container参数
3. **实时模式**: 必须使用fetch API或EventSource，不支持axios
4. **连接管理**: 切换容器或行数时应停止当前流
5. **资源清理**: 组件卸载时应主动停止流连接
6. **错误处理**: 网络断开时会抛出错误，应优雅处理

---