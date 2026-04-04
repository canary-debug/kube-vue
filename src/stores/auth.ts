import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '../api/auth'
import type { LoginRequest, RegisterRequest } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<{ id: number; username: string; email?: string } | null>(
    JSON.parse(localStorage.getItem('user') || 'null')
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials: LoginRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authAPI.login(credentials)
      if (response.data.token) {
        token.value = response.data.token
        localStorage.setItem('token', response.data.token)
        user.value = { id: 1, username: credentials.username }
        localStorage.setItem('user', JSON.stringify(user.value))
        return true
      } else {
        error.value = response.data.msg || response.data.error || 'Login failed'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Network error'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await authAPI.register(data)
      if (response.data.user) {
        user.value = response.data.user
        return true
      } else {
        error.value = response.data.error || 'Registration failed'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || err.message || 'Network error'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  }
})
