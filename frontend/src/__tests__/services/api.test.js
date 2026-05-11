import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Tests for api.js interceptors.
 * We use vi.resetModules() + dynamic import to get a fresh axios instance
 * for each test, avoiding module-level state (isRefreshing) contamination.
 */

describe('api.js - request interceptor', () => {
  let api

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    const mod = await import('../../services/api')
    api = mod.default
  })

  it('adds Authorization header when access_token exists in localStorage', async () => {
    localStorage.setItem('access_token', 'my-access-token')
    const handler = api.interceptors.request.handlers.find((h) => h?.fulfilled)
    const config = { headers: {} }
    const result = await handler.fulfilled(config)
    expect(result.headers.Authorization).toBe('Bearer my-access-token')
  })

  it('does not add Authorization header when no token in localStorage', async () => {
    const handler = api.interceptors.request.handlers.find((h) => h?.fulfilled)
    const config = { headers: {} }
    const result = await handler.fulfilled(config)
    expect(result.headers.Authorization).toBeUndefined()
  })

  it('request interceptor returns the config object unchanged otherwise', async () => {
    localStorage.setItem('access_token', 'tok')
    const handler = api.interceptors.request.handlers.find((h) => h?.fulfilled)
    const config = { headers: {}, method: 'get', url: '/test/' }
    const result = await handler.fulfilled(config)
    expect(result.method).toBe('get')
    expect(result.url).toBe('/test/')
  })

  it('request interceptor rejected handler passes errors through', async () => {
    const handler = api.interceptors.request.handlers.find((h) => h?.rejected)
    const error = new Error('some error')
    await expect(handler.rejected(error)).rejects.toThrow('some error')
  })
})

describe('api.js - response interceptor (401 without refresh token)', () => {
  let api

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    window.location = { href: 'http://localhost:3000/' }
    const mod = await import('../../services/api')
    api = mod.default
  })

  it('redirects to /login on 401 when no refresh token is stored', async () => {
    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 401 },
      config: { url: '/some/endpoint/', headers: {}, _retry: false },
    }

    await handler.rejected(error).catch(() => {})

    expect(window.location.href).toBe('/login')
  })

  it('removes tokens from localStorage on 401 without refresh token', async () => {
    localStorage.setItem('access_token', 'stale')
    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 401 },
      config: { url: '/some/endpoint/', headers: {}, _retry: false },
    }

    await handler.rejected(error).catch(() => {})

    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('passes through non-401 errors without modification', async () => {
    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 403 },
      config: { url: '/other/', headers: {}, _retry: false },
    }

    await expect(handler.rejected(error)).rejects.toMatchObject({ response: { status: 403 } })
    expect(window.location.href).toBe('http://localhost:3000/')
  })

  it('passes through 401 on jwt endpoints without retrying', async () => {
    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 401 },
      config: { url: '/auth/jwt/create/', headers: {}, _retry: false },
    }

    await expect(handler.rejected(error)).rejects.toBeDefined()
    expect(window.location.href).toBe('http://localhost:3000/')
  })

  it('response interceptor success handler passes responses through', async () => {
    const handler = api.interceptors.response.handlers.find((h) => h?.fulfilled)
    const response = { status: 200, data: { ok: true } }
    const result = await handler.fulfilled(response)
    expect(result).toBe(response)
  })
})

describe('api.js - response interceptor (401 with valid refresh token → failed refresh)', () => {
  let api

  beforeEach(async () => {
    vi.resetModules()
    localStorage.clear()
    window.location = { href: 'http://localhost:3000/' }
    const mod = await import('../../services/api')
    api = mod.default
  })

  it('redirects to /login when refresh request fails', async () => {
    // Set a refresh token so the interceptor tries to refresh
    localStorage.setItem('refresh_token', 'old-refresh')

    // Mock global fetch/XHR at the axios level by intercepting the raw axios.post
    // We do this by patching the module-level axios instance used by the interceptor.
    // Since the interceptor calls axios.post directly (not api.post), we mock it here.
    const axiosMod = await import('axios')
    const axios = axiosMod.default
    const originalPost = axios.post
    axios.post = vi.fn().mockRejectedValue(new Error('refresh failed'))

    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 401 },
      config: { url: '/data/', headers: {}, _retry: false },
    }

    await handler.rejected(error).catch(() => {})

    expect(window.location.href).toBe('/login')
    expect(localStorage.getItem('access_token')).toBeNull()

    // Restore
    axios.post = originalPost
  })

  it('retries original request and returns new response after successful refresh', async () => {
    localStorage.setItem('refresh_token', 'valid-refresh')

    const axiosMod = await import('axios')
    const axios = axiosMod.default
    const originalPost = axios.post

    // Successful refresh returns a new access token
    axios.post = vi.fn().mockResolvedValue({ data: { access: 'new-token' } })

    // Make api return 200 on retry (mock the adapter directly)
    const MockAdapter = (await import('axios-mock-adapter')).default
    const mock = new MockAdapter(api)
    mock.onGet('/data/').reply(200, { result: 'ok' })

    const handler = api.interceptors.response.handlers.find((h) => h?.rejected)
    const error = {
      response: { status: 401 },
      config: { url: '/data/', headers: { Authorization: 'Bearer old' }, _retry: false, method: 'get' },
    }

    const result = await handler.rejected(error)
    expect(result.data).toEqual({ result: 'ok' })
    expect(localStorage.getItem('access_token')).toBe('new-token')

    mock.restore()
    axios.post = originalPost
  })
})
