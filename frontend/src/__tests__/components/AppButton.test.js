import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../../components/ui/AppButton.vue'

describe('AppButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Enviar' } })
    expect(wrapper.text()).toContain('Enviar')
  })

  it('applies the primary variant class by default', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.classes()).toContain('app-button--primary')
  })

  it('applies the specified variant class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'danger' } })
    expect(wrapper.classes()).toContain('app-button--danger')
  })

  it('applies secondary variant class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'secondary' } })
    expect(wrapper.classes()).toContain('app-button--secondary')
  })

  it('applies ghost variant class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'ghost' } })
    expect(wrapper.classes()).toContain('app-button--ghost')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is disabled when loading prop is true', () => {
    const wrapper = mount(AppButton, { props: { loading: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('shows spinner when loading is true and hides slot content', () => {
    const wrapper = mount(AppButton, { props: { loading: true }, slots: { default: 'Click' } })
    expect(wrapper.find('.app-button__spinner').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Click')
  })

  it('does not show spinner when not loading', () => {
    const wrapper = mount(AppButton, { props: { loading: false }, slots: { default: 'Click' } })
    expect(wrapper.find('.app-button__spinner').exists()).toBe(false)
  })

  it('applies block class when block prop is true', () => {
    const wrapper = mount(AppButton, { props: { block: true } })
    expect(wrapper.classes()).toContain('app-button--block')
  })

  it('uses the type prop for the button element', () => {
    const wrapper = mount(AppButton, { props: { type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})
