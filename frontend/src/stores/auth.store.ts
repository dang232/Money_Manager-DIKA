import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type AuthUser, type AuthTokens } from '@/api/auth.api'

const TOKEN_KEY = 'mm-access-token'
const REFRESH_KEY = 'mm-refresh-token'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY))

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    localStorage.setItem(TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  async function register(email: string, password: string, displayName: string) {
    const { data } = await authApi.register({ email, password, displayName })
    user.value = data.data.user
    setTokens(data.data)
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login({ email, password })
    user.value = data.data.user
    setTokens(data.data)
  }

  async function logout() {
    if (refreshToken.value) {
      await authApi.logout(refreshToken.value).catch(() => {})
    }
    clearAuth()
  }

  async function refresh() {
    if (!refreshToken.value) throw new Error('No refresh token')
    const { data } = await authApi.refresh(refreshToken.value)
    setTokens(data.data)
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    user.value = data.data
  }

  return { user, accessToken, refreshToken, isAuthenticated, register, login, logout, refresh, fetchMe, clearAuth }
})
