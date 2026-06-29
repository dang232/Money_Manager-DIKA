import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type AuthUser } from '@/api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  // ponytail: tokens live in HttpOnly cookies — isAuthenticated is derived from whether we have a user object
  const isAuthenticated = computed(() => !!user.value)
  // ponytail: store accessTokenExpiresAt for proactive refresh scheduling
  const accessTokenExpiresAt = ref<string | null>(null)

  function clearAuth() {
    user.value = null
    accessTokenExpiresAt.value = null
  }

  async function register(email: string, password: string, displayName: string) {
    const { data } = await authApi.register({ email, password, displayName })
    user.value = data.user
  }

  async function login(email: string, password: string) {
    const { data } = await authApi.login({ email, password })
    user.value = data.user
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    clearAuth()
  }

  async function refresh() {
    // ponytail: cookies are sent automatically via withCredentials — no token in body
    await authApi.refresh()
  }

  async function fetchMe() {
    const { data } = await authApi.me()
    // ponytail: interceptor unwraps ApiResponse, so data is the user object directly
    user.value = data
  }

  return {
    user,
    isAuthenticated,
    accessTokenExpiresAt,
    register,
    login,
    logout,
    refresh,
    fetchMe,
    clearAuth,
  }
})
