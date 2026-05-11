import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RegisterForm from '../../components/auth/RegisterForm.vue'

describe('RegisterForm', () => {
  it('renders all four input fields', () => {
    const wrapper = mount(RegisterForm)
    expect(wrapper.find('#register-username').exists()).toBe(true)
    expect(wrapper.find('#register-email').exists()).toBe(true)
    expect(wrapper.find('#register-password').exists()).toBe(true)
    expect(wrapper.find('#register-confirm-password').exists()).toBe(true)
  })

  it('emits submit event with all fields on form submit', async () => {
    const wrapper = mount(RegisterForm)
    await wrapper.find('#register-username').setValue('nuevo')
    await wrapper.find('#register-email').setValue('n@test.com')
    await wrapper.find('#register-password').setValue('pass123')
    await wrapper.find('#register-confirm-password').setValue('pass123')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      username: 'nuevo',
      email: 'n@test.com',
      password: 'pass123',
      re_password: 'pass123',
    })
  })

  it('emits submit with empty strings when form is blank', async () => {
    const wrapper = mount(RegisterForm)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      username: '',
      email: '',
      password: '',
      re_password: '',
    })
  })

  it('shows spinner when isLoading is true', () => {
    const wrapper = mount(RegisterForm, { props: { isLoading: true } })
    expect(wrapper.find('.app-button__spinner').exists()).toBe(true)
  })

  it('shows field error from fieldErrors prop', () => {
    const wrapper = mount(RegisterForm, {
      props: { fieldErrors: { username: 'Ya existe.', email: 'Email inválido' } },
    })
    expect(wrapper.text()).toContain('Ya existe.')
    expect(wrapper.text()).toContain('Email inválido')
  })
})
