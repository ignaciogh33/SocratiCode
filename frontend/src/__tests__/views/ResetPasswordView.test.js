import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ResetPasswordView from '../../views/ResetPasswordView.vue'

vi.mock('../../services/api', () => ({
  default: { post: vi.fn() },
}))

import api from '../../services/api'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/reset/:uid/:token', name: 'ResetPassword', component: { template: '<div/>' } },
    { path: '/login', name: 'Login', component: { template: '<div/>' } },
  ],
})

const InputStub = {
  name: 'AppInput',
  template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  props: ['modelValue', 'id', 'label', 'type', 'placeholder', 'error'],
  emits: ['update:modelValue'],
}
const ButtonStub = {
  name: 'AppButton',
  template: '<button type="submit"><slot /></button>',
  props: ['loading', 'variant', 'block'],
}

async function mountView(uid = 'abc123', token = 'tok456') {
  await router.push({ name: 'ResetPassword', params: { uid, token } })
  return mount(ResetPasswordView, {
    global: {
      plugins: [router],
      stubs: { AppInput: InputStub, AppButton: ButtonStub, RouterLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('ResetPasswordView', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
  })

  it('renders two password inputs', async () => {
    const wrapper = await mountView()
    expect(wrapper.findAll('input').length).toBe(2)
  })

  it('does not call api.post when passwords are empty', async () => {
    const wrapper = await mountView()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('does not submit when only new password is filled', async () => {
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newpass123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('calls api.post with uid, token and passwords on valid submit', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    const wrapper = await mountView('uid1', 'tok1')
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('newpass123')
    await inputs[1].setValue('newpass123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/auth/users/reset_password_confirm/', {
      uid: 'uid1',
      token: 'tok1',
      new_password: 'newpass123',
      re_new_password: 'newpass123',
    })
  })

  it('shows success state when api.post resolves', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({})
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('pass1')
    await inputs[1].setValue('pass1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__success').exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('shows error from data.error on failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { error: 'Token expirado' } } })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('pass1')
    await inputs[1].setValue('pass1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').text()).toContain('Token expirado')
  })

  it('shows error from data.detail on failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { data: { detail: 'Enlace inválido' } } })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('pass1')
    await inputs[1].setValue('pass1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').text()).toContain('Enlace inválido')
  })

  it('shows generic error when no data on failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: null })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('pass1')
    await inputs[1].setValue('pass1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.auth-page__error').text()).toContain('expirado')
  })

  it('sets fieldErrors from data.details on failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          error: 'Validation error',
          details: { new_password: ['La contraseña es demasiado corta.'] },
        },
      },
    })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('123')
    await inputs[1].setValue('123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    const appInputs = wrapper.findAllComponents(InputStub)
    expect(appInputs[0].props('error')).toBe('La contraseña es demasiado corta.')
  })

  it('renders the heading', async () => {
    const wrapper = await mountView()
    expect(wrapper.find('.auth-page__heading').text()).toBe('Nueva contraseña')
  })
})
