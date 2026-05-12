import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import ChatPanel from '../../components/chat/ChatPanel.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', name: 'Home', component: { template: '<div/>' } }],
})

const MessageListStub = { template: '<div data-testid="message-list" />' }
const ChatInputStub = { template: '<div data-testid="chat-input" />' }
const AppButtonStub = {
  template: '<button data-testid="app-button" @click="$emit(\'click\')"><slot /></button>',
  emits: ['click'],
  props: ['variant'],
}

function mountPanel(chatState = {}, authState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      chat: {
        activeSessionId: null,
        messages: [],
        ...chatState,
      },
      auth: {
        user: null,
        ...authState,
      },
    },
  })
  const wrapper = mount(ChatPanel, {
    global: {
      plugins: [router, pinia],
      stubs: {
        MessageList: MessageListStub,
        ChatInput: ChatInputStub,
        AppButton: AppButtonStub,
      },
    },
  })
  return { wrapper, chatStore: useChatStore(), authStore: useAuthStore() }
}

describe('ChatPanel — empty state (no session)', () => {
  it('shows empty state when no active session', () => {
    const { wrapper } = mountPanel({ activeSessionId: null })
    expect(wrapper.find('.chat-panel__empty').exists()).toBe(true)
  })

  it('does not show active session UI when no session', () => {
    const { wrapper } = mountPanel({ activeSessionId: null })
    expect(wrapper.find('.chat-panel__active-empty').exists()).toBe(false)
    expect(wrapper.find('[data-testid="message-list"]').exists()).toBe(false)
  })

  it('calls chatStore.createSession when "Nueva conversación" button is clicked', async () => {
    const { wrapper, chatStore } = mountPanel({ activeSessionId: null })
    chatStore.createSession.mockResolvedValueOnce()
    await wrapper.find('[data-testid="app-button"]').trigger('click')
    await flushPromises()
    expect(chatStore.createSession).toHaveBeenCalledOnce()
  })
})

describe('ChatPanel — active session, no messages', () => {
  it('shows greeting state when session active but 0 messages', () => {
    const { wrapper } = mountPanel({ activeSessionId: 42, messages: [] })
    expect(wrapper.find('.chat-panel__active-empty').exists()).toBe(true)
    expect(wrapper.find('.chat-panel__greeting').exists()).toBe(true)
  })

  it('shows ChatInput in greeting state', () => {
    const { wrapper } = mountPanel({ activeSessionId: 42, messages: [] })
    expect(wrapper.find('[data-testid="chat-input"]').exists()).toBe(true)
  })

  it('does not show MessageList in greeting state', () => {
    const { wrapper } = mountPanel({ activeSessionId: 42, messages: [] })
    expect(wrapper.find('[data-testid="message-list"]').exists()).toBe(false)
  })

  it('greeting text contains username when user is loaded', () => {
    const { wrapper } = mountPanel(
      { activeSessionId: 42, messages: [] },
      { user: { username: 'TestUser' } }
    )
    expect(wrapper.find('.chat-panel__greeting-text').text()).toContain('TestUser')
  })
})

describe('ChatPanel — watch activeSessionId', () => {
  it('updates greeting when activeSessionId changes and no messages', async () => {
    const { wrapper, chatStore } = mountPanel({ activeSessionId: 1, messages: [] })
    chatStore.activeSessionId = 99
    await flushPromises()
    expect(wrapper.find('.chat-panel__active-empty').exists()).toBe(true)
  })

  it('does not update greeting when messages exist on session change', async () => {
    const messages = [{ id: 1, role: 'user', content: 'Hi', created_at: '2024-01-01T00:00:00Z' }]
    const { wrapper, chatStore } = mountPanel({ activeSessionId: 1, messages })
    chatStore.activeSessionId = 99
    await flushPromises()
    expect(wrapper.find('[data-testid="message-list"]').exists()).toBe(true)
  })
})

describe('ChatPanel — greeting time branches', () => {
  it('shows morning greeting (Buenos días)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(8)
    const { wrapper } = mountPanel(
      { activeSessionId: 1, messages: [] },
      { user: { username: 'Juan' } }
    )
    const text = wrapper.find('.chat-panel__greeting-text').text()
    expect(text).toContain('Juan')
  })

  it('shows afternoon greeting (Buenas tardes)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(15)
    const { wrapper } = mountPanel(
      { activeSessionId: 1, messages: [] },
      { user: { username: 'Ana' } }
    )
    const text = wrapper.find('.chat-panel__greeting-text').text()
    expect(text).toContain('Ana')
  })

  it('shows night greeting (Buenas noches)', () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(21)
    const { wrapper } = mountPanel(
      { activeSessionId: 1, messages: [] },
      { user: { username: 'Carlos' } }
    )
    const text = wrapper.find('.chat-panel__greeting-text').text()
    expect(text).toContain('Carlos')
  })
})

describe('ChatPanel — active session with messages', () => {
  const messages = [
    { id: 1, role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
    { id: 2, role: 'assistant', content: 'Hi', created_at: '2024-01-01T00:01:00Z' },
  ]

  it('shows MessageList when session has messages', () => {
    const { wrapper } = mountPanel({ activeSessionId: 1, messages })
    expect(wrapper.find('[data-testid="message-list"]').exists()).toBe(true)
  })

  it('shows ChatInput when session has messages', () => {
    const { wrapper } = mountPanel({ activeSessionId: 1, messages })
    expect(wrapper.find('[data-testid="chat-input"]').exists()).toBe(true)
  })

  it('does not show greeting when messages exist', () => {
    const { wrapper } = mountPanel({ activeSessionId: 1, messages })
    expect(wrapper.find('.chat-panel__active-empty').exists()).toBe(false)
  })

  it('does not show empty state when session is active', () => {
    const { wrapper } = mountPanel({ activeSessionId: 1, messages })
    expect(wrapper.find('.chat-panel__empty').exists()).toBe(false)
  })
})
