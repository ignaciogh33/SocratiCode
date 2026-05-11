import { describe, it, expect, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import { authService } from '../../services/authService'
import api from '../../services/api'

describe('authService', () => {
  it('login calls POST /auth/jwt/create/ and returns tokens', async () => {
    api.post.mockResolvedValue({ data: { access: 'acc', refresh: 'ref' } })
    const result = await authService.login('admin', 'pass')
    expect(api.post).toHaveBeenCalledWith('/auth/jwt/create/', { username: 'admin', password: 'pass' })
    expect(result).toEqual({ access: 'acc', refresh: 'ref' })
  })

  it('register calls POST /auth/users/ with all fields', async () => {
    api.post.mockResolvedValue({ data: { id: 1, username: 'u' } })
    await authService.register({ username: 'u', email: 'u@t.com', password: 'p', re_password: 'p' })
    expect(api.post).toHaveBeenCalledWith('/auth/users/', {
      username: 'u',
      email: 'u@t.com',
      password: 'p',
      re_password: 'p',
    })
  })

  it('fetchUser calls GET /auth/users/me/ and returns user data', async () => {
    api.get.mockResolvedValue({ data: { id: 1, username: 'u', email: 'u@t.com' } })
    const result = await authService.fetchUser()
    expect(api.get).toHaveBeenCalledWith('/auth/users/me/')
    expect(result.id).toBe(1)
  })

  it('refreshToken calls POST /auth/jwt/refresh/ with refresh token', async () => {
    api.post.mockResolvedValue({ data: { access: 'new-acc' } })
    const result = await authService.refreshToken('old-refresh')
    expect(api.post).toHaveBeenCalledWith('/auth/jwt/refresh/', { refresh: 'old-refresh' })
    expect(result).toEqual({ access: 'new-acc' })
  })

  it('updateProfile calls PATCH /auth/users/me/ with profile fields', async () => {
    api.patch.mockResolvedValue({ data: { username: 'nuevo', bio: 'bio' } })
    const result = await authService.updateProfile({ username: 'nuevo', bio: 'bio', theme: 'dark' })
    expect(api.patch).toHaveBeenCalledWith('/auth/users/me/', {
      username: 'nuevo',
      bio: 'bio',
      theme: 'dark',
    })
    expect(result.username).toBe('nuevo')
  })

  it('changePassword calls POST /auth/users/set_password/ with password fields', async () => {
    api.post.mockResolvedValue({ data: {} })
    await authService.changePassword({
      current_password: 'old',
      new_password: 'new',
      re_new_password: 'new',
    })
    expect(api.post).toHaveBeenCalledWith('/auth/users/set_password/', {
      current_password: 'old',
      new_password: 'new',
      re_new_password: 'new',
    })
  })
})
