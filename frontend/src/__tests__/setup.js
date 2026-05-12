import { afterEach, vi } from 'vitest'

window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Clear localStorage between tests
afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// Stable window.location mock so tests can assert href changes.
// Must use an absolute URL so axios can parse it with new URL().
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/' },
  writable: true,
})

// Suppress Vue warnings in tests
globalThis.__VUE_OPTIONS_API__ = true
globalThis.__VUE_PROD_DEVTOOLS__ = false
