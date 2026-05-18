<template>
  <div class="auth-page">
    <div class="auth-page__bg">
      <div class="auth-page__bg-orb auth-page__bg-orb--1"></div>
      <div class="auth-page__bg-orb auth-page__bg-orb--2"></div>
    </div>

    <div class="auth-page__container">
      <div class="auth-page__brand">
        <img
          src="../assets/images/logo-circular.svg"
          alt="SocratiCode"
          class="auth-page__logo"
        />
        <h1 class="auth-page__title">SocratiCode</h1>
      </div>

      <div class="auth-page__card">
        <h2 class="auth-page__heading">Nueva contraseña</h2>
        <p class="auth-page__description">
          Introduce tu nueva contraseña para restablecer el acceso a tu cuenta.
        </p>

        <div v-if="success" class="auth-page__success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            Tu contraseña ha sido restablecida correctamente.
            <router-link :to="{ name: 'Login' }" class="auth-page__link auth-page__link--inline">
              Iniciar sesión →
            </router-link>
          </div>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="auth-page__form">
          <div v-if="error" class="auth-page__error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <AppInput
            id="reset-password"
            v-model="newPassword"
            label="Nueva contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autocomplete="new-password"
            required
            :error="fieldErrors.new_password"
          />

          <AppInput
            id="reset-confirm-password"
            v-model="reNewPassword"
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite tu nueva contraseña"
            autocomplete="new-password"
            required
            :error="fieldErrors.re_new_password"
          />

          <AppButton type="submit" variant="primary" block :loading="isLoading">
            Restablecer contraseña
          </AppButton>
        </form>

        <div v-if="!success" class="auth-page__links">
          <router-link :to="{ name: 'Login' }" class="auth-page__link">
            ← Volver a Iniciar Sesión
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import AppInput from '../components/ui/AppInput.vue'
import AppButton from '../components/ui/AppButton.vue'

const route = useRoute()

const newPassword = ref('')
const reNewPassword = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref('')
const fieldErrors = reactive({})

async function handleSubmit() {
  if (!newPassword.value || !reNewPassword.value) return
  error.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  isLoading.value = true

  try {
    await api.post('/auth/users/reset_password_confirm/', {
      uid: route.params.uid,
      token: route.params.token,
      new_password: newPassword.value,
      re_new_password: reNewPassword.value,
    })
    success.value = true
  } catch (err) {
    const data = err.response?.data
    if (data?.error) {
      error.value = data.error
    } else if (data?.detail) {
      error.value = data.detail
    } else {
      error.value = 'El enlace ha expirado o no es válido. Solicita uno nuevo.'
    }

    // Errores por campo
    if (data?.details && typeof data.details === 'object') {
      Object.entries(data.details).forEach(([key, value]) => {
        fieldErrors[key] = Array.isArray(value) ? value[0] : value
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface-sidebar);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px 20px;
}

.auth-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.auth-page__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
}

.auth-page__bg-orb--1 {
  width: 500px;
  height: 500px;
  background: var(--color-primary);
  top: -150px;
  right: -100px;
  animation: float 15s ease-in-out infinite;
}

.auth-page__bg-orb--2 {
  width: 400px;
  height: 400px;
  background: var(--color-hint);
  bottom: -100px;
  left: -100px;
  animation: float 18s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

.auth-page__container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 420px;
}

.auth-page__brand {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.auth-page__logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
}

.auth-page__title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.5px;
}

.auth-page__card {
  width: 100%;
  background-color: var(--color-surface-chat);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: var(--shadow-lg);
}

.auth-page__heading {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-body);
}

.auth-page__description {
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-top: -8px;
}

.auth-page__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-page__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background-color: var(--color-error-light);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.4;
}

.auth-page__success {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background-color: rgba(76, 175, 80, 0.1);
  color: #66bb6a;
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.5;
}

.auth-page__success svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-page__links {
  display: flex;
  justify-content: center;
}

.auth-page__link {
  font-size: 13px;
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

.auth-page__link:hover {
  color: var(--color-primary-hover);
}

.auth-page__link--inline {
  display: inline;
  margin-left: 4px;
  font-weight: 500;
}
</style>
