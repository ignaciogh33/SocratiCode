<template>
  <div class="chat-panel">
    <!-- Empty state: no session selected -->
    <div v-if="!chatStore.activeSessionId" class="chat-panel__empty">
      <img src="../../assets/images/logo-circular.png" alt="SocratiCode" class="chat-panel__empty-logo" />
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
      <MessageList />
      <ChatInput />
    </template>
  </div>
</template>

<script setup>
import { useChatStore } from '../../stores/chat'
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'
import AppButton from '../ui/AppButton.vue'

const chatStore = useChatStore()
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
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
</style>
