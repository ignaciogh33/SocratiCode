import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MessageBubble from '../../components/chat/MessageBubble.vue'

// highlight.js CSS import throws in jsdom — stub it out
vi.mock('highlight.js/styles/github-dark.min.css', () => ({}))
// MessageBubble imports an SVG logo — stub asset imports
vi.mock('../../assets/images/logo-circular.svg', () => ({ default: 'logo.svg' }))

function makeMessage(overrides = {}) {
  return {
    role: 'assistant',
    content: 'Hola, ¿en qué puedo ayudarte?',
    moderated: false,
    _isStreaming: false,
    ...overrides,
  }
}

describe('MessageBubble', () => {
  it('applies user class for user messages', () => {
    const wrapper = mount(MessageBubble, { props: { message: makeMessage({ role: 'user' }) } })
    expect(wrapper.classes()).toContain('message-bubble--user')
  })

  it('applies assistant class for assistant messages', () => {
    const wrapper = mount(MessageBubble, { props: { message: makeMessage({ role: 'assistant' }) } })
    expect(wrapper.classes()).toContain('message-bubble--assistant')
  })

  it('renders message content in the body', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ content: 'Texto simple' }) },
    })
    expect(wrapper.find('.message-bubble__body').text()).toContain('Texto simple')
  })

  it('renders nothing in body when content is empty', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ content: '' }) },
    })
    expect(wrapper.find('.message-bubble__body').html()).not.toContain('<p')
  })

  it('shows moderation warning icon when message is moderated', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ moderated: true }) },
    })
    expect(wrapper.find('.message-bubble__moderated').exists()).toBe(true)
  })

  it('does not show moderation icon when message is not moderated', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ moderated: false }) },
    })
    expect(wrapper.find('.message-bubble__moderated').exists()).toBe(false)
  })

  it('shows streaming cursor when _isStreaming is true', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ _isStreaming: true }) },
    })
    expect(wrapper.find('.message-bubble__cursor').exists()).toBe(true)
  })

  it('hides streaming cursor when _isStreaming is false', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ _isStreaming: false }) },
    })
    expect(wrapper.find('.message-bubble__cursor').exists()).toBe(false)
  })

  it('renders markdown bold text as <strong>', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ content: '**negrita**' }) },
    })
    expect(wrapper.find('.message-bubble__body').html()).toContain('<strong>')
  })

  it('renders fenced code block with code-block structure', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ content: '```python\nprint(1)\n```' }) },
    })
    expect(wrapper.find('.message-bubble__body').html()).toContain('code-block')
  })

  it('assistant avatar uses img element', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ role: 'assistant' }) },
    })
    expect(wrapper.find('.message-bubble__avatar img').exists()).toBe(true)
  })

  it('user avatar uses SVG icon div', () => {
    const wrapper = mount(MessageBubble, {
      props: { message: makeMessage({ role: 'user' }) },
    })
    expect(wrapper.find('.message-bubble__avatar-user').exists()).toBe(true)
  })
})
