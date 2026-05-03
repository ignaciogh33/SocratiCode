import { defineStore } from 'pinia'
import { compilerService } from '../services/compilerService'

/**
 * Store del editor de código — Estado del editor, terminal y ejecución.
 */

// Lenguajes soportados por Piston
export const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python', version: '3.10.0', monacoId: 'python' },
  { id: 'c', label: 'C', version: '10.2.0', monacoId: 'c' },
  { id: 'java', label: 'Java', version: '15.0.2', monacoId: 'java' },
]

const DEFAULT_CODE = {
  python: '# Escribe tu código Python aquí\nprint("¡Hola, SocratiCode!")\n',
  c: '// Escribe tu código C aquí\n#include <stdio.h>\n\nint main() {\n    printf("¡Hola, SocratiCode!\\n");\n    return 0;\n}\n',
  java: '// Escribe tu código Java aquí\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("¡Hola, SocratiCode!");\n    }\n}\n',
}

export const useEditorStore = defineStore('editor', {
  state: () => ({
    sourceCode: DEFAULT_CODE.python,
    language: 'python',
    version: '3.10.0',

    // Terminal output
    stdout: '',
    stderr: '',
    exitCode: null,

    // UI state
    isExecuting: false,
    terminalVisible: false,
    editorVisible: true,
  }),

  getters: {
    currentLanguage: (state) =>
      SUPPORTED_LANGUAGES.find((l) => l.id === state.language) || SUPPORTED_LANGUAGES[0],

    hasOutput: (state) => !!(state.stdout || state.stderr),

    isSuccess: (state) => state.exitCode === 0,
    isError: (state) => state.exitCode !== null && state.exitCode !== 0,
  },

  actions: {
    setLanguage(languageId) {
      const lang = SUPPORTED_LANGUAGES.find((l) => l.id === languageId)
      if (!lang) return
      this.language = lang.id
      this.version = lang.version
      // Poner código por defecto del nuevo lenguaje solo si el editor está vacío o tiene el default anterior
      const currentDefaults = Object.values(DEFAULT_CODE)
      if (!this.sourceCode.trim() || currentDefaults.includes(this.sourceCode)) {
        this.sourceCode = DEFAULT_CODE[lang.id] || ''
      }
    },

    setSourceCode(code) {
      this.sourceCode = code
    },

    async executeCode() {
      if (this.isExecuting || !this.sourceCode.trim()) return

      this.isExecuting = true
      this.terminalVisible = true
      this.stdout = ''
      this.stderr = ''
      this.exitCode = null

      try {
        const result = await compilerService.executeCode(
          this.sourceCode,
          this.language,
          this.version
        )
        this.stdout = result.stdout
        this.stderr = result.stderr
        this.exitCode = result.exit_code
      } catch (err) {
        const data = err.response?.data
        this.stderr = data?.error || 'Error al ejecutar el código'
        this.exitCode = -1
      } finally {
        this.isExecuting = false
      }
    },

    toggleTerminal() {
      this.terminalVisible = !this.terminalVisible
    },

    toggleEditor() {
      this.editorVisible = !this.editorVisible
    },

    clearTerminal() {
      this.stdout = ''
      this.stderr = ''
      this.exitCode = null
    },
  },
})
