import { ref } from 'vue'

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
      error.value = e instanceof Error ? e.message : 'Request failed'
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, run }
}