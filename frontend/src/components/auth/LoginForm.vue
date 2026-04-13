<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <AppInput
      id="login-username"
      v-model="username"
      label="Usuario"
      placeholder="tu_usuario"
      autocomplete="username"
      :error="fieldErrors.username"
    />
    <AppInput
      id="login-password"
      v-model="password"
      label="Contraseña"
      type="password"
      placeholder="••••••••"
      autocomplete="current-password"
      :error="fieldErrors.password"
    />
    <AppButton type="submit" variant="primary" block :loading="isLoading">
      Iniciar Sesión
    </AppButton>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import AppInput from '../ui/AppInput.vue'
import AppButton from '../ui/AppButton.vue'

const emit = defineEmits(['submit'])
const props = defineProps({
  isLoading: { type: Boolean, default: false },
  fieldErrors: { type: Object, default: () => ({}) },
})

const username = ref('')
const password = ref('')

function handleSubmit() {
  emit('submit', {
    username: username.value,
    password: password.value,
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
