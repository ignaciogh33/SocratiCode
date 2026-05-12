import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'

// Stub view components so the router doesn't try to load real SFC files
const Stub = defineComponent({ template: '<div />' })

/**
 * Build a fresh in-memory router that replicates the guard logic from
 * src/router/index.js, with the auth state controlled by the caller.
 * This does NOT use the real auth store — no vi.mock needed.
 */
function makeRouter(isAuthenticated) {
  const routes = [
    { path: '/login', name: 'Login', component: Stub, meta: { requiresGuest: true } },
    { path: '/', name: 'Dashboard', component: Stub, meta: { requiresAuth: true } },
    { path: '/perfil', name: 'Profile', component: Stub, meta: { requiresAuth: true } },
    { path: '/forgot-password', name: 'ForgotPassword', component: Stub, meta: { requiresGuest: true } },
    { path: '/reset-password/:uid/:token', name: 'ResetPassword', component: Stub, meta: { requiresGuest: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]

  const router = createRouter({ history: createMemoryHistory(), routes })

  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated) return { name: 'Login' }
    if (to.meta.requiresGuest && isAuthenticated) return { name: 'Dashboard' }
    return true
  })

  return router
}

describe('router navigation guards', () => {
  it('unauthenticated user navigating to / is redirected to Login', async () => {
    const router = makeRouter(false)
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('unauthenticated user navigating to /perfil is redirected to Login', async () => {
    const router = makeRouter(false)
    await router.push('/perfil')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('authenticated user navigating to / reaches Dashboard', async () => {
    const router = makeRouter(true)
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('authenticated user navigating to /perfil reaches Profile', async () => {
    const router = makeRouter(true)
    await router.push('/perfil')
    expect(router.currentRoute.value.name).toBe('Profile')
  })

  it('authenticated user navigating to /login is redirected to Dashboard', async () => {
    const router = makeRouter(true)
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('authenticated user navigating to /forgot-password is redirected to Dashboard', async () => {
    const router = makeRouter(true)
    await router.push('/forgot-password')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('unauthenticated user navigating to /login reaches Login', async () => {
    const router = makeRouter(false)
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('unauthenticated user navigating to /forgot-password reaches ForgotPassword', async () => {
    const router = makeRouter(false)
    await router.push('/forgot-password')
    expect(router.currentRoute.value.name).toBe('ForgotPassword')
  })

  it('unauthenticated user navigating to /reset-password/:uid/:token reaches ResetPassword', async () => {
    const router = makeRouter(false)
    await router.push('/reset-password/uid123/tok456')
    expect(router.currentRoute.value.name).toBe('ResetPassword')
  })

  it('authenticated user navigating to /reset-password/:uid/:token is redirected to Dashboard', async () => {
    const router = makeRouter(true)
    await router.push('/reset-password/uid123/tok456')
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('unknown path redirects to / (and then to Login when unauthenticated)', async () => {
    const router = makeRouter(false)
    await router.push('/this-does-not-exist')
    expect(router.currentRoute.value.name).toBe('Login')
  })
})

// ─── Tests using the actual router/index.js for module coverage ─────────────
// Import the real module so its lines count in the v8 coverage report.
// The real router uses useAuthStore() inside its guard; we control auth state
// via localStorage + a fresh pinia before each navigation.
describe('router/index.js (actual module)', () => {
  let actualRouter

  beforeAll(async () => {
    actualRouter = (await import('../../router/index')).default
  })

  beforeEach(() => {
    // Fresh pinia ensures useAuthStore() creates a new store that re-reads
    // localStorage on each test.
    setActivePinia(createPinia())
  })

  it('unauthenticated user navigating to / is redirected to Login', async () => {
    // localStorage is empty (cleared by afterEach in setup.js)
    await actualRouter.push('/')
    expect(actualRouter.currentRoute.value.name).toBe('Login')
  })

  it('authenticated user navigating to / reaches Dashboard', async () => {
    localStorage.setItem('access_token', 'valid-token')
    await actualRouter.push('/')
    expect(actualRouter.currentRoute.value.name).toBe('Dashboard')
  })

  it('authenticated user navigating to /login is redirected to Dashboard', async () => {
    localStorage.setItem('access_token', 'valid-token')
    await actualRouter.push('/login')
    expect(actualRouter.currentRoute.value.name).toBe('Dashboard')
  })

  it('unauthenticated user navigating to /forgot-password reaches ForgotPassword', async () => {
    await actualRouter.push('/forgot-password')
    expect(actualRouter.currentRoute.value.name).toBe('ForgotPassword')
  })

  it('authenticated user navigating to /perfil reaches Profile', async () => {
    localStorage.setItem('access_token', 'valid-token')
    await actualRouter.push('/perfil')
    expect(actualRouter.currentRoute.value.name).toBe('Profile')
  })

  it('unauthenticated user navigating to /reset-password/:uid/:token reaches ResetPassword', async () => {
    await actualRouter.push('/reset-password/abc123/tok456')
    expect(actualRouter.currentRoute.value.name).toBe('ResetPassword')
  })
})
