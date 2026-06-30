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
  console.log('HTTP Request:', config.method?.toUpperCase(), config.url, config.data)
  config.headers['X-Correlation-ID'] = crypto.randomUUID()
  const csrf = getCsrfToken()
  console.log('CSRF Token:', csrf ? 'found' : 'NOT FOUND')
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf
  }
  // Log all cookies
  console.log('All cookies:', document.cookie)
  return config
})

let refreshPromise: Promise<void> | null = null

httpClient.interceptors.response.use(
  (response) => {
    console.log('HTTP Response:', response.config.url, response.status, response.data)
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
    if (error.response?.status === 401 && !original._retry) {
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
    if (error.response?.status === 503) {
      console.warn('Service unavailable:', error.config?.url)
    }
    // ponytail: extract API error message from envelope
    const apiError = error.response?.data?.error
    if (apiError?.message) {
      error.message = apiError.message
    }
    return Promise.reject(error)
  },
)

export default httpClient
