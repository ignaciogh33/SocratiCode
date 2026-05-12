import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ProfileView from '../../views/ProfileView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/profile', name: 'Profile', component: { template: '<div/>' } },
    { path: '/dashboard', name: 'Dashboard', component: { template: '<div/>' } },
  ],
})

function mountView(userState = null) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      auth: {
        user: userState,
        isLoading: false,
        error: null,
      },
    },
  })
  const wrapper = mount(ProfileView, {
    global: {
      plugins: [router, pinia],
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  })
  const authStore = useAuthStore()
  return { wrapper, authStore }
}

describe('ProfileView — initials', () => {
  it('shows first 2 chars of username uppercased', async () => {
    const { wrapper } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    expect(wrapper.find('.profile-view__avatar-initials').text()).toBe('AL')
  })

  it('falls back to SC when no username', async () => {
    const { wrapper } = mountView({ username: '', email: 'a@a.com' })
    await flushPromises()
    expect(wrapper.find('.profile-view__avatar-initials').text()).toBe('SC')
  })

  it('falls back to SC when user is null', async () => {
    const { wrapper } = mountView(null)
    await flushPromises()
    expect(wrapper.find('.profile-view__avatar-initials').text()).toBe('SC')
  })
})

describe('ProfileView — onMounted', () => {
  it('calls fetchUser if user is null', async () => {
    const { authStore } = mountView(null)
    authStore.fetchUser.mockResolvedValueOnce()
    await flushPromises()
    expect(authStore.fetchUser).toHaveBeenCalledOnce()
  })

  it('does not call fetchUser if user already loaded', async () => {
    const { authStore } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    expect(authStore.fetchUser).not.toHaveBeenCalled()
  })

  it('populates form from user data', async () => {
    const { wrapper } = mountView({ username: 'alice', bio: 'dev', theme: 'light', email: 'a@a.com' })
    await flushPromises()
    const inputs = wrapper.findAll('input')
    const usernameInput = inputs.find(i => i.attributes('id') === 'username')
    expect(usernameInput.element.value).toBe('alice')
  })
})

describe('ProfileView — handleUpdateProfile', () => {
  it('calls authStore.updateProfile with form data', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', bio: 'dev', theme: 'dark', email: 'a@a.com' })
    await flushPromises()
    authStore.updateProfile.mockResolvedValueOnce({})
    const profileForm = wrapper.findAll('form')[0]
    await profileForm.trigger('submit')
    await flushPromises()
    expect(authStore.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice', bio: 'dev', theme: 'dark' })
    )
  })

  it('shows profileSuccess feedback on success', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', bio: '', theme: 'dark', email: 'a@a.com' })
    await flushPromises()
    authStore.updateProfile.mockResolvedValueOnce({})
    await wrapper.findAll('form')[0].trigger('submit')
    await flushPromises()
    expect(wrapper.find('.profile-feedback--success').exists()).toBe(true)
  })

  it('shows profileError feedback on failure', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', bio: '', theme: 'dark', email: 'a@a.com' })
    await flushPromises()
    authStore.error = 'Error del servidor'
    authStore.updateProfile.mockRejectedValueOnce(new Error())
    await wrapper.findAll('form')[0].trigger('submit')
    await flushPromises()
    expect(wrapper.find('.profile-feedback--error').exists()).toBe(true)
  })
})

describe('ProfileView — handleChangePassword', () => {
  it('does nothing when passwords are empty', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(authStore.changePassword).not.toHaveBeenCalled()
  })

  it('shows passError when passwords do not match', async () => {
    const { wrapper } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    const passInputs = wrapper.findAll('#current-password, #new-password, #new-password-confirm')
    await wrapper.find('#current-password').setValue('old')
    await wrapper.find('#new-password').setValue('newpass1')
    await wrapper.find('#new-password-confirm').setValue('newpass2')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('.profile-feedback--error').length).toBeGreaterThan(0)
  })

  it('calls authStore.changePassword when passwords match', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    authStore.changePassword.mockResolvedValueOnce()
    await wrapper.find('#current-password').setValue('old')
    await wrapper.find('#new-password').setValue('newpass')
    await wrapper.find('#new-password-confirm').setValue('newpass')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(authStore.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({ current_password: 'old', new_password: 'newpass', re_new_password: 'newpass' })
    )
  })

  it('shows passSuccess feedback after successful change', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    authStore.changePassword.mockResolvedValueOnce()
    await wrapper.find('#current-password').setValue('old')
    await wrapper.find('#new-password').setValue('newpass')
    await wrapper.find('#new-password-confirm').setValue('newpass')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('.profile-feedback--success').length).toBeGreaterThan(0)
  })

  it('shows passError feedback on failed changePassword', async () => {
    const { wrapper, authStore } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    authStore.error = 'Contraseña actual incorrecta'
    authStore.changePassword.mockRejectedValueOnce(new Error())
    await wrapper.find('#current-password').setValue('old')
    await wrapper.find('#new-password').setValue('newpass')
    await wrapper.find('#new-password-confirm').setValue('newpass')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()
    expect(wrapper.findAll('.profile-feedback--error').length).toBeGreaterThan(0)
  })
})

describe('ProfileView — theme toggle', () => {
  it('clicking dark theme button activates it', async () => {
    const { wrapper } = mountView({ username: 'alice', theme: 'light', email: 'a@a.com' })
    await flushPromises()
    const darkBtn = wrapper.findAll('.profile-theme-toggle__btn')[0]
    await darkBtn.trigger('click')
    expect(darkBtn.classes()).toContain('profile-theme-toggle__btn--active')
  })

  it('clicking light theme button activates it', async () => {
    const { wrapper } = mountView({ username: 'alice', theme: 'dark', email: 'a@a.com' })
    await flushPromises()
    const lightBtn = wrapper.findAll('.profile-theme-toggle__btn')[1]
    await lightBtn.trigger('click')
    expect(lightBtn.classes()).toContain('profile-theme-toggle__btn--active')
  })
})

describe('ProfileView — navigation', () => {
  it('back button navigates to Dashboard', async () => {
    await router.push('/profile')
    const { wrapper } = mountView({ username: 'alice', email: 'a@a.com' })
    await flushPromises()
    await wrapper.find('.profile-view__back').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
