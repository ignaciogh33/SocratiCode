import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    fetchUser: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}))

// vue-router is imported in auth.js but useRouter is never called — mock it to avoid
// "No active router" warnings
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))

import { useAuthStore } from '../../stores/auth'
import { authService } from '../../services/authService'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // ─── isAuthenticated getter ───

  it('isAuthenticated is false when no accessToken', () => {
    const store = useAuthStore()
    store.accessToken = null
    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true when accessToken is set', () => {
    const store = useAuthStore()
    store.accessToken = 'token'
    expect(store.isAuthenticated).toBe(true)
  })

  // ─── login ───

  it('login saves tokens to state and localStorage', async () => {
    const store = useAuthStore()
    authService.login.mockResolvedValue({ access: 'acc', refresh: 'ref' })
    authService.fetchUser.mockResolvedValue({ id: 1, username: 'u' })

    await store.login('u', 'p')

    expect(store.accessToken).toBe('acc')
    expect(store.refreshToken).toBe('ref')
    expect(localStorage.getItem('access_token')).toBe('acc')
    expect(localStorage.getItem('refresh_token')).toBe('ref')
  })

  it('login calls fetchUser after storing tokens', async () => {
    const store = useAuthStore()
    authService.login.mockResolvedValue({ access: 'a', refresh: 'r' })
    authService.fetchUser.mockResolvedValue({ id: 1, username: 'u' })

    await store.login('u', 'p')

    expect(store.user).toEqual({ id: 1, username: 'u' })
  })

  it('login sets isLoading true during call and false after', async () => {
    const store = useAuthStore()
    let loadingDuring = false
    authService.login.mockImplementation(async () => {
      loadingDuring = store.isLoading
      return { access: 'a', refresh: 'r' }
    })
    authService.fetchUser.mockResolvedValue({ id: 1 })

    await store.login('u', 'p')

    expect(loadingDuring).toBe(true)
    expect(store.isLoading).toBe(false)
  })

  it('login sets error and throws on failure with error field', async () => {
    const store = useAuthStore()
    authService.login.mockRejectedValue({
      response: { data: { error: 'Credenciales inválidas' } },
    })

    await expect(store.login('u', 'bad')).rejects.toBeDefined()
    expect(store.error).toBe('Credenciales inválidas')
    expect(store.isLoading).toBe(false)
  })

  it('login uses detail field when no error field', async () => {
    const store = useAuthStore()
    authService.login.mockRejectedValue({
      response: { data: { detail: 'No active account found' } },
    })

    await expect(store.login('u', 'bad')).rejects.toBeDefined()
    expect(store.error).toBe('No active account found')
  })

  it('login uses fallback message when no response data', async () => {
    const store = useAuthStore()
    authService.login.mockRejectedValue(new Error('network'))

    await expect(store.login('u', 'bad')).rejects.toBeDefined()
    expect(store.error).toBe('Error al iniciar sesión')
  })

  // ─── register ───

  it('register calls authService.register then auto-login', async () => {
    const store = useAuthStore()
    authService.register.mockResolvedValue({})
    authService.login.mockResolvedValue({ access: 'new', refresh: 'new-r' })
    authService.fetchUser.mockResolvedValue({ id: 2, username: 'nuevo' })

    await store.register({ username: 'nuevo', email: 'n@t.com', password: 'p', re_password: 'p' })

    expect(authService.register).toHaveBeenCalled()
    expect(store.accessToken).toBe('new')
    expect(store.user).toEqual({ id: 2, username: 'nuevo' })
  })

  it('register sets error from details field on validation failure', async () => {
    const store = useAuthStore()
    authService.register.mockRejectedValue({
      response: { data: { details: { username: ['Ya existe un usuario con este nombre.'] } } },
    })

    await expect(store.register({ username: 'dup', email: 'e@t.com', password: 'p', re_password: 'p' })).rejects.toBeDefined()
    expect(store.error).toBe('Ya existe un usuario con este nombre.')
  })

  it('register sets error from error field when no details', async () => {
    const store = useAuthStore()
    authService.register.mockRejectedValue({
      response: { data: { error: 'Error general' } },
    })

    await expect(store.register({ username: 'u', email: 'e@t.com', password: 'p', re_password: 'p' })).rejects.toBeDefined()
    expect(store.error).toBe('Error general')
  })

  // ─── fetchUser ───

  it('fetchUser is a no-op when no accessToken', async () => {
    const store = useAuthStore()
    store.accessToken = null
    await store.fetchUser()
    expect(authService.fetchUser).not.toHaveBeenCalled()
  })

  it('fetchUser sets user data on success', async () => {
    const store = useAuthStore()
    store.accessToken = 'token'
    authService.fetchUser.mockResolvedValue({ id: 1, username: 'u' })
    await store.fetchUser()
    expect(store.user).toEqual({ id: 1, username: 'u' })
  })

  it('fetchUser swallows errors silently', async () => {
    const store = useAuthStore()
    store.accessToken = 'token'
    authService.fetchUser.mockRejectedValue(new Error('network'))
    await expect(store.fetchUser()).resolves.toBeUndefined()
  })

  // ─── logout ───

  it('logout clears accessToken, refreshToken and user', () => {
    const store = useAuthStore()
    store.accessToken = 'a'
    store.refreshToken = 'r'
    store.user = { id: 1 }
    localStorage.setItem('access_token', 'a')
    localStorage.setItem('refresh_token', 'r')

    store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  // ─── updateProfile ───

  it('updateProfile merges returned data into user', async () => {
    const store = useAuthStore()
    store.user = { id: 1, username: 'old', bio: '' }
    authService.updateProfile.mockResolvedValue({ username: 'nuevo', bio: 'bio text' })

    await store.updateProfile({ username: 'nuevo', bio: 'bio text', theme: 'dark' })

    expect(store.user).toMatchObject({ id: 1, username: 'nuevo', bio: 'bio text' })
  })

  it('updateProfile returns the updated data', async () => {
    const store = useAuthStore()
    store.user = { id: 1 }
    authService.updateProfile.mockResolvedValue({ username: 'n' })

    const result = await store.updateProfile({ username: 'n' })

    expect(result).toEqual({ username: 'n' })
  })

  it('updateProfile sets error and throws on failure', async () => {
    const store = useAuthStore()
    store.user = { id: 1 }
    authService.updateProfile.mockRejectedValue({
      response: { data: { username: ['Ya existe.'] } },
    })

    await expect(store.updateProfile({})).rejects.toBeDefined()
    expect(store.error).toBe('Ya existe.')
  })

  // ─── changePassword ───

  it('changePassword calls service and resolves on success', async () => {
    const store = useAuthStore()
    authService.changePassword.mockResolvedValue({})

    await expect(store.changePassword({ current_password: 'old', new_password: 'new', re_new_password: 'new' })).resolves.toBeUndefined()
  })

  it('changePassword sets error from current_password field', async () => {
    const store = useAuthStore()
    authService.changePassword.mockRejectedValue({
      response: { data: { current_password: ['Contraseña incorrecta.'] } },
    })

    await expect(store.changePassword({})).rejects.toBeDefined()
    expect(store.error).toBe('Contraseña incorrecta.')
  })

  it('changePassword sets error from non_field_errors field', async () => {
    const store = useAuthStore()
    authService.changePassword.mockRejectedValue({
      response: { data: { non_field_errors: ['Las contraseñas no coinciden.'] } },
    })

    await expect(store.changePassword({})).rejects.toBeDefined()
    expect(store.error).toBe('Las contraseñas no coinciden.')
  })

  // ─── initialize ───

  it('initialize calls fetchUser when token exists but no user', async () => {
    const store = useAuthStore()
    store.accessToken = 'token'
    store.user = null
    authService.fetchUser.mockResolvedValue({ id: 1 })

    await store.initialize()

    expect(authService.fetchUser).toHaveBeenCalled()
  })

  it('initialize skips fetchUser when no token', async () => {
    const store = useAuthStore()
    store.accessToken = null

    await store.initialize()

    expect(authService.fetchUser).not.toHaveBeenCalled()
  })

  it('initialize skips fetchUser when user is already loaded', async () => {
    const store = useAuthStore()
    store.accessToken = 'token'
    store.user = { id: 1 }

    await store.initialize()

    expect(authService.fetchUser).not.toHaveBeenCalled()
  })
})
