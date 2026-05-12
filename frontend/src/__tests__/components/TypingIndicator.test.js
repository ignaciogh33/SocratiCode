import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypingIndicator from '../../components/chat/TypingIndicator.vue'

describe('TypingIndicator', () => {
  it('renders the typing indicator container', () => {
    const wrapper = mount(TypingIndicator)
    expect(wrapper.find('.typing-indicator').exists()).toBe(true)
  })

  it('renders the avatar container', () => {
    const wrapper = mount(TypingIndicator)
    expect(wrapper.find('.typing-indicator__avatar').exists()).toBe(true)
  })

  it('renders an avatar image', () => {
    const wrapper = mount(TypingIndicator)
    expect(wrapper.find('.typing-indicator__avatar img').exists()).toBe(true)
  })

  it('renders exactly 3 animated dots', () => {
    const wrapper = mount(TypingIndicator)
    const dots = wrapper.findAll('.typing-indicator__dots span')
    expect(dots.length).toBe(3)
  })

  it('renders the dots container', () => {
    const wrapper = mount(TypingIndicator)
    expect(wrapper.find('.typing-indicator__dots').exists()).toBe(true)
  })
})
