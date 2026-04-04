<template>
  <LoginPage
    ref="loginRef"
    brand-name="Kube-Vue"
    title="Kube-Vue-Admin，欢迎你!"
    subtitle="请输入您的账号信息"
    primary-color="#4f46e5"
    :show-google-login="false"
    @submit="handleLogin"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LoginPage from '../components/LoginPage.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginRef = ref<InstanceType<typeof LoginPage>>()

async function handleLogin(payload: { email: string; password: string; remember: boolean }) {
  loginRef.value?.setLoading(true)
  loginRef.value?.setError('')

  const username = payload.email.split('@')[0]
  const success = await authStore.login({
    username,
    password: payload.password,
  })

  if (success) {
    router.push('/')
  } else {
    loginRef.value?.setError(authStore.error || 'Login failed')
  }

  loginRef.value?.setLoading(false)
}
</script>
