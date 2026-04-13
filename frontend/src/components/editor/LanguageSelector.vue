<template>
  <div class="lang-selector">
    <select
      :value="editorStore.language"
      @change="editorStore.setLanguage($event.target.value)"
      class="lang-selector__select"
    >
      <option
        v-for="lang in SUPPORTED_LANGUAGES"
        :key="lang.id"
        :value="lang.id"
      >
        {{ lang.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { useEditorStore, SUPPORTED_LANGUAGES } from '../../stores/editor'
const editorStore = useEditorStore()
</script>

<style scoped>
.lang-selector__select {
  padding: 5px 10px;
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: border-color var(--transition-fast);
  appearance: auto;
}

.lang-selector__select:hover {
  border-color: var(--color-border-hover);
}

.lang-selector__select:focus {
  border-color: var(--color-primary);
  outline: none;
}

.lang-selector__select option {
  background-color: var(--color-surface-chat);
  color: var(--color-text-body);
}
</style>
