<template>
  <div class="app-input" :class="{ 'app-input--error': error, 'app-input--focused': isFocused }">
    <label v-if="label" :for="id" class="app-input__label">{{ label }}</label>
    <div class="app-input__wrapper">
      <input
        :id="id"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :required="required"
        class="app-input__field"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>
    <p v-if="error" class="app-input__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  id: { type: String, required: true },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
  required: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const isFocused = ref(false)
</script>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-input__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
}

.app-input__wrapper {
  position: relative;
}

.app-input__field {
  width: 100%;
  padding: 12px 16px;
  background-color: var(--color-surface-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-body);
  font-size: 15px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.app-input__field::placeholder {
  color: var(--color-text-dim);
}

.app-input--focused .app-input__field {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.app-input--error .app-input__field {
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px var(--color-error-light);
}

.app-input__error {
  font-size: 12px;
  color: var(--color-error);
  margin: 0;
}
</style>
