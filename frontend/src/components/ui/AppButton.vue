<template>
  <button
    :class="['app-button', `app-button--${variant}`, { 'app-button--loading': loading, 'app-button--block': block }]"
    :disabled="disabled || loading"
    :type="type"
  >
    <span v-if="loading" class="app-button__spinner"></span>
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v),
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})
</script>

<style scoped>
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  transition: all var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.app-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app-button--block {
  width: 100%;
}

/* ─── Variants ─── */
.app-button--primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}
.app-button--primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.app-button--secondary {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
  border: 1px solid var(--color-border);
}
.app-button--secondary:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  background-color: var(--color-border);
}

.app-button--ghost {
  background: transparent;
  color: var(--color-text-body);
}
.app-button--ghost:hover:not(:disabled) {
  background-color: var(--color-surface-input);
}

.app-button--danger {
  background-color: var(--color-error);
  color: var(--color-text-on-primary);
}
.app-button--danger:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: var(--shadow-md);
}

/* ─── Loading Spinner ─── */
.app-button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
