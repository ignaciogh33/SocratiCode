import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import { useEditorStore } from '../../stores/editor'
import { useUIStore } from '../../stores/ui'
import AppSidebar from '../../components/layout/AppSidebar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'Dashboard', component: { template: '<div/>' } },
    { path: '/login', name: 'Login', component: { template: '<div/>' } },
    { path: '/profile', name: 'Profile', component: { template: '<div/>' } },
  ],
})

const SkeletonStub = { template: '<div class="skeleton-stub" />', props: ['width', 'height'] }

function mountSidebar(chatState = {}, uiState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      chat: {
        sessions: [],
        isLoadingSessions: false,
        sessionsNextPage: null,
        activeSessionId: null,
        ...chatState,
      },
      ui: { sidebarCollapsed: false, ...uiState },
      editor: { editorVisible: false },
    },
  })
  const wrapper = mount(AppSidebar, {
    global: {
      plugins: [router, pinia],
      stubs: { SkeletonLoader: SkeletonStub },
    },
  })
  return {
    wrapper,
    chatStore: useChatStore(),
    authStore: useAuthStore(),
    editorStore: useEditorStore(),
    uiStore: useUIStore(),
  }
}

describe('AppSidebar — rendering', () => {
  it('renders the sidebar element', () => {
    const { wrapper } = mountSidebar()
    expect(wrapper.find('.sidebar').exists()).toBe(true)
  })

  it('shows skeleton loaders when loading sessions with empty list', () => {
    const { wrapper } = mountSidebar({ isLoadingSessions: true, sessions: [] })
    expect(wrapper.findAll('.sidebar__session-skeleton').length).toBeGreaterThan(0)
  })

  it('renders session items when sessions available', () => {
    const sessions = [
      { id: 1, title: 'Session 1', updated_at: '2024-01-01T00:00:00Z' },
      { id: 2, title: 'Session 2', updated_at: '2024-01-02T00:00:00Z' },
    ]
    const { wrapper } = mountSidebar({ sessions })
    expect(wrapper.findAll('.sidebar__session').length).toBe(2)
  })

  it('marks the active session', () => {
    const sessions = [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper } = mountSidebar({ sessions, activeSessionId: 1 })
    expect(wrapper.find('.sidebar__session--active').exists()).toBe(true)
  })

  it('applies collapsed class when sidebarCollapsed', () => {
    const { wrapper } = mountSidebar({}, { sidebarCollapsed: true })
    expect(wrapper.find('.sidebar').classes()).toContain('sidebar--collapsed')
  })
})

