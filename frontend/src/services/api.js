import axios from 'axios'

/**
 * Instancia de Axios pre-configurada para la API de SocratiCode.
 *
 * - Base URL apunta al proxy de Vite (/api → Django :8000/api)
 * - Interceptor de request: inyecta JWT automáticamente
 * - Interceptor de response: intenta refresh en 401, logout si falla
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── REQUEST INTERCEPTOR: Inyectar token JWT ───
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── RESPONSE INTERCEPTOR: Auto-refresh en 401 ───
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si es 401 y no es un retry ni un intento de login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/jwt/')
    ) {
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const refreshToken = localStorage.getItem('refresh_token')

        if (!refreshToken) {
          // No hay refresh token → logout
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(error)
        }

        try {
          const { data } = await axios.post('/api/auth/jwt/refresh/', {
            refresh: refreshToken,
          })
          localStorage.setItem('access_token', data.access)
          isRefreshing = false
          onRefreshed(data.access)

          // Reintentar la request original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      // Si ya se está haciendo refresh, encolar esta request
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(api(originalRequest))
        })
      })
    }

    return Promise.reject(error)
  }
)

export default api
