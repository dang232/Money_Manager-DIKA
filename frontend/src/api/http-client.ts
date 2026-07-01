import axios from 'axios'

const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // send HttpOnly cookies on every request
  headers: { 'Content-Type': 'application/json' },
})

// ponytail: read mm-csrf cookie for double-submit CSRF protection
function getCsrfToken(): string | null {
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith('mm-csrf='))
      ?.split('=')[1] ?? null
  )
}

httpClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = crypto.randomUUID()
  const csrf = getCsrfToken()
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf
  }
  return config
})

let refreshPromise: Promise<void> | null = null

httpClient.interceptors.response.use(
  (response) => {
    // ponytail: unwrap API envelope patterns:
    // - {success, data, error?, meta?} → standard envelope
    // - {data: {user}} → auth endpoints (no success field)
    // Skip if response has non-envelope keys like 'total' (pagination)
    const d = response.data
    if (d && typeof d === 'object' && 'data' in d && !Array.isArray(d)) {
      const keys = Object.keys(d)
      const envelopeKeys = new Set(['success', 'data', 'error', 'meta', 'message'])
      if (keys.every(k => envelopeKeys.has(k))) {
        response.data = d.data
      }
    }
    return response
  },
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/register')
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', {}, { withCredentials: true })
          .then(() => {})
          .catch(() => {
            // ponytail: refresh failed — redirect to login
            window.location.href = '/login'
            throw error
          })
          .finally(() => {
            refreshPromise = null
          })
      }
      await refreshPromise
      return httpClient(original)
    }
    const status = error.response?.status
    if (status && status >= 500) {
      const msg = error.response?.data?.error?.message || error.message || 'Server error'
      console.error(`[${status}]`, error.config?.url, msg)
      // ponytail: toast shown via LoginView error state
    }
    if (status === 503) {
      // ponytail: service unavailable — will retry via circuit breaker
    }
    // ponytail: extract API error message from envelope
    const apiError = error.response?.data?.error
    if (apiError?.message) {
      error.message = apiError.message
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message
    }
    // ponytail: also expose the code for status-aware handling
    ;(error as any).code = apiError?.code || error.response?.data?.code
    return Promise.reject(error)
  },
)

export default httpClient
