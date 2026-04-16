import { defineStore } from 'pinia'
import { authService } from '../services/authService'
import { useRouter } from 'vue-router'

/**
 * Store de autenticación — Gestiona JWT tokens y datos del usuario.
 * Persistencia en localStorage para sobrevivir recargas.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    user: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },

  actions: {
    /**
     * Login con username y password.
     * Guarda tokens y obtiene datos del usuario.
     */
    async login(username, password) {
      this.isLoading = true
      this.error = null
      try {
        const { access, refresh } = await authService.login(username, password)
        this.accessToken = access
        this.refreshToken = refresh
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        await this.fetchUser()
      } catch (err) {
        const data = err.response?.data
        this.error = data?.error || data?.detail || 'Error al iniciar sesión'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Registrar un nuevo usuario.
     */
    async register({ username, email, password, re_password }) {
      this.isLoading = true
      this.error = null
      try {
        await authService.register({ username, email, password, re_password })
        // Tras registrarse, hacer login automático
        await this.login(username, password)
      } catch (err) {
        const data = err.response?.data
        // Djoser devuelve errores de validación por campo
        if (data?.details) {
          const firstField = Object.keys(data.details)[0]
          this.error = data.details[firstField]?.[0] || data.error || 'Error al registrarse'
        } else {
          this.error = data?.error || 'Error al registrarse'
        }
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Obtener datos del usuario autenticado.
     */
    async fetchUser() {
      if (!this.accessToken) return
      try {
        this.user = await authService.fetchUser()
      } catch {
        // Si falla, el interceptor de Axios manejará el refresh/logout
      }
    },

    /**
     * Cerrar sesión. Limpia todo y redirige a login.
     */
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },

    /**
     * Actualizar datos del perfil.
     */
    async updateProfile(profileData) {
      this.isLoading = true
      this.error = null
      try {
        const updated = await authService.updateProfile(profileData)
        this.user = { ...this.user, ...updated }
        return updated
      } catch (err) {
        const data = err.response?.data
        this.error = data?.error || data?.username?.[0] || 'Error al actualizar el perfil'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Cambiar contraseña del usuario.
     */
    async changePassword(passwordData) {
      this.isLoading = true
      this.error = null
      try {
        await authService.changePassword(passwordData)
      } catch (err) {
        const data = err.response?.data
        this.error =
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.non_field_errors?.[0] ||
          data?.error ||
          'Error al cambiar la contraseña'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Intentar restaurar sesión al arrancar la app.
     */
    async initialize() {
      if (this.accessToken && !this.user) {
        await this.fetchUser()
      }
    },
  },
})
