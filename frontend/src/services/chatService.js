import api from './api'

/**
 * Servicio de Chat — CRUD de sesiones + streaming SSE
 *
 * Todas las operaciones REST usan Axios (api).
 * El streaming SSE usa fetch() nativo porque Axios no soporta
 * ReadableStream en el navegador (necesita respuesta completa).
 */

export const chatService = {
  /**
   * Listar sesiones del usuario (paginadas a 15)
   * GET /chat/sessions/?page=N
   */
  async getSessions(page = 1) {
    const { data } = await api.get('/chat/sessions/', { params: { page } })
    return data // { count, next, previous, results: [...] }
  },

  /**
   * Crear sesión vacía
   * POST /chat/sessions/create/
   */
  async createSession() {
    const { data } = await api.post('/chat/sessions/create/')
    return data // { id, title, created_at, last_message }
  },

  /**
   * Obtener detalle de una sesión
   * GET /chat/sessions/:id/
   */
  async getSessionDetail(sessionId) {
    const { data } = await api.get(`/chat/sessions/${sessionId}/`)
    return data // { id, title, created_at }
  },

  /**
   * Eliminar sesión
   * DELETE /chat/sessions/:id/delete/
   */
  async deleteSession(sessionId) {
    await api.delete(`/chat/sessions/${sessionId}/delete/`)
  },

  /**
   * Renombrar sesión
   * PATCH /chat/sessions/:id/rename/
   */
  async renameSession(sessionId, title) {
    const { data } = await api.patch(`/chat/sessions/${sessionId}/rename/`, { title })
    return data
  },

  /**
   * Obtener mensajes de una sesión (paginados a 50, más recientes primero)
   * GET /chat/sessions/:id/messages/?page=N
   */
  async getMessages(sessionId, page = 1) {
    const { data } = await api.get(`/chat/sessions/${sessionId}/messages/`, {
      params: { page },
    })
    return data // { count, next, previous, results: [...] }
  },

  /**
   * Enviar mensaje y recibir respuesta en streaming SSE.
   * POST /chat/ — usa fetch() nativo + ReadableStream.
   *
   * @param {Object} payload - { session_id, prompt, code_context, last_output, language }
   * @param {Function} onToken - callback(token: string) llamado por cada token recibido
   * @param {Function} onModerated - callback(response: string) si la respuesta fue moderada
   * @param {Function} onDone - callback(sessionId: number) al finalizar el stream
   * @param {Function} onError - callback(error: string) en caso de error
   * @param {AbortSignal} signal - para cancelar el stream
   * @returns {Promise<void>}
   */
  async sendMessage(payload, { onToken, onModerated, onDone, onError, signal } = {}) {
    const token = localStorage.getItem('access_token')

    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        onError?.(errorData.error || `Error ${response.status}`)
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      let isDone = false;
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (!isDone) onDone?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Mantener la última línea incompleta en el buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6) // quitar "data: "

          // Señal de fin
          if (data === '[DONE]') {
            isDone = true
            onDone?.()
            return
          }

          try {
            const parsed = JSON.parse(data)

            if (parsed.error) {
              onError?.(parsed.error)
              return
            }

            // Token individual del streaming
            if (parsed.token !== undefined) {
              onToken?.(parsed.token)
            }

            // Respuesta moderada por el moderador de output
            if (parsed.moderated) {
              onModerated?.(parsed.response)
            }
            // Respuesta moderada de input (viene completa, sin flag moderated)
            else if (parsed.response !== undefined) {
              onToken?.(parsed.response)
            }

            // session_id al final del stream
            if (parsed.session_id !== undefined) {
              onDone?.(parsed.session_id)
            }
          } catch {
            // Línea no parseable, ignorar
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      onError?.(err.message || 'Error de conexión')
    }
  },
}
