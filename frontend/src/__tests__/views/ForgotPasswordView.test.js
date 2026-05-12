import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ForgotPasswordView from '../../views/ForgotPasswordView.vue'

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}))

import api from '../../services/api'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'ForgotPassword', component: { template: '<div/>' } },
    { path: '/login', name: 'Login', component: { template: '<div/>' } },
  ],
})

const InputStub = {
  name: 'AppInput',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'id', 'label', 'type', 'placeholder'],
  emits: ['update:modelValue'],
}
const ButtonStub = {
  name: 'AppButton',
  template: '<button type="submit"><slot /></button>',
  props: ['loading', 'variant', 'block'],
}

function mountView() {
  return mount(ForgotPasswordView, {
    global: {
      plugins: [router],
      stubs: { AppInput: InputStub, AppButton: ButtonStub, RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
  })

  it('renders the form with an email input', () => {
    const wrapper = mountView()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('does not call api.post when email is empty', async () => {
    const wrapper = mountView()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('does not call api.post when email is only whitespace', async () => {
    const wrapper = mountView()
    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('calls api.post with correct endpoint and email', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    const wrapper = mountView()
    await wrapper.find('input').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/auth/users/reset_password/', { email: 'user@example.com' })
  })

  it('shows success message after successful submit', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    const wrapper = mountView()
    await wrapper.find('input').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__success').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows generic error on server failure without data', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: null })
    const wrapper = mountView()
    await wrapper.find('input').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').text()).toContain('Error al enviar el email')
  })

  it('shows specific error when response contains data.error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { error: 'Demasiados intentos' } } })
    const wrapper = mountView()
    await wrapper.find('input').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').text()).toContain('Demasiados intentos')
  })

  it('hides error after successful submit', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: null })
    const wrapper = mountView()
    await wrapper.find('input').setValue('user@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').exists()).toBe(true)

    vi.mocked(api.post).mockResolvedValueOnce({})
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__success').exists()).toBe(true)
  })

  it('renders heading text', () => {
    const wrapper = mountView()
    expect(wrapper.find('.auth-page__heading').text()).toBe('Recuperar contraseña')
  })
})
