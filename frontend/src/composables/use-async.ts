import { ref } from 'vue'
import { AxiosError } from 'axios'

// ponytail: shared loading/error state for async ops — used by Pinia stores
export function useAsync() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e: unknown) {
      console.error('useAsync error:', e)
      // Handle axios error with API envelope
      if (e instanceof AxiosError) {
        // Try to extract from axios error response
        if (e.response?.data?.error?.message) {
          error.value = e.response.data.error.message as string
          return undefined
        }
        // Try axios error message
        if (e.message) {
          error.value = e.message
          return undefined
        }
        // Try status code
        if (e.response?.status) {
          error.value = `Error ${e.response.status}: ${JSON.stringify(e.response.data)}`
          return undefined
        }
      }
      error.value = e instanceof Error ? e.message : 'Request failed'
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}