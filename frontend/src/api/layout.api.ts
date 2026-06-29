import httpClient from './http-client'

export interface LayoutData {
  categories: string[]
  budgets: string[]
}

export interface LayoutResponse {
  layout: LayoutData
  version: number
  updatedAt: string
}

export interface UpdateLayoutPayload {
  layout: LayoutData
  clientVersion: number
  clientTimestamp: number
}

export const layoutApi = {
  get: async () => {
    const { data } = await httpClient.get<LayoutResponse>('/layout')
    return data
  },

  update: async (payload: UpdateLayoutPayload) => {
    const { data } = await httpClient.patch<LayoutResponse>('/layout', payload)
    return data
  },

  beacon: (payload: UpdateLayoutPayload): void => {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    navigator.sendBeacon('/api/layout/beacon', blob)
  },
}