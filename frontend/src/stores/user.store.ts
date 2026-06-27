import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi, type UserProfile, type UpdateProfileDto } from '@/api/user.api'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      const { data } = await userApi.getMe()
      profile.value = data.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load profile'
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(dto: UpdateProfileDto) {
    loading.value = true
    error.value = null
    try {
      const { data } = await userApi.updateMe(dto)
      profile.value = data.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to update profile'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePreferences(prefs: Record<string, unknown>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await userApi.updatePreferences(prefs)
      profile.value = data.data
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to update preferences'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { profile, loading, error, fetchProfile, updateProfile, updatePreferences }
})
