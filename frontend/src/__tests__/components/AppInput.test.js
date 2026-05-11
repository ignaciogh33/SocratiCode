import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '../../components/ui/AppInput.vue'

describe('AppInput', () => {
  it('renders a label when label prop is provided', () => {
    const wrapper = mount(AppInput, { props: { id: 'test', label: 'Nombre de usuario' } })
    expect(wrapper.find('label').text()).toBe('Nombre de usuario')
  })

  it('does not render a label when label prop is empty', () => {
    const wrapper = mount(AppInput, { props: { id: 'test' } })
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('renders an input with the given id', () => {
    const wrapper = mount(AppInput, { props: { id: 'my-input' } })
    expect(wrapper.find('input').attributes('id')).toBe('my-input')
  })

  it('renders the current modelValue', () => {
    const wrapper = mount(AppInput, { props: { id: 'x', modelValue: 'hello' } })
    expect(wrapper.find('input').element.value).toBe('hello')
  })

  it('emits update:modelValue on user input', async () => {
    const wrapper = mount(AppInput, { props: { id: 'x', modelValue: '' } })
    await wrapper.find('input').setValue('nuevo valor')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['nuevo valor'])
  })

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(AppInput, { props: { id: 'x', error: 'Campo obligatorio' } })
    expect(wrapper.find('.app-input__error').text()).toBe('Campo obligatorio')
  })

  it('does not show error element when error is empty', () => {
    const wrapper = mount(AppInput, { props: { id: 'x' } })
    expect(wrapper.find('.app-input__error').exists()).toBe(false)
  })

  it('applies error class to wrapper when error is provided', () => {
    const wrapper = mount(AppInput, { props: { id: 'x', error: 'Error!' } })
    expect(wrapper.classes()).toContain('app-input--error')
  })

  it('renders password type input', () => {
    const wrapper = mount(AppInput, { props: { id: 'pw', type: 'password' } })
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('disables the input when disabled prop is true', () => {
    const wrapper = mount(AppInput, { props: { id: 'x', disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('renders placeholder text', () => {
    const wrapper = mount(AppInput, { props: { id: 'x', placeholder: 'Escribe aquí' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Escribe aquí')
  })
})
