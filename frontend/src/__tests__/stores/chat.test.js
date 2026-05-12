import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../services/chatService', () => ({
  chatService: {
    getSessions: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    renameSession: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}))

import { useChatStore } from '../../stores/chat'
import { chatService } from '../../services/chatService'

const mockSession = (id, extra = {}) => ({
  id,
  title: `Sesión ${id}`,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  ...extra,
})

const mockMessage = (id, role = 'user') => ({
  id,
  role,
  content: `Mensaje ${id}`,
  created_at: '2024-01-01T10:00:00Z',
  moderated: false,
})

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ─── Getters ───

  it('activeSession returns null when no active session', () => {
    const store = useChatStore()
    expect(store.activeSession).toBeNull()
  })

  it('activeSession returns matching session', () => {
    const store = useChatStore()
    store.sessions = [mockSession(1), mockSession(2)]
    store.activeSessionId = 2
    expect(store.activeSession.id).toBe(2)
  })

  it('sortedMessages orders chronologically (oldest first)', () => {
    const store = useChatStore()
    store.messages = [
      { id: 2, created_at: '2024-01-01T12:00:00Z' },
      { id: 1, created_at: '2024-01-01T10:00:00Z' },
    ]
    expect(store.sortedMessages[0].id).toBe(1)
    expect(store.sortedMessages[1].id).toBe(2)
  })

  it('sortedSessions orders by updated_at descending', () => {
    const store = useChatStore()
    store.sessions = [
      { id: 1, updated_at: '2024-01-01T10:00:00Z' },
      { id: 2, updated_at: '2024-01-02T10:00:00Z' },
    ]
    expect(store.sortedSessions[0].id).toBe(2)
  })

  // ─── fetchSessions ───

  it('fetchSessions page=1 replaces sessions', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(99)]
    chatService.getSessions.mockResolvedValue({
      results: [mockSession(1), mockSession(2)],
      count: 2,
      next: null,
    })

    await store.fetchSessions(1)

    expect(store.sessions).toHaveLength(2)
    expect(store.sessions[0].id).toBe(1)
    expect(store.sessionsNextPage).toBeNull()
    expect(store.sessionsCount).toBe(2)
  })

  it('fetchSessions page=2 appends new sessions', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1)]
    chatService.getSessions.mockResolvedValue({
      results: [mockSession(2), mockSession(3)],
      count: 3,
      next: 'url',
    })

    await store.fetchSessions(2)

    expect(store.sessions).toHaveLength(3)
    expect(store.sessionsNextPage).toBe(3)
  })

  it('fetchSessions page=2 deduplicates sessions', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1), mockSession(2)]
    chatService.getSessions.mockResolvedValue({
      results: [mockSession(2), mockSession(3)], // id:2 is duplicate
      count: 3,
      next: null,
    })

    await store.fetchSessions(2)

    expect(store.sessions).toHaveLength(3)
    expect(store.sessions.map((s) => s.id)).toEqual([1, 2, 3])
  })

  it('fetchSessions sets isLoadingSessions false even on error', async () => {
    const store = useChatStore()
    chatService.getSessions.mockRejectedValue(new Error('net'))

    await expect(store.fetchSessions()).rejects.toBeDefined()
    expect(store.isLoadingSessions).toBe(false)
  })

  // ─── createSession ───

  it('createSession prepends session, sets active and clears messages', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1)]
    store.messages = [mockMessage(99)]
    chatService.createSession.mockResolvedValue(mockSession(5))

    const session = await store.createSession()

    expect(session.id).toBe(5)
    expect(store.sessions[0].id).toBe(5)
    expect(store.activeSessionId).toBe(5)
    expect(store.messages).toEqual([])
  })

  // ─── deleteSession ───

  it('deleteSession removes the session from list', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1), mockSession(2)]
    chatService.deleteSession.mockResolvedValue()

    await store.deleteSession(1)

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0].id).toBe(2)
  })

  it('deleteSession clears activeSessionId and messages when active is deleted', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1), mockSession(2)]
    store.activeSessionId = 1
    store.messages = [mockMessage('m1')]
    chatService.deleteSession.mockResolvedValue()

    await store.deleteSession(1)

    expect(store.activeSessionId).toBeNull()
    expect(store.messages).toEqual([])
  })

  it('deleteSession keeps activeSessionId when a different session is deleted', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1), mockSession(2)]
    store.activeSessionId = 2
    chatService.deleteSession.mockResolvedValue()

    await store.deleteSession(1)

    expect(store.activeSessionId).toBe(2)
  })

  // ─── renameSession ───

  it('renameSession updates session title in the list', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1, { title: 'Antigua' })]
    chatService.renameSession.mockResolvedValue({ ...mockSession(1), title: 'Nueva' })

    await store.renameSession(1, 'Nueva')

    expect(store.sessions[0].title).toBe('Nueva')
  })

  it('renameSession handles non-existent session gracefully', async () => {
    const store = useChatStore()
    store.sessions = [mockSession(1)]
    chatService.renameSession.mockResolvedValue({ id: 99, title: 'X' })

    await store.renameSession(99, 'X')

    expect(store.sessions).toHaveLength(1)
  })

  // ─── setActiveSession ───

  it('setActiveSession sets activeSessionId and fetches messages', () => {
    const store = useChatStore()
    chatService.getMessages.mockResolvedValue({ results: [], count: 0, next: null })

    store.setActiveSession(5)

    expect(store.activeSessionId).toBe(5)
    expect(store.messages).toEqual([])
    expect(chatService.getMessages).toHaveBeenCalledWith(5, 1)
  })

  it('setActiveSession is a no-op when same session is already active', () => {
    const store = useChatStore()
    store.activeSessionId = 5

    store.setActiveSession(5)

    expect(chatService.getMessages).not.toHaveBeenCalled()
  })

  // ─── fetchMessages ───

  it('fetchMessages page=1 replaces messages', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    store.messages = [mockMessage(99)]
    chatService.getMessages.mockResolvedValue({
      results: [mockMessage('a'), mockMessage('b')],
      count: 2,
      next: null,
    })

    await store.fetchMessages(1, 1)

    expect(store.messages).toHaveLength(2)
    expect(store.messagesNextPage).toBeNull()
  })

  it('fetchMessages page=2 appends without duplicates', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    store.messages = [mockMessage('a'), mockMessage('b')]
    chatService.getMessages.mockResolvedValue({
      results: [mockMessage('b'), mockMessage('c')], // 'b' is duplicate
      count: 3,
      next: 'url',
    })

    await store.fetchMessages(1, 2)

    expect(store.messages).toHaveLength(3)
    expect(store.messagesNextPage).toBe(3)
  })

  it('fetchMessages returns early when session does not match active', async () => {
    const store = useChatStore()
    store.activeSessionId = 2

    await store.fetchMessages(1)

    expect(chatService.getMessages).not.toHaveBeenCalled()
  })

  it('fetchMessages sets isLoadingMessages false even on error', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    chatService.getMessages.mockRejectedValue(new Error('net'))

    await expect(store.fetchMessages(1)).rejects.toBeDefined()
    expect(store.isLoadingMessages).toBe(false)
  })

  // ─── sendMessage ───

  it('sendMessage creates a session if none is active', async () => {
    const store = useChatStore()
    store.activeSessionId = null
    chatService.createSession.mockResolvedValue(mockSession(10))
    chatService.sendMessage.mockResolvedValue()

    await store.sendMessage({ prompt: 'hola' })

    expect(chatService.createSession).toHaveBeenCalled()
    expect(store.activeSessionId).toBe(10)
  })

  it('sendMessage adds user message immediately (optimistic update)', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    chatService.sendMessage.mockResolvedValue()

    await store.sendMessage({ prompt: 'Mi pregunta' })

    const userMsg = store.messages.find((m) => m.role === 'user')
    expect(userMsg).toBeDefined()
    expect(userMsg.content).toBe('Mi pregunta')
  })

  it('sendMessage onToken callback accumulates content in assistant message', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    chatService.sendMessage.mockImplementation(async (_payload, { onToken }) => {
      onToken('Hola')
      onToken(' mundo')
    })

    await store.sendMessage({ prompt: 'test' })

    const assistantMsg = store.messages.find((m) => m.role === 'assistant')
    expect(assistantMsg.content).toBe('Hola mundo')
  })

  it('sendMessage onModerated marks assistant message as moderated', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    chatService.sendMessage.mockImplementation(async (_payload, { onModerated }) => {
      onModerated('Tu mensaje fue moderado.')
    })

    await store.sendMessage({ prompt: 'test' })

    const assistantMsg = store.messages.find((m) => m.role === 'assistant')
    expect(assistantMsg.content).toBe('Tu mensaje fue moderado.')
    expect(assistantMsg.moderated).toBe(true)
  })

  it('sendMessage onDone clears isStreaming and updates session title', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    store.sessions = [mockSession(1)]
    chatService.sendMessage.mockImplementation(async (_payload, { onDone }) => {
      onDone(1, 'Nuevo título')
    })

    await store.sendMessage({ prompt: 'test' })

    expect(store.isStreaming).toBe(false)
    const session = store.sessions.find((s) => s.id === 1)
    expect(session.title).toBe('Nuevo título')
  })

  it('sendMessage onDone fetches sessions when backend assigns new sessionId', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    store.sessions = [mockSession(1)]
    chatService.sendMessage.mockImplementation(async (_payload, { onDone }) => {
      onDone(99) // new session id not in list
    })
    chatService.getSessions.mockResolvedValue({ results: [], count: 0, next: null })

    await store.sendMessage({ prompt: 'test' })

    expect(chatService.getSessions).toHaveBeenCalled()
  })

  it('sendMessage onError sets error content on assistant message', async () => {
    const store = useChatStore()
    store.activeSessionId = 1
    chatService.sendMessage.mockImplementation(async (_payload, { onError }) => {
      onError('Error de conexión')
    })

    await store.sendMessage({ prompt: 'test' })

    const assistantMsg = store.messages.find((m) => m.role === 'assistant')
    expect(assistantMsg.content).toContain('Error de conexión')
    expect(assistantMsg._isStreaming).toBe(false)
    expect(store.isStreaming).toBe(false)
  })

  // ─── cancelStreaming ───

  it('cancelStreaming aborts the controller and clears isStreaming', () => {
    const store = useChatStore()
    const abortSpy = vi.fn()
    store.isStreaming = true
    store.abortController = { abort: abortSpy }
    store.messages = [{ role: 'assistant', _isStreaming: true }]

    store.cancelStreaming()

    expect(abortSpy).toHaveBeenCalled()
    expect(store.isStreaming).toBe(false)
    expect(store.abortController).toBeNull()
    expect(store.messages[0]._isStreaming).toBe(false)
  })

  it('cancelStreaming is a no-op when not streaming', () => {
    const store = useChatStore()
    store.abortController = null

    store.cancelStreaming() // should not throw

    expect(store.isStreaming).toBe(false)
  })
})
