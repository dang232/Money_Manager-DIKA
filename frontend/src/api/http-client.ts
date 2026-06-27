import axios from 'axios'

const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = crypto.randomUUID()
  const token = localStorage.getItem('mm-access-token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<void> | null = null

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const rt = localStorage.getItem('mm-refresh-token')
          if (!rt) throw error
          const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt })
          localStorage.setItem('mm-access-token', data.data.accessToken)
          localStorage.setItem('mm-refresh-token', data.data.refreshToken)
        })().finally(() => { refreshPromise = null })
      }
      await refreshPromise
      original.headers['Authorization'] = `Bearer ${localStorage.getItem('mm-access-token')}`
      return httpClient(original)
    }
    if (error.response?.status === 503) {
      console.warn('Service unavailable:', error.config?.url)
    }
    return Promise.reject(error)
  }
)

export default httpClient
