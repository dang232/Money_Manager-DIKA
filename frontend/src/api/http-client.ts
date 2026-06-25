import axios from 'axios'

const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

httpClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = crypto.randomUUID()
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 503) {
      console.warn('Service unavailable:', error.config?.url)
    }
    return Promise.reject(error)
  }
)

export default httpClient
