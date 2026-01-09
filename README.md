<div align="center">
  <h1>Kube-Vue-Admin</h1>
  <p>现代化的Kubernetes集群管理界面</p>
  <p>
    <a href="#功能特性">功能特性</a> •
    <a href="#技术栈">技术栈</a> •
    <a href="#快速开始">快速开始</a> •
    <a href="#项目结构">项目结构</a> •
    <a href="#api接口">API接口</a> •
    <a href="#构建与部署">构建与部署</a>
  </p>
</div>

## 项目介绍

Kube-Vue-Admin是一个基于React和TypeScript开发的现代化Kubernetes集群管理界面，提供了直观、易用的方式来管理和监控Kubernetes集群资源。

## 功能特性

- ✅ **命名空间管理** - 查看和管理集群中的命名空间
- ✅ **Deployment管理** - 查看、重启和监控Deployment
- ✅ **Pod管理** - 查看Pod详情、状态和端口信息
- ✅ **集群健康检查** - 实时监控集群健康状态
- ✅ **节点和Pod数量统计** - 直观展示集群资源使用情况
- ✅ **响应式设计** - 适配不同屏幕尺寸
- ✅ **现代化UI** - 基于Tailwind CSS构建的美观界面

## 技术栈

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS
- **HTTP客户端**: 自定义request工具函数
- **路由**: React Router

### 后端
- **语言**: Go
- **Web框架**: Gin
- **Kubernetes客户端**: client-go

## 快速开始

### 前提条件
- Node.js 18+
- npm 9+
- 运行中的Kubernetes集群
- 后端服务（http://localhost:9000）

### 安装和运行

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   创建或编辑 `.env` 文件，设置后端服务地址：
   ```env
   VITE_BACKEND_URL=http://localhost:9000
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 http://localhost:3001

## 项目结构

```
├── pages/              # 页面组件
│   ├── Dashboard.tsx   # 仪表盘页面
│   ├── Login.tsx       # 登录页面
│   ├── Nodes.tsx       # 节点管理页面
│   └── Workloads.tsx   # 工作负载管理页面
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
│   └── client.ts       # HTTP客户端
├── App.tsx             # 应用根组件
├── main.tsx            # 应用入口
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
├── vite.config.ts      # Vite配置
└── tailwind.config.js  # Tailwind CSS配置
```

## API接口

### 认证
- **登录**: POST /api/auth/login
- **注册**: POST /api/auth/register

### 集群资源
- **获取命名空间列表**: GET /api/k8s/get/namespaces/namespacename
- **获取Deployment列表**: GET /api/k8s/get/deployment/:namespace
- **重启Deployment**: POST /api/k8s/restart/deployment
- **获取Deployment的Pod列表**: POST /api/k8s/deployment/pods
- **获取节点数量**: GET /api/k8s/get/nodes/len
- **获取Pod数量**: GET /api/k8s/get/pods/len
- **获取集群健康状态**: GET /api/k8s/get/cluster_healthz

## 构建与部署

### 生产构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

### 部署
可以将构建产物部署到任何静态文件服务器，如Nginx、Apache或云存储服务。

## 开发指南

### 代码规范
- 使用TypeScript进行开发
- 遵循React最佳实践
- 使用ESLint和Prettier保持代码风格一致

### 提交规范
- 使用语义化提交信息
- 每次提交只包含一个功能或修复

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来帮助改进项目！

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue: https://github.com/your-username/kube-vue-admin/issues
- 发送邮件: your-email@example.com
