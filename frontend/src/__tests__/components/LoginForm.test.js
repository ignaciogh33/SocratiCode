import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginForm from '../../components/auth/LoginForm.vue'

describe('LoginForm', () => {
  it('renders username and password inputs', () => {
    const wrapper = mount(LoginForm)
    expect(wrapper.find('#login-username').exists()).toBe(true)
    expect(wrapper.find('#login-password').exists()).toBe(true)
  })

  it('emits submit event with username and password on form submit', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('#login-username').setValue('admin')
    await wrapper.find('#login-password').setValue('secret')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({ username: 'admin', password: 'secret' })
  })

  it('emits submit with empty strings when fields are blank', async () => {
    const wrapper = mount(LoginForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')[0][0]).toEqual({ username: '', password: '' })
  })

  it('shows spinner on submit button when isLoading is true', () => {
    const wrapper = mount(LoginForm, { props: { isLoading: true } })
    expect(wrapper.find('.app-button__spinner').exists()).toBe(true)
  })

  it('does not show spinner when isLoading is false', () => {
    const wrapper = mount(LoginForm, { props: { isLoading: false } })
    expect(wrapper.find('.app-button__spinner').exists()).toBe(false)
  })

  it('shows username field error from fieldErrors prop', () => {
    const wrapper = mount(LoginForm, {
      props: { fieldErrors: { username: 'Usuario no encontrado' } },
    })
    expect(wrapper.text()).toContain('Usuario no encontrado')
  })

  it('shows password field error from fieldErrors prop', () => {
    const wrapper = mount(LoginForm, {
      props: { fieldErrors: { password: 'Contraseña incorrecta' } },
    })
    expect(wrapper.text()).toContain('Contraseña incorrecta')
  })
})
