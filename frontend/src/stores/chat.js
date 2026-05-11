import { defineStore } from 'pinia'
import { chatService } from '../services/chatService'

/**
 * Store del chat — Sesiones, mensajes y streaming SSE.
 */
export const useChatStore = defineStore('chat', {
  state: () => ({
    // Sesiones
    sessions: [],
    sessionsCount: 0,
    sessionsNextPage: null,
    isLoadingSessions: false,

    // Sesión activa
    activeSessionId: null,

    // Mensajes de la sesión activa
    messages: [],
    messagesCount: 0,
    messagesNextPage: null,
    isLoadingMessages: false,

    // Streaming
    isStreaming: false,
    streamBuffer: '',
    abortController: null,
  }),

  getters: {
    activeSession: (state) =>
      state.sessions.find((s) => s.id === state.activeSessionId) || null,

    /**
     * Mensajes ordenados cronológicamente (la API devuelve más recientes primero).
     */
    sortedMessages: (state) =>
      [...state.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),

    sortedSessions: (state) =>
      [...state.sessions].sort(
        (a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      ),
  },

  actions: {
    // ─── SESIONES ───

    async fetchSessions(page = 1) {
      this.isLoadingSessions = true
      try {
        const data = await chatService.getSessions(page)
        if (page === 1) {
          this.sessions = data.results
        } else {
          // Append para infinite scroll, evitando duplicados
          const existingIds = new Set(this.sessions.map((s) => s.id))
          const newSessions = data.results.filter((s) => !existingIds.has(s.id))
          this.sessions.push(...newSessions)
        }
        this.sessionsCount = data.count
        this.sessionsNextPage = data.next ? page + 1 : null
      } finally {
        this.isLoadingSessions = false
      }
    },

    async createSession() {
      const session = await chatService.createSession()
      this.sessions.unshift(session)
      this.activeSessionId = session.id
      this.messages = []
      return session
    },

    async deleteSession(sessionId) {
      await chatService.deleteSession(sessionId)
      this.sessions = this.sessions.filter((s) => s.id !== sessionId)
      if (this.activeSessionId === sessionId) {
        // Volver al empty state (pantalla de bienvenida con botón "Nueva conversación")
        this.activeSessionId = null
        this.messages = []
      }
    },

    async renameSession(sessionId, title) {
      const updated = await chatService.renameSession(sessionId, title)
      const idx = this.sessions.findIndex((s) => s.id === sessionId)
      if (idx !== -1) this.sessions[idx] = { ...this.sessions[idx], ...updated }
    },

    setActiveSession(sessionId) {
      if (this.activeSessionId === sessionId) return
      this.activeSessionId = sessionId
      this.messages = []
      this.messagesNextPage = null
      this.fetchMessages(sessionId)
    },

    // ─── MENSAJES ───

    async fetchMessages(sessionId, page = 1) {
      if (sessionId !== this.activeSessionId) return
      this.isLoadingMessages = true
      try {
        const data = await chatService.getMessages(sessionId, page)
        if (page === 1) {
          this.messages = data.results
        } else {
          const existingIds = new Set(this.messages.map((m) => m.id))
          const newMsgs = data.results.filter((m) => !existingIds.has(m.id))
          this.messages.push(...newMsgs)
        }
        this.messagesCount = data.count
        this.messagesNextPage = data.next ? page + 1 : null
      } finally {
        this.isLoadingMessages = false
      }
    },

    // ─── STREAMING SSE ───

    /**
     * Envía un mensaje y procesa la respuesta en streaming.
     * Los tokens se acumulan en streamBuffer para el efecto máquina de escribir.
     */
    async sendMessage({ prompt, codeContext = '', lastOutput = '', language = 'python' }) {
      // Crear sesión si no hay una activa
      if (!this.activeSessionId) {
        await this.createSession()
      }

      // Añadir mensaje del usuario localmente (optimistic update)
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
        moderated: false,
      }
      this.messages.push(userMessage)

      // Iniciar streaming
      this.isStreaming = true
      this.streamBuffer = ''
      this.abortController = new AbortController()

      // Placeholder para la respuesta del asistente
      const assistantMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        moderated: false,
        _isStreaming: true,
      }
      this.messages.push(assistantMessage)

      const payload = {
        session_id: this.activeSessionId,
        prompt,
        code_context: codeContext,
        last_output: lastOutput,
        language,
      }

      await chatService.sendMessage(payload, {
        signal: this.abortController.signal,

        onToken: (token) => {
          this.streamBuffer += token
          // Actualizar el mensaje del asistente en tiempo real
          const msg = this.messages.find((m) => m.id === assistantMessage.id)
          if (msg) msg.content = this.streamBuffer
        },

        onModerated: (response) => {
          // Reemplazar TODO el contenido acumulado con el mensaje de moderación
          this.streamBuffer = response
          const msg = this.messages.find((m) => m.id === assistantMessage.id)
          if (msg) {
            msg.content = response
            msg.moderated = true
          }
        },

        onDone: (sessionId, sessionTitle) => {
          // Actualizar session_id si la sesión fue creada por el backend
          if (sessionId && sessionId !== this.activeSessionId) {
            this.activeSessionId = sessionId
            // Actualizar la sesión en la lista
            const session = this.sessions.find((s) => s.id === sessionId)
            if (!session) {
              this.fetchSessions()
            }
          }

          // Actualizar título y timestamp de la sesión activa
          const activeSession = this.sessions.find((s) => s.id === this.activeSessionId)
          if (activeSession) {
            if (sessionTitle) activeSession.title = sessionTitle
            activeSession.updated_at = new Date().toISOString()
          }

          // Marcar como finalizado
          const msg = this.messages.find((m) => m.id === assistantMessage.id)
          if (msg) {
            msg._isStreaming = false
          }
          this.isStreaming = false
          this.abortController = null
        },

        onError: (error) => {
          const msg = this.messages.find((m) => m.id === assistantMessage.id)
          if (msg) {
            msg.content = this.streamBuffer || `⚠️ ${error}`
            msg._isStreaming = false
          }
          this.isStreaming = false
          this.abortController = null
        },
      })
    },

    /**
     * Abortar el streaming actual.
     */
    cancelStreaming() {
      if (this.abortController) {
        this.abortController.abort()
        this.isStreaming = false
        this.abortController = null
        
        // Finalizar el cursor de streaming en el mensaje actual
        const lastMsg = this.messages[this.messages.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg._isStreaming) {
          lastMsg._isStreaming = false
        }
      }
    },
  },
})
