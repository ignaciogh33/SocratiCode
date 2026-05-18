<template>
  <div class="terminal">
    <div class="terminal__header">
      <span class="terminal__title">Terminal</span>
      <div class="terminal__header-actions">
        <span v-if="editorStore.exitCode !== null" :class="['terminal__exit-code', editorStore.isSuccess ? 'terminal__exit-code--success' : 'terminal__exit-code--error']">
          exit: {{ editorStore.exitCode }}
        </span>
        <button class="terminal__clear" @click="editorStore.clearTerminal()" title="Limpiar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
        <button class="terminal__close" @click="editorStore.toggleTerminal()" title="Cerrar terminal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="terminal__output">
      <div v-if="editorStore.isExecuting" class="terminal__loading">
        <span class="terminal__spinner"></span>
        Ejecutando...
      </div>

      <pre v-if="editorStore.stdout" class="terminal__stdout">{{ editorStore.stdout }}</pre>

      <pre v-if="editorStore.stderr" class="terminal__stderr">{{ editorStore.stderr }}</pre>

      <p v-if="!editorStore.isExecuting && !editorStore.stdout && !editorStore.stderr" class="terminal__empty">
        Pulsa <strong>EJECUTAR</strong> para ver la salida aquí
      </p>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../../stores/editor'
const editorStore = useEditorStore()
</script>

<style scoped>
.terminal {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface-editor);
  display: flex;
  flex-direction: column;
  max-height: 40%;
  min-height: 100px;
}

.terminal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background-color: var(--color-surface-sidebar);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.terminal__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
}

.terminal__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal__exit-code {
  font-size: 11px;
  font-family: var(--font-mono);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.terminal__exit-code--success {
  color: var(--color-success);
  background-color: var(--color-success-light);
}

.terminal__exit-code--error {
  color: var(--color-error);
  background-color: var(--color-error-light);
}

.terminal__clear,
.terminal__close {
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.terminal__clear:hover,
.terminal__close:hover {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
}

.terminal__output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}

.terminal__stdout {
  color: var(--color-text-body);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.terminal__stderr {
  color: var(--color-error);
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.terminal__empty {
  color: var(--color-text-dim);
  font-family: var(--font-sans);
  font-size: 13px;
}

.terminal__loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  font-family: var(--font-sans);
  font-size: 13px;
}

.terminal__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
