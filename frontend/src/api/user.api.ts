import httpClient from './http-client'

export interface UserProfile {
  id: string
  displayName: string
  avatarUrl: string | null
  locale: string
  timezone: string
  defaultCurrency: string
  budgetAnchorDay: number
  notificationPrefs: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileDto {
  displayName?: string
  avatarUrl?: string | null
  locale?: string
  timezone?: string
  defaultCurrency?: string
  budgetAnchorDay?: number
}

export const userApi = {
  getMe() {
    return httpClient.get<{ data: UserProfile }>('/users/me')
  },
  updateMe(dto: UpdateProfileDto) {
    return httpClient.put<{ data: UserProfile }>('/users/me', dto)
  },
  updatePreferences(prefs: Record<string, unknown>) {
    return httpClient.put<{ data: UserProfile }>('/users/me/preferences', prefs)
  },
}
