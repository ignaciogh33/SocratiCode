<template>
  <div class="code-editor">
    <!-- Header -->
    <div class="code-editor__header">
      <LanguageSelector />
      <button
        class="code-editor__run"
        :disabled="editorStore.isExecuting"
        @click="editorStore.executeCode()"
      >
        <template v-if="editorStore.isExecuting">
          <span class="code-editor__spinner"></span>
          Ejecutando...
        </template>
        <template v-else>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          EJECUTAR
        </template>
      </button>
    </div>

    <!-- Monaco Editor -->
    <div class="code-editor__container" ref="editorContainer"></div>

    <!-- Terminal Output -->
    <TerminalOutput v-if="editorStore.terminalVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore } from '../../stores/editor'
import LanguageSelector from './LanguageSelector.vue'
import TerminalOutput from './TerminalOutput.vue'

const editorStore = useEditorStore()
const editorContainer = ref(null)
let monacoEditor = null

onMounted(async () => {
  // Lazy load Monaco
  const loader = await import('@monaco-editor/loader')
  const monaco = await loader.default.init()

  if (!editorContainer.value) return

  monacoEditor = monaco.editor.create(editorContainer.value, {
    value: editorStore.sourceCode,
    language: editorStore.currentLanguage.monacoId,
    theme: 'vs-dark',
    fontFamily: "'Fira Code', 'Source Code Pro', monospace",
    fontLigatures: true,
    fontSize: 14,
    lineHeight: 22,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12 },
    renderLineHighlight: 'line',
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'on',
  })

  // Sync editor → store
  monacoEditor.onDidChangeModelContent(() => {
    editorStore.setSourceCode(monacoEditor.getValue())
  })

  // Ctrl+Enter → Execute
  monacoEditor.addAction({
    id: 'execute-code',
    label: 'Ejecutar Código',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: () => editorStore.executeCode(),
  })
})

// Watch language changes to update Monaco
watch(
  () => editorStore.language,
  (newLang) => {
    if (!monacoEditor) return
    const loader = import('@monaco-editor/loader')
    loader.then(async (mod) => {
      const monaco = await mod.default.init()
      const model = monacoEditor.getModel()
      if (model) {
        const langConfig = editorStore.currentLanguage
        monaco.editor.setModelLanguage(model, langConfig.monacoId)
      }
    })
  }
)

// Watch store code changes (e.g., language switch default code)
watch(
  () => editorStore.sourceCode,
  (newCode) => {
    if (monacoEditor && monacoEditor.getValue() !== newCode) {
      monacoEditor.setValue(newCode)
    }
  }
)

onUnmounted(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
})
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ─── Header ─── */
.code-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--color-surface-sidebar);
  border-bottom: 1px solid var(--color-border);
  gap: 12px;
  flex-shrink: 0;
}

.code-editor__run {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.code-editor__run:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-sm);
}

.code-editor__run:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.code-editor__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Editor Container ─── */
.code-editor__container {
  flex: 1;
  min-height: 0;
}
</style>
