<template>
  <div class="chat-input">
    <div class="chat-input__wrapper">
      <textarea
        ref="textareaRef"
        v-model="text"
        class="chat-input__textarea"
        :placeholder="chatStore.isStreaming ? 'Sócrates está pensando...' : 'Escribe tu duda...'"
        :disabled="chatStore.isStreaming"
        rows="1"
        @input="autoResize"
        @keydown="handleKeydown"
      ></textarea>
      <button
        v-if="chatStore.isStreaming"
        class="chat-input__stop"
        @click="chatStore.cancelStreaming()"
        title="Detener respuesta"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </button>
      <button
        v-else
        class="chat-input__send"
        :disabled="!text.trim()"
        @click="handleSend"
        title="Enviar (Ctrl+Enter)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <p class="chat-input__hint">
      <kbd>Ctrl</kbd>+<kbd>Enter</kbd> para enviar
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useEditorStore } from '../../stores/editor'

const chatStore = useChatStore()
const editorStore = useEditorStore()

const text = ref('')
const textareaRef = ref(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

function handleKeydown(e) {
  if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    handleSend()
  }
}

async function handleSend() {
  const prompt = text.value.trim()
  if (!prompt || chatStore.isStreaming) return

  text.value = ''
  nextTick(autoResize)

  await chatStore.sendMessage({
    prompt,
    codeContext: editorStore.editorVisible ? editorStore.sourceCode : '',
    lastOutput: editorStore.editorVisible ? (editorStore.stdout || editorStore.stderr) : '',
    language: editorStore.language,
  })

  // Mantener el foco en el textarea para seguir escribiendo
  nextTick(() => textareaRef.value?.focus())
}
</script>

<style scoped>
.chat-input {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface-chat);
}

.chat-input__wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background-color: var(--color-surface-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  transition: border-color var(--transition-fast);
}

.chat-input__wrapper:focus-within {
  border-color: var(--color-primary);
}

.chat-input__textarea {
  flex: 1;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-body);
  background: transparent;
  max-height: 200px;
  min-height: 24px;
  border: none;
  outline: none;
  align-self: center;
}

.chat-input__textarea:focus {
  outline: none;
  box-shadow: none;
}

.chat-input__textarea::placeholder {
  color: var(--color-text-dim);
}

.chat-input__textarea:disabled {
  opacity: 0.5;
}

.chat-input__send,
.chat-input__stop {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.chat-input__send {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.chat-input__send:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.chat-input__send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.chat-input__stop {
  background-color: var(--color-error);
  color: var(--color-text-on-primary);
}

.chat-input__stop:hover {
  opacity: 0.8;
}

.chat-input__hint {
  text-align: right;
  font-size: 11px;
  color: var(--color-text-dim);
  margin-top: 6px;
}

.chat-input__hint kbd {
  background-color: var(--color-surface-input);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 10px;
  border: 1px solid var(--color-border);
}
</style>
