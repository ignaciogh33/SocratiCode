import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../services/compilerService', () => ({
  compilerService: {
    executeCode: vi.fn(),
  },
}))

import { useEditorStore, SUPPORTED_LANGUAGES } from '../../stores/editor'
import { compilerService } from '../../services/compilerService'

const DEFAULT_PYTHON = '# Escribe tu código Python aquí\nprint("¡Hola, SocratiCode!")\n'
const DEFAULT_C = '// Escribe tu código C aquí\n#include <stdio.h>\n\nint main() {\n    printf("¡Hola, SocratiCode!\\n");\n    return 0;\n}\n'
const DEFAULT_JAVA = '// Escribe tu código Java aquí\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("¡Hola, SocratiCode!");\n    }\n}\n'

describe('useEditorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ─── Initial state ───

  it('initializes with python language', () => {
    const store = useEditorStore()
    expect(store.language).toBe('python')
    expect(store.version).toBe('3.10.0')
  })

  it('initializes with default python source code', () => {
    const store = useEditorStore()
    expect(store.sourceCode).toBe(DEFAULT_PYTHON)
  })

  it('initializes with empty output state', () => {
    const store = useEditorStore()
    expect(store.stdout).toBe('')
    expect(store.stderr).toBe('')
    expect(store.exitCode).toBeNull()
    expect(store.isExecuting).toBe(false)
    expect(store.terminalVisible).toBe(false)
    expect(store.editorVisible).toBe(true)
  })

  // ─── setLanguage ───

  it('setLanguage changes language and version', () => {
    const store = useEditorStore()
    store.setLanguage('c')
    expect(store.language).toBe('c')
    expect(store.version).toBe('10.2.0')
  })

  it('setLanguage replaces default code when code is a known default', () => {
    const store = useEditorStore()
    // initial code is DEFAULT_PYTHON
    store.setLanguage('java')
    expect(store.sourceCode).toBe(DEFAULT_JAVA)
  })

  it('setLanguage replaces code when editor is blank', () => {
    const store = useEditorStore()
    store.sourceCode = '   '
    store.setLanguage('c')
    expect(store.sourceCode).toBe(DEFAULT_C)
  })

  it('setLanguage preserves custom code that is not a known default', () => {
    const store = useEditorStore()
    store.sourceCode = 'my custom code'
    store.setLanguage('java')
    expect(store.sourceCode).toBe('my custom code')
  })

  it('setLanguage ignores unknown language id', () => {
    const store = useEditorStore()
    store.setLanguage('ruby')
    expect(store.language).toBe('python')
  })

  // ─── setSourceCode ───

  it('setSourceCode updates sourceCode', () => {
    const store = useEditorStore()
    store.setSourceCode('x = 42')
    expect(store.sourceCode).toBe('x = 42')
  })

  // ─── executeCode ───

  it('executeCode is a no-op when sourceCode is blank', async () => {
    const store = useEditorStore()
    store.sourceCode = '   '
    await store.executeCode()
    expect(compilerService.executeCode).not.toHaveBeenCalled()
  })

  it('executeCode is a no-op when already executing', async () => {
    const store = useEditorStore()
    store.isExecuting = true
    store.sourceCode = 'print(1)'
    await store.executeCode()
    expect(compilerService.executeCode).not.toHaveBeenCalled()
  })

  it('executeCode happy path updates stdout and exitCode', async () => {
    const store = useEditorStore()
    store.sourceCode = 'print(1)'
    compilerService.executeCode.mockResolvedValue({
      stdout: 'hello\n',
      stderr: '',
      exit_code: 0,
    })
    await store.executeCode()
    expect(store.stdout).toBe('hello\n')
    expect(store.stderr).toBe('')
    expect(store.exitCode).toBe(0)
    expect(store.isExecuting).toBe(false)
    expect(store.terminalVisible).toBe(true)
  })

  it('executeCode calls compilerService with correct args', async () => {
    const store = useEditorStore()
    store.sourceCode = 'print(1)'
    store.language = 'python'
    store.version = '3.10.0'
    compilerService.executeCode.mockResolvedValue({ stdout: '', stderr: '', exit_code: 0 })
    await store.executeCode()
    expect(compilerService.executeCode).toHaveBeenCalledWith('print(1)', 'python', '3.10.0')
  })

  it('executeCode error path sets stderr and exitCode -1', async () => {
    const store = useEditorStore()
    store.sourceCode = 'bad code'
    compilerService.executeCode.mockRejectedValue({
      response: { data: { error: 'Timeout' } },
    })
    await store.executeCode()
    expect(store.stderr).toBe('Timeout')
    expect(store.exitCode).toBe(-1)
    expect(store.isExecuting).toBe(false)
  })

  it('executeCode error path uses fallback message when no error field', async () => {
    const store = useEditorStore()
    store.sourceCode = 'x'
    compilerService.executeCode.mockRejectedValue(new Error('network'))
    await store.executeCode()
    expect(store.stderr).toBe('Error al ejecutar el código')
    expect(store.exitCode).toBe(-1)
  })

  // ─── toggleTerminal / toggleEditor / clearTerminal ───

  it('toggleTerminal flips terminalVisible', () => {
    const store = useEditorStore()
    store.toggleTerminal()
    expect(store.terminalVisible).toBe(true)
    store.toggleTerminal()
    expect(store.terminalVisible).toBe(false)
  })

  it('toggleEditor flips editorVisible', () => {
    const store = useEditorStore()
    store.toggleEditor()
    expect(store.editorVisible).toBe(false)
    store.toggleEditor()
    expect(store.editorVisible).toBe(true)
  })

  it('clearTerminal resets output state', () => {
    const store = useEditorStore()
    store.stdout = 'out'
    store.stderr = 'err'
    store.exitCode = 1
    store.clearTerminal()
    expect(store.stdout).toBe('')
    expect(store.stderr).toBe('')
    expect(store.exitCode).toBeNull()
  })

  // ─── Getters ───

  it('currentLanguage returns the language config object', () => {
    const store = useEditorStore()
    expect(store.currentLanguage).toEqual(SUPPORTED_LANGUAGES[0])
    store.setLanguage('c')
    expect(store.currentLanguage.id).toBe('c')
  })

  it('hasOutput is true when stdout is set', () => {
    const store = useEditorStore()
    store.stdout = 'something'
    expect(store.hasOutput).toBe(true)
  })

  it('hasOutput is true when stderr is set', () => {
    const store = useEditorStore()
    store.stderr = 'error'
    expect(store.hasOutput).toBe(true)
  })

  it('hasOutput is false when both are empty', () => {
    const store = useEditorStore()
    expect(store.hasOutput).toBe(false)
  })

  it('isSuccess is true when exitCode === 0', () => {
    const store = useEditorStore()
    store.exitCode = 0
    expect(store.isSuccess).toBe(true)
    expect(store.isError).toBe(false)
  })

  it('isError is true when exitCode is non-zero', () => {
    const store = useEditorStore()
    store.exitCode = 1
    expect(store.isError).toBe(true)
    expect(store.isSuccess).toBe(false)
  })

  it('isSuccess and isError are false when exitCode is null', () => {
    const store = useEditorStore()
    expect(store.isSuccess).toBe(false)
    expect(store.isError).toBe(false)
  })
})
