<template>
  <div class="login-view">
    <!-- Fondo decorativo -->
    <div class="login-view__bg">
      <div class="login-view__bg-orb login-view__bg-orb--1"></div>
      <div class="login-view__bg-orb login-view__bg-orb--2"></div>
    </div>

    <div class="login-view__container">
      <!-- Logo -->
      <div class="login-view__brand">
        <img
          src="../assets/images/logo-circular.svg"
          alt="SocratiCode"
          class="login-view__logo"
        />
        <h1 class="login-view__title">SocratiCode</h1>
        <p class="login-view__slogan">Tu código. Tus pistas. Tu aprendizaje.</p>
      </div>

      <!-- Card principal -->
      <div class="login-view__card">
        <!-- Tabs -->
        <div class="login-view__tabs">
          <button
            :class="['login-view__tab', { 'login-view__tab--active': activeTab === 'login' }]"
            @click="switchTab('login')"
          >
            Iniciar Sesión
          </button>
          <button
            :class="['login-view__tab', { 'login-view__tab--active': activeTab === 'register' }]"
            @click="switchTab('register')"
          >
            Crear Cuenta
          </button>
        </div>

        <!-- Error global -->
        <div v-if="error" class="login-view__error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <!-- Formularios -->
        <LoginForm
          v-if="activeTab === 'login'"
          :is-loading="auth.isLoading"
          :field-errors="fieldErrors"
          @submit="handleLogin"
        />
        <RegisterForm
          v-else
          :is-loading="auth.isLoading"
          :field-errors="fieldErrors"
          @submit="handleRegister"
        />

        <!-- Links -->
        <div class="login-view__links">
          <template v-if="activeTab === 'login'">
            <a href="#" class="login-view__link">¿Olvidaste tu contraseña?</a>
            <a href="#" class="login-view__link" @click.prevent="switchTab('register')">
              Crear una cuenta
            </a>
          </template>
          <template v-else>
            <a href="#" class="login-view__link" @click.prevent="switchTab('login')">
              Ya tengo una cuenta
            </a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('login')
const error = ref('')
const fieldErrors = reactive({})

function switchTab(tab) {
  activeTab.value = tab
  error.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

function parseErrors(err) {
  const data = err.response?.data
  if (!data) {
    error.value = 'Error de conexión con el servidor'
    return
  }

  // Formato estandarizado del backend: { error, details }
  if (data.error) {
    error.value = data.error
  } else if (data.detail) {
    error.value = data.detail
  }

  // Errores por campo (Djoser validation)
  if (data.details && typeof data.details === 'object') {
    Object.entries(data.details).forEach(([key, value]) => {
      fieldErrors[key] = Array.isArray(value) ? value[0] : value
    })
  }
  // Djoser a veces devuelve errores directos por campo (sin wrapper)
  if (!data.error && !data.detail) {
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        fieldErrors[key] = value[0]
      }
    })
    if (!error.value && Object.keys(fieldErrors).length > 0) {
      error.value = 'Por favor, corrige los errores marcados.'
    }
  }
}

async function handleLogin({ username, password }) {
  error.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  try {
    await auth.login(username, password)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    parseErrors(err)
  }
}

async function handleRegister(data) {
  error.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
  try {
    await auth.register(data)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    parseErrors(err)
  }
}
</script>

<style scoped>
.login-view {
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

/* ─── Background orbs ─── */
.login-view__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.login-view__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.15;
}

.login-view__bg-orb--1 {
  width: 500px;
  height: 500px;
  background: var(--color-primary);
  top: -150px;
  right: -100px;
  animation: float 15s ease-in-out infinite;
}

.login-view__bg-orb--2 {
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

/* ─── Container ─── */
.login-view__container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 420px;
}

/* ─── Brand ─── */
.login-view__brand {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.login-view__logo {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.login-view__title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.5px;
}

.login-view__slogan {
  font-size: 15px;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ─── Card ─── */
.login-view__card {
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

/* ─── Tabs ─── */
.login-view__tabs {
  display: flex;
  background-color: var(--color-surface-input);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 3px;
}

.login-view__tab {
  flex: 1;
  padding: 10px;
  border-radius: calc(var(--radius-md) - 2px);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  text-align: center;
}

.login-view__tab:hover {
  color: var(--color-text-body);
}

.login-view__tab--active {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

/* ─── Error ─── */
.login-view__error {
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

/* ─── Links ─── */
.login-view__links {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.login-view__link {
  font-size: 13px;
  color: var(--color-primary);
  transition: color var(--transition-fast);
}

.login-view__link:hover {
  color: var(--color-primary-hover);
}
</style>