describe('AppSidebar — actions', () => {
  it('handleNewChat calls chatStore.createSession', async () => {
    const { wrapper, chatStore } = mountSidebar()
    chatStore.createSession.mockResolvedValueOnce()
    await wrapper.find('.sidebar__new-chat').trigger('click')
    await flushPromises()
    expect(chatStore.createSession).toHaveBeenCalledOnce()
  })

  it('clicking a session calls chatStore.setActiveSession', async () => {
    const sessions = [{ id: 5, title: 'S5', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    await wrapper.find('.sidebar__session').trigger('click')
    expect(chatStore.setActiveSession).toHaveBeenCalledWith(5)
  })

  it('toggleSidebar called on toggle button click', async () => {
    const { wrapper, uiStore } = mountSidebar()
    await wrapper.find('.sidebar__toggle').trigger('click')
    expect(uiStore.toggleSidebar).toHaveBeenCalledOnce()
  })

  it('toggleEditor called on toggle editor button click', async () => {
    const { wrapper, editorStore } = mountSidebar()
    await wrapper.find('.sidebar__toggle-editor').trigger('click')
    expect(editorStore.toggleEditor).toHaveBeenCalledOnce()
  })

  it('handleLogout calls authStore.logout and navigates to Login', async () => {
    const { wrapper, authStore } = mountSidebar()
    authStore.logout.mockImplementation(() => {})
    await wrapper.find('.sidebar__footer-btn--logout').trigger('click')
    await flushPromises()
    expect(authStore.logout).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('profile button navigates to Profile', async () => {
    const { wrapper } = mountSidebar()
    await wrapper.find('.sidebar__footer-btn--profile').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('Profile')
  })
})

describe('AppSidebar — rename', () => {
  it('startRename shows edit input for that session', async () => {
    const sessions = [{ id: 10, title: 'Old Title', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper } = mountSidebar({ sessions })
    await wrapper.find('.sidebar__session-action:not(.sidebar__session-action--danger)').trigger('click')
    await flushPromises()
    expect(wrapper.find('.sidebar__session-edit').exists()).toBe(true)
  })

  it('saveRename calls chatStore.renameSession with trimmed title', async () => {
    const sessions = [{ id: 10, title: 'Old', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    chatStore.renameSession.mockResolvedValueOnce()
    await wrapper.find('.sidebar__session-action:not(.sidebar__session-action--danger)').trigger('click')
    await flushPromises()
    const input = wrapper.find('.sidebar__session-edit')
    await input.setValue('New Title ')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(chatStore.renameSession).toHaveBeenCalledWith(10, 'New Title')
  })

  it('saveRename with empty title does not call renameSession', async () => {
    const sessions = [{ id: 10, title: 'Old', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    await wrapper.find('.sidebar__session-action:not(.sidebar__session-action--danger)').trigger('click')
    await flushPromises()
    const input = wrapper.find('.sidebar__session-edit')
    await input.setValue('')
    await input.trigger('keyup.enter')
    await flushPromises()
    expect(chatStore.renameSession).not.toHaveBeenCalled()
  })

  it('cancelRename on Escape hides edit input', async () => {
    const sessions = [{ id: 10, title: 'Old', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper } = mountSidebar({ sessions })
    await wrapper.find('.sidebar__session-action:not(.sidebar__session-action--danger)').trigger('click')
    await flushPromises()
    await wrapper.find('.sidebar__session-edit').trigger('keyup.escape')
    await flushPromises()
    expect(wrapper.find('.sidebar__session-edit').exists()).toBe(false)
  })
})

describe('AppSidebar — delete', () => {
  it('handleDelete calls chatStore.deleteSession when confirmed', async () => {
    window.confirm = vi.fn().mockReturnValue(true)
    const sessions = [{ id: 7, title: 'To Delete', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    chatStore.deleteSession.mockResolvedValueOnce()
    await wrapper.find('.sidebar__session-action--danger').trigger('click')
    await flushPromises()
    expect(chatStore.deleteSession).toHaveBeenCalledWith(7)
  })

  it('handleDelete does nothing when confirm is cancelled', async () => {
    window.confirm = vi.fn().mockReturnValue(false)
    const sessions = [{ id: 7, title: 'To Delete', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    await wrapper.find('.sidebar__session-action--danger').trigger('click')
    await flushPromises()
    expect(chatStore.deleteSession).not.toHaveBeenCalled()
  })
})

describe('AppSidebar — collapsed mode', () => {
  it('collapsed logo-toggle button calls uiStore.toggleSidebar', async () => {
    const { wrapper, uiStore } = mountSidebar({}, { sidebarCollapsed: true })
    await wrapper.find('.sidebar__logo-toggle').trigger('click')
    expect(uiStore.toggleSidebar).toHaveBeenCalledOnce()
  })
})

describe('AppSidebar — rename blur', () => {
  it('blur on edit input triggers saveRename', async () => {
    const sessions = [{ id: 10, title: 'Old', updated_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountSidebar({ sessions })
    chatStore.renameSession.mockResolvedValueOnce()
    await wrapper.find('.sidebar__session-action:not(.sidebar__session-action--danger)').trigger('click')
    await flushPromises()
    const input = wrapper.find('.sidebar__session-edit')
    await input.setValue('Renamed')
    await input.trigger('blur')
    await flushPromises()
    expect(chatStore.renameSession).toHaveBeenCalledWith(10, 'Renamed')
  })
})

describe('AppSidebar — watch auto-load', () => {
  it('watch triggers fetchSessions when sessions added and no scroll overflow', async () => {
    const { wrapper, chatStore } = mountSidebar({
      sessions: [],
      sessionsNextPage: 2,
      isLoadingSessions: false,
    })
    chatStore.fetchSessions.mockResolvedValueOnce()
    const container = wrapper.find('.sidebar__sessions')
    Object.defineProperty(container.element, 'scrollHeight', { value: 80, configurable: true })
    Object.defineProperty(container.element, 'clientHeight', { value: 200, configurable: true })
    chatStore.sessions = [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }]
    await flushPromises()
    expect(chatStore.fetchSessions).toHaveBeenCalledWith(2)
  })

  it('watch does not fetch when sessions overflow the container', async () => {
    const { wrapper, chatStore } = mountSidebar({
      sessions: [],
      sessionsNextPage: 2,
      isLoadingSessions: false,
    })
    const container = wrapper.find('.sidebar__sessions')
    Object.defineProperty(container.element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(container.element, 'clientHeight', { value: 200, configurable: true })
    chatStore.sessions = [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }]
    await flushPromises()
    expect(chatStore.fetchSessions).not.toHaveBeenCalled()
  })
})

describe('AppSidebar — infinite scroll', () => {
  it('onSessionsScroll loads next page when near bottom', async () => {
    const { wrapper, chatStore } = mountSidebar({
      sessions: [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }],
      sessionsNextPage: 2,
      isLoadingSessions: false,
    })
    chatStore.fetchSessions.mockResolvedValueOnce()
    const container = wrapper.find('.sidebar__sessions')
    Object.defineProperty(container.element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(container.element, 'scrollTop', { value: 420, configurable: true })
    Object.defineProperty(container.element, 'clientHeight', { value: 100, configurable: true })
    await container.trigger('scroll')
    expect(chatStore.fetchSessions).toHaveBeenCalledWith(2)
  })

  it('onSessionsScroll does not load when not near bottom', async () => {
    const { wrapper, chatStore } = mountSidebar({
      sessions: [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }],
      sessionsNextPage: 2,
      isLoadingSessions: false,
    })
    const container = wrapper.find('.sidebar__sessions')
    Object.defineProperty(container.element, 'scrollHeight', { value: 1000, configurable: true })
    Object.defineProperty(container.element, 'scrollTop', { value: 0, configurable: true })
    Object.defineProperty(container.element, 'clientHeight', { value: 100, configurable: true })
    await container.trigger('scroll')
    expect(chatStore.fetchSessions).not.toHaveBeenCalled()
  })

  it('onSessionsScroll does not load when already loading', async () => {
    const { wrapper, chatStore } = mountSidebar({
      sessions: [{ id: 1, title: 'S1', updated_at: '2024-01-01T00:00:00Z' }],
      sessionsNextPage: 2,
      isLoadingSessions: true,
    })
    const container = wrapper.find('.sidebar__sessions')
    Object.defineProperty(container.element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(container.element, 'scrollTop', { value: 420, configurable: true })
    Object.defineProperty(container.element, 'clientHeight', { value: 100, configurable: true })
    await container.trigger('scroll')
    expect(chatStore.fetchSessions).not.toHaveBeenCalled()
  })
})
