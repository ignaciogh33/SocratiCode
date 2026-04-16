import api from './api'

/**
 * Servicio de autenticación — Login, Registro, Refresh, Perfil
 * Usa Djoser + SimpleJWT en el backend.
 */

export const authService = {
  /**
   * Login: obtiene access + refresh tokens
   * POST /auth/jwt/create/
   */
  async login(username, password) {
    const { data } = await api.post('/auth/jwt/create/', { username, password })
    return data // { access, refresh }
  },

  /**
   * Registro de nuevo usuario
   * POST /auth/users/
   * Djoser requiere re_password cuando USER_CREATE_PASSWORD_RETYPE = True
   */
  async register({ username, email, password, re_password }) {
    const { data } = await api.post('/auth/users/', {
      username,
      email,
      password,
      re_password,
    })
    return data
  },

  /**
   * Obtener datos del usuario autenticado
   * GET /auth/users/me/
   */
  async fetchUser() {
    const { data } = await api.get('/auth/users/me/')
    return data // { id, username, email, bio, theme, is_staff }
  },

  /**
   * Refrescar el access token
   * POST /auth/jwt/refresh/
   */
  async refreshToken(refreshToken) {
    const { data } = await api.post('/auth/jwt/refresh/', {
      refresh: refreshToken,
    })
    return data // { access }
  },
  /**
   * Actualizar datos del perfil del usuario
   * PATCH /auth/users/me/
   */
  async updateProfile({ username, bio, theme }) {
    const { data } = await api.patch('/auth/users/me/', { username, bio, theme })
    return data
  },

  /**
   * Cambiar contraseña del usuario
   * POST /auth/users/set_password/
   */
  async changePassword({ current_password, new_password, re_new_password }) {
    const { data } = await api.post('/auth/users/set_password/', {
      current_password,
      new_password,
      re_new_password,
    })
    return data
  },
}
