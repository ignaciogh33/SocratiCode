import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useEditorStore } from '../../stores/editor'
import { useUIStore } from '../../stores/ui'
import DashboardView from '../../views/DashboardView.vue'

vi.mock('../../components/editor/CodeEditor.vue', () => ({
  default: { template: '<div data-testid="code-editor" />' },
}))
vi.mock('../../components/layout/AppSidebar.vue', () => ({
  default: { template: '<div data-testid="app-sidebar" />' },
}))
vi.mock('../../components/chat/ChatPanel.vue', () => ({
  default: { template: '<div data-testid="chat-panel" />' },
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'Dashboard', component: { template: '<div/>' } }],
})

function mountView(editorState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      editor: { editorVisible: false, ...editorState },
    },
  })
  return {
    wrapper: mount(DashboardView, { global: { plugins: [router, pinia] } }),
    chatStore: useChatStore(),
    editorStore: useEditorStore(),
    uiStore: useUIStore(),
  }
}

describe('DashboardView', () => {
  it('calls chatStore.fetchSessions on mount', async () => {
    const { chatStore } = mountView()
    await flushPromises()
    expect(chatStore.fetchSessions).toHaveBeenCalledOnce()
  })

  it('renders ChatPanel always', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('[data-testid="chat-panel"]').exists()).toBe(true)
  })

  it('renders AppSidebar', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('[data-testid="app-sidebar"]').exists()).toBe(true)
  })

  it('hides CodeEditor when editorVisible is false', () => {
    const { wrapper } = mountView({ editorVisible: false })
    expect(wrapper.find('[data-testid="code-editor"]').exists()).toBe(false)
  })

  it('shows CodeEditor when editorVisible is true', () => {
    const { wrapper } = mountView({ editorVisible: true })
    expect(wrapper.find('[data-testid="code-editor"]').exists()).toBe(true)
  })

  it('shows resize handle when editorVisible is true', () => {
    const { wrapper } = mountView({ editorVisible: true })
    expect(wrapper.find('.dashboard__resize-handle').exists()).toBe(true)
  })

  it('hides resize handle when editorVisible is false', () => {
    const { wrapper } = mountView({ editorVisible: false })
    expect(wrapper.find('.dashboard__resize-handle').exists()).toBe(false)
  })

  it('startResize adds event listeners and sets cursor', async () => {
    const { wrapper } = mountView({ editorVisible: true })
    const addSpy = vi.spyOn(document, 'addEventListener')
    const handle = wrapper.find('.dashboard__resize-handle')
    await handle.trigger('mousedown')
    expect(document.body.style.cursor).toBe('col-resize')
    expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    addSpy.mockRestore()
  })

  it('stopResize restores cursor and removes event listeners', async () => {
    const { wrapper } = mountView({ editorVisible: true })
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const handle = wrapper.find('.dashboard__resize-handle')
    await handle.trigger('mousedown')
    document.dispatchEvent(new MouseEvent('mouseup'))
    await flushPromises()
    expect(document.body.style.cursor).toBe('')
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('applies sidebar-collapsed class when uiStore.sidebarCollapsed', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { ui: { sidebarCollapsed: true }, editor: { editorVisible: false } },
    })
    const wrapper = mount(DashboardView, { global: { plugins: [router, pinia] } })
    expect(wrapper.find('.dashboard').classes()).toContain('dashboard--sidebar-collapsed')
  })

  it('chat panel flex-basis is 100% when editor hidden', () => {
    const { wrapper } = mountView({ editorVisible: false })
    const chatEl = wrapper.find('.dashboard__chat')
    expect(chatEl.attributes('style')).toContain('100%')
  })

  it('onResize updates editorWidth based on mouse position', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { editor: { editorVisible: true } },
    })
    const wrapper = mount(DashboardView, {
      attachTo: document.body,
      global: { plugins: [router, pinia] },
    })
    await wrapper.find('.dashboard__resize-handle').trigger('mousedown')
    const content = wrapper.find('.dashboard__content')
    vi.spyOn(content.element, 'getBoundingClientRect').mockReturnValue({
      left: 0, width: 1000, top: 0, bottom: 800, right: 1000, height: 800,
    })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }))
    await flushPromises()
    expect(wrapper.find('.dashboard__editor').attributes('style')).toContain('30%')
    wrapper.unmount()
  })

  it('onResize clamps editorWidth to minimum 25%', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { editor: { editorVisible: true } },
    })
    const wrapper = mount(DashboardView, {
      attachTo: document.body,
      global: { plugins: [router, pinia] },
    })
    await wrapper.find('.dashboard__resize-handle').trigger('mousedown')
    const content = wrapper.find('.dashboard__content')
    vi.spyOn(content.element, 'getBoundingClientRect').mockReturnValue({
      left: 0, width: 1000, top: 0, bottom: 800, right: 1000, height: 800,
    })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 10 }))
    await flushPromises()
    expect(wrapper.find('.dashboard__editor').attributes('style')).toContain('25%')
    wrapper.unmount()
  })

  it('onResize clamps editorWidth to maximum 75%', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: { editor: { editorVisible: true } },
    })
    const wrapper = mount(DashboardView, {
      attachTo: document.body,
      global: { plugins: [router, pinia] },
    })
    await wrapper.find('.dashboard__resize-handle').trigger('mousedown')
    const content = wrapper.find('.dashboard__content')
    vi.spyOn(content.element, 'getBoundingClientRect').mockReturnValue({
      left: 0, width: 1000, top: 0, bottom: 800, right: 1000, height: 800,
    })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 990 }))
    await flushPromises()
    expect(wrapper.find('.dashboard__editor').attributes('style')).toContain('75%')
    wrapper.unmount()
  })

  it('onUnmounted removes event listeners', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { wrapper } = mountView({ editorVisible: true })
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    removeSpy.mockRestore()
  })
})
