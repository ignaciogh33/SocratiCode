import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '../../stores/ui'

describe('useUIStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with sidebarCollapsed = false', () => {
    const store = useUIStore()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('toggleSidebar flips false → true', () => {
    const store = useUIStore()
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
  })

  it('toggleSidebar flips true → false', () => {
    const store = useUIStore()
    store.setSidebarCollapsed(true)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('setSidebarCollapsed(true) sets to true', () => {
    const store = useUIStore()
    store.setSidebarCollapsed(true)
    expect(store.sidebarCollapsed).toBe(true)
  })

  it('setSidebarCollapsed(false) sets to false', () => {
    const store = useUIStore()
    store.setSidebarCollapsed(true)
    store.setSidebarCollapsed(false)
    expect(store.sidebarCollapsed).toBe(false)
  })
})
