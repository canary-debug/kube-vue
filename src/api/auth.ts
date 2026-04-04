import apiClient from '../utils/axios'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  code: number
  token?: string
  msg?: string
  error?: string
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
}

export interface RegisterResponse {
  message?: string
  user?: {
    id: number
    username: string
    email: string
  }
  error?: string
}

export interface LogoutResponse {
  code: number
  message?: string
  data?: {
    username: string
  }
}

export const authAPI = {
  login: (data: LoginRequest) => {
    return apiClient.post<LoginResponse>('/api/auth/login', data)
  },

  register: (data: RegisterRequest) => {
    return apiClient.post<RegisterResponse>('/api/auth/register', data)
  },

  logout: () => {
    return apiClient.post<LogoutResponse>('/api/auth/logout')
  },
}
