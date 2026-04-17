# Kube-Vue-Admin API 接口文档

## Pod 容器终端交互 (WebSocket)

实现 Pod 容器内的命令请求执行，支持标准输入输出流及窗口缩放。

### 接口信息

- **接口路径**: `/api/k8s/ws/terminal` (受保护) 或 `/ws/terminal` (公开/测试)
- **请求方法**: `GET` (需升级为 WebSocket)
- **协议**: `WebSocket`

### 请求参数 (Query Parameters)

| 参数名 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `namespace` | string | 否 | `default` | 容器所在的命名空间 |
| `pod` | string | 是 | - | Pod 名称 |
| `container` | string | 是 | - | 容器名称 |

### 鉴权说明

对于 `/api/k8s/ws/terminal`，需要在请求头中携带 JWT Token（通常通过 WebSocket 子协议或 Cookie 传递，依赖前端实现方式。后端 Gin 路由使用了 `JWTMiddleware`）。

### WebSocket 通信协议

#### 1. 发送消息 (Client -> Server)

消息格式为 JSON。

##### 输入命令 (stdin)
```json
{
  "operation": "stdin",
  "data": "ls -l\n"
}
```

##### 调整窗口大小 (resize)
```json
{
  "operation": "resize",
  "cols": 120,
  "rows": 40
}
```

#### 2. 接收消息 (Server -> Client)

服务器将容器的标准输出和标准错误流直接透传。
- **格式**: 文本 (UTF-8)
- **内容**: 终端输出的原始字符串（包含 ANSI 转义序列）。

### 异常处理

- 如果连接失败或 Pod/容器不存在，WebSocket 将会关闭。
- 常见的控制序列干扰（如 `bracketed paste mode`）已在后端进行初步过滤以提升兼容性。

---

## 辅助接口：获取容器列表

在执行命令前，通常需要先获取 Pod 中的容器列表。

### 接口信息

- **接口路径**: `/api/k8s/get/pod/containers/:namespace/:podname`
- **请求方法**: `GET`
- **鉴权**: 需要 JWT Token

### 返回示例

```json
{
  "code": 200,
  "data": [
    {
      "name": "nginx",
      "restart_count": 0,
      "state": "Running",
      "ports": [80]
    }
  ]
}
```
