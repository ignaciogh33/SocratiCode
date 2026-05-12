import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useChatStore } from '../../stores/chat'
import { useEditorStore } from '../../stores/editor'
import ChatInput from '../../components/chat/ChatInput.vue'

function mountChatInput(chatOverrides = {}, editorOverrides = {}) {
  const wrapper = mount(ChatInput, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            chat: { isStreaming: false, ...chatOverrides },
            editor: {
              editorVisible: true,
              sourceCode: 'print(1)',
              stdout: '',
              stderr: '',
              language: 'python',
              ...editorOverrides,
            },
          },
        }),
      ],
    },
  })
  return wrapper
}

describe('ChatInput', () => {
  it('renders the textarea', () => {
    const wrapper = mountChatInput()
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('shows send button when not streaming', () => {
    const wrapper = mountChatInput({ isStreaming: false })
    expect(wrapper.find('.chat-input__send').exists()).toBe(true)
    expect(wrapper.find('.chat-input__stop').exists()).toBe(false)
  })

  it('shows stop button when streaming', () => {
    const wrapper = mountChatInput({ isStreaming: true })
    expect(wrapper.find('.chat-input__stop').exists()).toBe(true)
    expect(wrapper.find('.chat-input__send').exists()).toBe(false)
  })

  it('send button is disabled when textarea is empty', () => {
    const wrapper = mountChatInput()
    expect(wrapper.find('.chat-input__send').attributes('disabled')).toBeDefined()
  })

  it('send button is enabled when textarea has text', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('Mi pregunta')
    expect(wrapper.find('.chat-input__send').attributes('disabled')).toBeUndefined()
  })

  it('clicking send button calls chatStore.sendMessage', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('Mi pregunta')

    const chatStore = useChatStore()
    await wrapper.find('.chat-input__send').trigger('click')

    expect(chatStore.sendMessage).toHaveBeenCalled()
  })

  it('sendMessage is called with the prompt text', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('¿Qué es Python?')

    const chatStore = useChatStore()
    await wrapper.find('.chat-input__send').trigger('click')

    const callArg = chatStore.sendMessage.mock.calls[0][0]
    expect(callArg.prompt).toBe('¿Qué es Python?')
  })

  it('clears textarea after sending', async () => {
    const wrapper = mountChatInput()
    const textarea = wrapper.find('textarea')
    await textarea.setValue('hola')
    await wrapper.find('.chat-input__send').trigger('click')
    expect(textarea.element.value).toBe('')
  })

  it('Ctrl+Enter triggers send', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('test')

    const chatStore = useChatStore()
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter', ctrlKey: true })

    expect(chatStore.sendMessage).toHaveBeenCalled()
  })

  it('Enter alone does not trigger send', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('test')

    const chatStore = useChatStore()
    await wrapper.find('textarea').trigger('keydown', { key: 'Enter', ctrlKey: false })

    expect(chatStore.sendMessage).not.toHaveBeenCalled()
  })

  it('clicking stop button calls chatStore.cancelStreaming', async () => {
    const wrapper = mountChatInput({ isStreaming: true })
    const chatStore = useChatStore()
    await wrapper.find('.chat-input__stop').trigger('click')
    expect(chatStore.cancelStreaming).toHaveBeenCalled()
  })

  it('sendMessage includes code context when editor is visible', async () => {
    const wrapper = mountChatInput(
      {},
      { editorVisible: true, sourceCode: 'x = 1', stdout: 'output' },
    )
    await wrapper.find('textarea').setValue('explica')

    const chatStore = useChatStore()
    await wrapper.find('.chat-input__send').trigger('click')

    const arg = chatStore.sendMessage.mock.calls[0][0]
    expect(arg.codeContext).toBe('x = 1')
    expect(arg.lastOutput).toBe('output')
  })

  it('sendMessage excludes code context when editor is hidden', async () => {
    const wrapper = mountChatInput(
      {},
      { editorVisible: false, sourceCode: 'x = 1', stdout: 'output' },
    )
    await wrapper.find('textarea').setValue('explica')

    const chatStore = useChatStore()
    await wrapper.find('.chat-input__send').trigger('click')

    const arg = chatStore.sendMessage.mock.calls[0][0]
    expect(arg.codeContext).toBe('')
    expect(arg.lastOutput).toBe('')
  })

  it('does not send when text is only whitespace', async () => {
    const wrapper = mountChatInput()
    await wrapper.find('textarea').setValue('   ')

    const chatStore = useChatStore()
    await wrapper.find('.chat-input__send').trigger('click')

    expect(chatStore.sendMessage).not.toHaveBeenCalled()
  })
})
