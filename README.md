# Animated Characters Login Page

一个 Vue 3 登录页面，带有交互式卡通角色，眼睛会跟随鼠标移动、随机眨眼，并对用户输入做出反应。

> 使用 Vue 3 + TypeScript + 原生 CSS。

## 特性

- 👀 角色眼睛跟随鼠标移动
- 😉 随机眨眼动画
- 🫣 开始输入时角色互相对视
- 🙈 密码可见时角色转头回避，紫色角色偶尔偷瞄
- 📱 响应式布局，移动端自动隐藏左侧面板
- 🎨 通过 props 自定义品牌名、主题色、文案等

## 快速开始

```bash
git clone https://gitee.com/niumg9527/login-animation.git
npm install
npm run dev
```

## 使用方式

### 完整登录页面

```vue
<template>
  <LoginPage
    ref="loginRef"
    brand-name="MyApp"
    title="欢迎回来！"
    primary-color="#6C3FF5"
    @submit="handleLogin"
  />
</template>

<script setup>
import { ref } from 'vue'
import LoginPage from './components/LoginPage.vue'

const loginRef = ref()

async function handleLogin({ email, password, remember }) {
  loginRef.value.setLoading(true)
  // 在这里写你的认证逻辑
  loginRef.value.setLoading(false)
}
</script>
```

### 仅使用角色动画

你也可以只用动画角色组件，嵌入到自己的布局中：

```vue
<template>
  <AnimatedCharacters
    :is-typing="isFocused"
    :has-secret="password.length > 0"
    :secret-visible="showPassword"
  />
</template>

<script setup>
import AnimatedCharacters from './components/AnimatedCharacters.vue'
</script>
```

## LoginPage Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `brandName` | `string` | `'YourBrand'` | 品牌名称 |
| `title` | `string` | `'Welcome back!'` | 主标题 |
| `subtitle` | `string` | `'Please enter your details'` | 副标题 |
| `emailPlaceholder` | `string` | `'you@example.com'` | 邮箱输入框占位符 |
| `primaryColor` | `string` | `'#4f46e5'` | 主题色，用于按钮和左侧面板 |
| `showGoogleLogin` | `boolean` | `true` | 是否显示 Google 登录按钮 |

## LoginPage 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `submit` | `{ email, password, remember }` | 表单提交时触发 |

## LoginPage 暴露方法

| 方法 | 说明 |
|------|------|
| `setError(msg)` | 显示错误信息 |
| `setLoading(bool)` | 切换加载状态 |

## AnimatedCharacters Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `isTyping` | `boolean` | `false` | 触发"互相对视"动画 |
| `hasSecret` | `boolean` | `false` | 密码字段是否有内容 |
| `secretVisible` | `boolean` | `false` | 密码是否可见（触发回避反应） |

## 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite
- lucide-vue-next（图标）
- 原生 CSS（无需 UI 框架）

## 许可证

MIT
