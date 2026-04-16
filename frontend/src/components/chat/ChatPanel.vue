<template>
  <div class="chat-panel">
    <!-- Empty state: no session selected -->
    <div v-if="!chatStore.activeSessionId" class="chat-panel__empty">
      <img src="../../assets/images/logo-circular.svg" alt="SocratiCode" class="chat-panel__empty-logo" />
      <h2 class="chat-panel__empty-title">¡Bienvenido a SocratiCode!</h2>
      <p class="chat-panel__empty-text">Selecciona una conversación o crea una nueva para empezar a aprender.</p>
      <AppButton variant="primary" @click="chatStore.createSession()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Nueva conversación
      </AppButton>
    </div>

    <!-- Active session -->
    <template v-else>
      <!-- "New" active session state (0 messages) -->
      <div v-if="chatStore.messages.length === 0" class="chat-panel__active-empty">
        <div class="chat-panel__greeting">
          <img src="../../assets/images/logo-circular.svg" alt="SocratiCode" class="chat-panel__greeting-logo" />
          <h1 class="chat-panel__greeting-text">{{ currentGreeting }}</h1>
        </div>
        <div class="chat-panel__input-centered">
          <ChatInput />
        </div>
      </div>
      
      <!-- Normal chat layout -->
      <template v-else>
        <MessageList />
        <ChatInput />
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import AppButton from '../ui/AppButton.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()

const getGreeting = () => {
  const name = authStore.user?.username || 'Ignacio' // fallback
  const hour = new Date().getHours()
  let timeStr = ''
  if (hour < 12) timeStr = 'Buenos días'
  else if (hour < 20) timeStr = 'Buenas tardes'
  else timeStr = 'Buenas noches'

  const variations = [
    `${timeStr}, ${name}`,
    `¡Hola ${name}! ¿Qué vamos a programar hoy?`,
    `¿En qué te puedo ayudar hoy, ${name}?`,
    `¡Qué bueno verte, ${name}! ¿Listo para continuar?`,
    `¿Qué dudas tienes sobre código hoy, ${name}?`
  ]
  return variations[Math.floor(Math.random() * variations.length)]
}

const currentGreeting = ref(getGreeting())

watch(() => chatStore.activeSessionId, () => {
  if (chatStore.messages.length === 0) {
    currentGreeting.value = getGreeting()
  }
})
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ─── Empty state ─── */
.chat-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.chat-panel__empty-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  opacity: 0.6;
}

.chat-panel__empty-title {
  font-size: 20px;
  color: var(--color-text-body);
  font-weight: 600;
}

.chat-panel__empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
  max-width: 300px;
}

/* ─── Active Empty State (Greeting) ─── */
.chat-panel__active-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: var(--color-surface-chat);
}

.chat-panel__greeting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 24px;
  margin-bottom: 40px;
}

.chat-panel__greeting-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.chat-panel__greeting-text {
  font-size: 32px;
  font-weight: 500;
  color: var(--color-text-body);
  letter-spacing: -0.5px;
}

.chat-panel__input-centered {
  width: 100%;
  max-width: 800px;
}

.chat-panel__input-centered :deep(.chat-input) {
  border-top: none;
  background-color: transparent;
  padding: 0;
}
</style>
