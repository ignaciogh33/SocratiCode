import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import MessageList from '../../components/chat/MessageList.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

const MessageBubbleStub = {
  name: 'MessageBubble',
  template: '<div class="msg-bubble-stub" :data-id="message.id" />',
  props: ['message'],
}
const TypingIndicatorStub = {
  name: 'TypingIndicator',
  template: '<div data-testid="typing-indicator" />',
}
const SkeletonStub = {
  name: 'SkeletonLoader',
  template: '<div class="skeleton-stub" />',
  props: ['width', 'height'],
}

const baseMessages = [
  { id: 1, role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z', _isStreaming: false },
  { id: 2, role: 'assistant', content: 'Hi', created_at: '2024-01-01T00:01:00Z', _isStreaming: false },
]

function mountList(chatState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      chat: {
        messages: [],
        isLoadingMessages: false,
        isStreaming: false,
        streamBuffer: '',
        activeSessionId: null,
        ...chatState,
      },
    },
  })
  const wrapper = mount(MessageList, {
    global: {
      plugins: [router, pinia],
      stubs: {
        MessageBubble: MessageBubbleStub,
        TypingIndicator: TypingIndicatorStub,
        SkeletonLoader: SkeletonStub,
      },
    },
    attachTo: document.body,
  })
  return { wrapper, chatStore: useChatStore() }
}

describe('MessageList — messages', () => {
  it('renders a MessageBubble for each message', () => {
    const { wrapper } = mountList({ messages: baseMessages })
    expect(wrapper.findAll('.msg-bubble-stub').length).toBe(2)
  })

  it('renders no MessageBubbles when empty', () => {
    const { wrapper } = mountList({ messages: [] })
    expect(wrapper.findAll('.msg-bubble-stub').length).toBe(0)
  })

  it('passes message prop to each MessageBubble', () => {
    const { wrapper } = mountList({ messages: baseMessages })
    const bubbles = wrapper.findAll('.msg-bubble-stub')
    expect(bubbles[0].attributes('data-id')).toBe('1')
    expect(bubbles[1].attributes('data-id')).toBe('2')
  })
})

describe('MessageList — typing indicator', () => {
  it('shows TypingIndicator when streaming and last message not streaming', () => {
    const { wrapper } = mountList({
      messages: baseMessages,
      isStreaming: true,
    })
    expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(true)
  })

  it('hides TypingIndicator when not streaming', () => {
    const { wrapper } = mountList({
      messages: baseMessages,
      isStreaming: false,
    })
    expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(false)
  })

  it('hides TypingIndicator when last message is streaming', () => {
    const streamingMessages = [
      ...baseMessages.slice(0, 1),
      { id: 2, role: 'assistant', content: 'partial', created_at: '2024-01-01T00:01:00Z', _isStreaming: true },
    ]
    const { wrapper } = mountList({
      messages: streamingMessages,
      isStreaming: true,
    })
    expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(false)
  })

  it('shows TypingIndicator when streaming with no messages', () => {
    const { wrapper } = mountList({
      messages: [],
      isStreaming: true,
    })
    expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(true)
  })
})

describe('MessageList — watch callbacks', () => {
  it('calls scrollIntoView when messages are added after mount', async () => {
    const { chatStore } = mountList({ messages: baseMessages, activeSessionId: 1 })
    vi.clearAllMocks()
    chatStore.messages = [
      ...baseMessages,
      { id: 3, role: 'user', content: 'New', created_at: '2024-01-01T00:02:00Z', _isStreaming: false },
    ]
    await flushPromises()
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('calls scrollIntoView when streamBuffer changes', async () => {
    const { chatStore } = mountList({ messages: baseMessages, isStreaming: true })
    vi.clearAllMocks()
    chatStore.streamBuffer = 'partial content...'
    await flushPromises()
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('calls scrollIntoView when activeSessionId changes', async () => {
    const { chatStore } = mountList({ messages: baseMessages, activeSessionId: 1 })
    vi.clearAllMocks()
    chatStore.activeSessionId = 2
    await flushPromises()
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
  })
})

describe('MessageList — loading', () => {
  it('shows skeleton loaders when isLoadingMessages', () => {
    const { wrapper } = mountList({ isLoadingMessages: true })
    expect(wrapper.find('.message-list__loading').exists()).toBe(true)
    expect(wrapper.findAll('.skeleton-stub').length).toBeGreaterThan(0)
  })

  it('hides skeleton when not loading', () => {
    const { wrapper } = mountList({ isLoadingMessages: false })
    expect(wrapper.find('.message-list__loading').exists()).toBe(false)
  })
})
