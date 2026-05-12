import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import LoginView from '../../views/LoginView.vue'

const LoginFormStub = {
  name: 'LoginForm',
  template: '<div data-testid="login-form"></div>',
  emits: ['submit'],
  props: ['isLoading', 'fieldErrors'],
}
const RegisterFormStub = {
  name: 'RegisterForm',
  template: '<div data-testid="register-form"></div>',
  emits: ['submit'],
  props: ['isLoading', 'fieldErrors'],
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Login', component: { template: '<div/>' } },
      { path: '/dashboard', name: 'Dashboard', component: { template: '<div/>' } },
      { path: '/forgot', name: 'ForgotPassword', component: { template: '<div/>' } },
    ],
  })
}

function mountView() {
  const router = makeRouter()
  const pinia = createTestingPinia({ createSpy: vi.fn })
  const wrapper = mount(LoginView, {
    global: {
      plugins: [router, pinia],
      stubs: {
        LoginForm: LoginFormStub,
        RegisterForm: RegisterFormStub,
        RouterLink: { template: '<a href="#"><slot /></a>' },
      },
    },
  })
  const auth = useAuthStore()
  return { wrapper, auth, router }
}

describe('LoginView', () => {
  it('renders LoginForm by default', () => {
    const { wrapper } = mountView()
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(false)
  })

  it('switches to register tab on click', async () => {
    const { wrapper } = mountView()
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    expect(wrapper.find('[data-testid="register-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(false)
  })

  it('switches back to login tab on click', async () => {
    const { wrapper } = mountView()
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    await tabs[0].trigger('click')
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true)
  })

  it('switchTab clears any existing error', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({ response: { data: { error: 'bad creds' } } })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'u', password: 'p' })
    await flushPromises()
    expect(wrapper.find('.login-view__error').exists()).toBe(true)
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    expect(wrapper.find('.login-view__error').exists()).toBe(false)
  })

  it('handleLogin: calls auth.login with credentials', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockResolvedValueOnce()
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'alice', password: 'secret' })
    await flushPromises()
    expect(auth.login).toHaveBeenCalledWith('alice', 'secret')
  })

  it('handleLogin: redirects to Dashboard on success', async () => {
    const { wrapper, auth, router } = mountView()
    auth.login.mockResolvedValueOnce()
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'alice', password: 'secret' })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('handleLogin: shows error from data.error', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({ response: { data: { error: 'Credenciales incorrectas' } } })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'u', password: 'p' })
    await flushPromises()
    expect(wrapper.find('.login-view__error').text()).toContain('Credenciales incorrectas')
  })

  it('handleLogin: shows error from data.detail', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({ response: { data: { detail: 'Token inválido' } } })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'u', password: 'p' })
    await flushPromises()
    expect(wrapper.find('.login-view__error').text()).toContain('Token inválido')
  })

  it('handleLogin: sets fieldErrors from data.details', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({
      response: { data: { error: 'Error', details: { username: ['Campo requerido'] } } },
    })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'u', password: 'p' })
    await flushPromises()
    const loginFormProps = wrapper.findComponent(LoginFormStub).props('fieldErrors')
    expect(loginFormProps.username).toBe('Campo requerido')
  })

  it('handleLogin: sets fieldErrors from flat fields when no error/detail', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({
      response: { data: { username: ['Este campo es obligatorio.'] } },
    })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: '', password: '' })
    await flushPromises()
    const loginFormProps = wrapper.findComponent(LoginFormStub).props('fieldErrors')
    expect(loginFormProps.username).toBe('Este campo es obligatorio.')
  })

  it('handleLogin: shows connection error when no response data', async () => {
    const { wrapper, auth } = mountView()
    auth.login.mockRejectedValueOnce({ response: null })
    await wrapper.findComponent(LoginFormStub).vm.$emit('submit', { username: 'u', password: 'p' })
    await flushPromises()
    expect(wrapper.find('.login-view__error').text()).toContain('Error de conexión')
  })

  it('handleRegister: calls auth.register and redirects to Dashboard', async () => {
    const { wrapper, auth, router } = mountView()
    auth.register.mockResolvedValueOnce()
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    await wrapper.findComponent(RegisterFormStub).vm.$emit('submit', { username: 'bob', email: 'b@b.com', password: 'pass' })
    await flushPromises()
    expect(auth.register).toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('handleRegister: shows error on failure', async () => {
    const { wrapper, auth } = mountView()
    auth.register.mockRejectedValueOnce({ response: { data: { error: 'El usuario ya existe' } } })
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    await wrapper.findComponent(RegisterFormStub).vm.$emit('submit', { username: 'bob' })
    await flushPromises()
    expect(wrapper.find('.login-view__error').text()).toContain('El usuario ya existe')
  })

  it('login tab is marked active by default', () => {
    const { wrapper } = mountView()
    const tabs = wrapper.findAll('.login-view__tab')
    expect(tabs[0].classes()).toContain('login-view__tab--active')
    expect(tabs[1].classes()).not.toContain('login-view__tab--active')
  })

  it('register tab is marked active after switching', async () => {
    const { wrapper } = mountView()
    const tabs = wrapper.findAll('.login-view__tab')
    await tabs[1].trigger('click')
    expect(tabs[1].classes()).toContain('login-view__tab--active')
    expect(tabs[0].classes()).not.toContain('login-view__tab--active')
  })
})
