import api from './api'

/**
 * Servicio del compilador — Ejecuta código via Piston.
 */

export const compilerService = {
  /**
   * Ejecutar código fuente
   * POST /compiler/execute/
   *
   * @param {string} sourceCode - Código a ejecutar
   * @param {string} language - Lenguaje (python, c, javascript)
   * @param {string} version - Versión del runtime (ej: 3.10.0)
   * @returns {{ stdout, stderr, exit_code, language }}
   */
  async executeCode(sourceCode, language = 'python', version = '3.10.0') {
    const { data } = await api.post('/compiler/execute/', {
      source_code: sourceCode,
      language,
      version,
    })
    return data
  },
}
