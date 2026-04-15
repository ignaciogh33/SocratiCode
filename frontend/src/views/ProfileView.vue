<template>
  <div class="profile-view">
    <!-- Header -->
    <header class="profile-view__header">
      <button class="profile-view__back" @click="router.push({ name: 'Dashboard' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver al chat
      </button>
      <div class="profile-view__brand">
        <img src="../assets/images/logo-circular.svg" alt="SocratiCode" class="profile-view__logo" />
        <span class="profile-view__brand-name">SocratiCode</span>
      </div>
    </header>

    <!-- Main content -->
    <main class="profile-view__main">

      <!-- Avatar -->
      <div class="profile-view__avatar">
        <span class="profile-view__avatar-initials">{{ initials }}</span>
      </div>

      <!-- Section 1: Profile Info -->
      <section class="profile-card">
        <h2 class="profile-card__title">Información personal</h2>

        <form class="profile-card__form" @submit.prevent="handleUpdateProfile">
          <!-- Username -->
          <div class="profile-field">
            <label class="profile-field__label" for="username">Nombre de usuario</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="profile-field__input"
              placeholder="Tu nombre de usuario"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Email (read-only) -->
          <div class="profile-field">
            <label class="profile-field__label" for="email">
              Correo electrónico
              <span class="profile-field__badge">Solo lectura</span>
            </label>
            <input
              id="email"
              :value="authStore.user?.email"
              type="email"
              class="profile-field__input profile-field__input--readonly"
              readonly
              title="El correo electrónico no se puede modificar"
            />
          </div>

          <!-- Bio -->
          <div class="profile-field">
            <label class="profile-field__label" for="bio">Sobre mí</label>
            <textarea
              id="bio"
              v-model="form.bio"
              class="profile-field__input profile-field__textarea"
              placeholder="Cuéntanos algo sobre ti..."
              rows="3"
              :disabled="authStore.isLoading"
            ></textarea>
          </div>

          <!-- Theme -->
          <div class="profile-field">
            <label class="profile-field__label">Tema preferido</label>
            <div class="profile-theme-toggle">
              <button
                type="button"
                class="profile-theme-toggle__btn"
                :class="{ 'profile-theme-toggle__btn--active': form.theme === 'dark' }"
                @click="form.theme = 'dark'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Oscuro
              </button>
              <button
                type="button"
                class="profile-theme-toggle__btn"
                :class="{ 'profile-theme-toggle__btn--active': form.theme === 'light' }"
                @click="form.theme = 'light'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                Claro
              </button>
            </div>
          </div>

          <!-- Feedback -->
          <Transition name="fade-msg">
            <p v-if="profileSuccess" class="profile-feedback profile-feedback--success">
              ✓ Perfil actualizado correctamente
            </p>
            <p v-else-if="profileError" class="profile-feedback profile-feedback--error">
              ✗ {{ profileError }}
            </p>
          </Transition>

          <button
            type="submit"
            class="profile-btn profile-btn--primary"
            :disabled="authStore.isLoading"
          >
            <span v-if="authStore.isLoading" class="profile-btn__spinner"></span>
            {{ authStore.isLoading ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </form>
      </section>

      <!-- Section 2: Change Password -->
      <section class="profile-card">
        <h2 class="profile-card__title">Cambiar contraseña</h2>

        <form class="profile-card__form" @submit.prevent="handleChangePassword">
          <div class="profile-field">
            <label class="profile-field__label" for="current-password">Contraseña actual</label>
            <input
              id="current-password"
              v-model="passForm.current_password"
              type="password"
              class="profile-field__input"
              placeholder="Tu contraseña actual"
              autocomplete="current-password"
              :disabled="passLoading"
            />
          </div>

          <div class="profile-field">
            <label class="profile-field__label" for="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              v-model="passForm.new_password"
              type="password"
              class="profile-field__input"
              placeholder="Nueva contraseña"
              autocomplete="new-password"
              :disabled="passLoading"
            />
          </div>

          <div class="profile-field">
            <label class="profile-field__label" for="new-password-confirm">Repetir nueva contraseña</label>
            <input
              id="new-password-confirm"
              v-model="passForm.re_new_password"
              type="password"
              class="profile-field__input"
              placeholder="Repite la nueva contraseña"
              autocomplete="new-password"
              :disabled="passLoading"
            />
          </div>

          <!-- Feedback -->
          <Transition name="fade-msg">
            <p v-if="passSuccess" class="profile-feedback profile-feedback--success">
              ✓ Contraseña cambiada correctamente
            </p>
            <p v-else-if="passError" class="profile-feedback profile-feedback--error">
              ✗ {{ passError }}
            </p>
          </Transition>

          <button
            type="submit"
            class="profile-btn profile-btn--outline"
            :disabled="passLoading"
          >
            <span v-if="passLoading" class="profile-btn__spinner"></span>
            {{ passLoading ? 'Cambiando...' : 'Cambiar contraseña' }}
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ─── Profile form ───
const form = ref({
  username: '',
  bio: '',
  theme: 'dark',
})

const profileSuccess = ref(false)
const profileError = ref('')

onMounted(async () => {
  if (!authStore.user) await authStore.fetchUser()
  form.value.username = authStore.user?.username || ''
  form.value.bio = authStore.user?.bio || ''
  form.value.theme = authStore.user?.theme || 'dark'
})

const initials = computed(() => {
  const name = authStore.user?.username || ''
  return name.slice(0, 2).toUpperCase() || 'SC'
})

async function handleUpdateProfile() {
  profileSuccess.value = false
  profileError.value = ''
  try {
    await authStore.updateProfile({
      username: form.value.username,
      bio: form.value.bio,
      theme: form.value.theme,
    })
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 4000)
  } catch {
    profileError.value = authStore.error || 'Error al guardar los cambios'
    setTimeout(() => { profileError.value = '' }, 5000)
  }
}

// ─── Password form ───
const passForm = ref({
  current_password: '',
  new_password: '',
  re_new_password: '',
})
const passLoading = ref(false)
const passSuccess = ref(false)
const passError = ref('')

async function handleChangePassword() {
  if (!passForm.value.new_password || !passForm.value.current_password) return
  if (passForm.value.new_password !== passForm.value.re_new_password) {
    passError.value = 'Las contraseñas nuevas no coinciden'
    setTimeout(() => { passError.value = '' }, 5000)
    return
  }

  passLoading.value = true
  passSuccess.value = false
  passError.value = ''
  try {
    await authStore.changePassword(passForm.value)
    passSuccess.value = true
    passForm.value = { current_password: '', new_password: '', re_new_password: '' }
    setTimeout(() => { passSuccess.value = false }, 4000)
  } catch {
    passError.value = authStore.error || 'Error al cambiar la contraseña'
    setTimeout(() => { passError.value = '' }, 5000)
  } finally {
    passLoading.value = false
  }
}
</script>

<style scoped>
/* ─── Layout ─── */
.profile-view {
  height: 100vh;
  background-color: var(--color-surface-chat);
  display: flex;
  flex-direction: column;
  font-family: var(--font-sans);
  overflow: hidden;
}

/* ─── Header ─── */
.profile-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface-sidebar);
}

