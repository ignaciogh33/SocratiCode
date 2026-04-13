<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <AppInput
      id="register-username"
      v-model="username"
      label="Usuario"
      placeholder="tu_usuario"
      autocomplete="username"
      :error="fieldErrors.username"
    />
    <AppInput
      id="register-email"
      v-model="email"
      label="Email"
      type="email"
      placeholder="tu@email.com"
      autocomplete="email"
      :error="fieldErrors.email"
    />
    <AppInput
      id="register-password"
      v-model="password"
      label="Contraseña"
      type="password"
      placeholder="Mínimo 8 caracteres"
      autocomplete="new-password"
      :error="fieldErrors.password"
    />
    <AppInput
      id="register-confirm-password"
      v-model="rePassword"
      label="Confirmar contraseña"
      type="password"
      placeholder="Repite tu contraseña"
      autocomplete="new-password"
      :error="fieldErrors.re_password"
    />
    <AppButton type="submit" variant="primary" block :loading="isLoading">
      Crear cuenta
    </AppButton>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'

const emit = defineEmits(['submit'])
const props = defineProps({
  isLoading: { type: Boolean, default: false },
  fieldErrors: { type: Object, default: () => ({}) },
})

const username = ref('')
const email = ref('')
const password = ref('')
const rePassword = ref('')

function handleSubmit() {
  emit('submit', {
    username: username.value,
    email: email.value,
    password: password.value,
    re_password: rePassword.value,
  })
}
</script>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