.profile-view__back {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.profile-view__back:hover {
  color: var(--color-text-body);
  background-color: var(--color-surface-input);
}

.profile-view__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-view__logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.profile-view__brand-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.3px;
}

/* ─── Main ─── */
.profile-view__main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 24px;
}

.profile-view__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-body);
  text-align: center;
  margin: 0;
}

/* ─── Avatar ─── */
.profile-view__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-hint));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-view__avatar-initials {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

/* ─── Cards ─── */
.profile-card {
  width: 100%;
  max-width: 560px;
  background-color: var(--color-surface-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
}

.profile-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 20px;
}

.profile-card__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Fields ─── */
.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-field__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-body);
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-field__badge {
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-dim);
  background-color: var(--color-surface-input);
  border: 1px solid var(--color-border);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  letter-spacing: 0.3px;
}

.profile-field__input {
  background-color: var(--color-surface-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 14px;
  color: var(--color-text-body);
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast);
  outline: none;
}

.profile-field__input:focus {
  border-color: var(--color-primary);
}

.profile-field__input::placeholder {
  color: var(--color-text-dim);
}

.profile-field__input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-field__input--readonly {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-field__textarea {
  resize: vertical;
  min-height: 80px;
}

/* ─── Theme toggle ─── */
.profile-theme-toggle {
  display: flex;
  gap: 8px;
}

.profile-theme-toggle__btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  background-color: var(--color-surface-input);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.profile-theme-toggle__btn--active {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.profile-theme-toggle__btn:hover:not(.profile-theme-toggle__btn--active) {
  border-color: var(--color-border-hover);
  color: var(--color-text-body);
}

/* ─── Buttons ─── */
.profile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
  margin-top: 4px;
}

.profile-btn--primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
}

.profile-btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.profile-btn--outline {
  background-color: transparent;
  color: var(--color-text-body);
  border: 1px solid var(--color-border);
}

.profile-btn--outline:hover:not(:disabled) {
  background-color: var(--color-surface-input);
  border-color: var(--color-border-hover);
}

.profile-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Spinner ─── */
.profile-btn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Feedback messages ─── */
.profile-feedback {
  font-size: 13px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-weight: 500;
}

.profile-feedback--success {
  background-color: var(--color-success-light);
  color: #5aad54;
  border: 1px solid #2D5A27;
}

.profile-feedback--error {
  background-color: var(--color-error-light);
  color: #e05c5c;
  border: 1px solid var(--color-error);
}

/* ─── Fade transitions ─── */
.fade-msg-enter-active,
.fade-msg-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
