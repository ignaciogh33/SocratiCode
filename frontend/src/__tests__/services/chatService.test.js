import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the api module so chatService REST calls don't make real HTTP requests
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { chatService } from '../../services/chatService'
import api from '../../services/api'

// ─── Helper: build a fake ReadableStream from SSE lines ───────────────────────

function makeStream(...lines) {
  const encoder = new TextEncoder()
  const chunks = lines.map((l) => encoder.encode(l))
  let idx = 0
  return {
    getReader: () => ({
      read: vi.fn().mockImplementation(async () => {
        if (idx < chunks.length) return { done: false, value: chunks[idx++] }
        return { done: true, value: undefined }
      }),
    }),
  }
}

function makeFetchResponse(streamLines, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: vi.fn().mockResolvedValue({}),
    body: makeStream(...streamLines),
  })
}

describe('chatService - REST methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('access_token', 'test-token')
  })

  it('getSessions calls api.get with page param', async () => {
    api.get.mockResolvedValue({ data: { results: [], count: 0, next: null } })
    const result = await chatService.getSessions(2)
    expect(api.get).toHaveBeenCalledWith('/chat/sessions/', { params: { page: 2 } })
    expect(result).toEqual({ results: [], count: 0, next: null })
  })

  it('getSessions defaults to page 1', async () => {
    api.get.mockResolvedValue({ data: { results: [], count: 0, next: null } })
    await chatService.getSessions()
    expect(api.get).toHaveBeenCalledWith('/chat/sessions/', { params: { page: 1 } })
  })

  it('createSession calls api.post and returns data', async () => {
    const session = { id: 1, title: 'Nueva conversación' }
    api.post.mockResolvedValue({ data: session })
    const result = await chatService.createSession()
    expect(api.post).toHaveBeenCalledWith('/chat/sessions/create/')
    expect(result).toEqual(session)
  })

  it('getSessionDetail calls api.get with session id', async () => {
    api.get.mockResolvedValue({ data: { id: 5 } })
    const result = await chatService.getSessionDetail(5)
    expect(api.get).toHaveBeenCalledWith('/chat/sessions/5/')
    expect(result).toEqual({ id: 5 })
  })

  it('deleteSession calls api.delete', async () => {
    api.delete.mockResolvedValue({})
    await chatService.deleteSession(3)
    expect(api.delete).toHaveBeenCalledWith('/chat/sessions/3/delete/')
  })

  it('renameSession calls api.patch with title', async () => {
    api.patch.mockResolvedValue({ data: { id: 1, title: 'Nuevo' } })
    const result = await chatService.renameSession(1, 'Nuevo')
    expect(api.patch).toHaveBeenCalledWith('/chat/sessions/1/rename/', { title: 'Nuevo' })
    expect(result.title).toBe('Nuevo')
  })

  it('getMessages calls api.get with session id and page', async () => {
    api.get.mockResolvedValue({ data: { results: [], count: 0, next: null } })
    await chatService.getMessages(7, 3)
    expect(api.get).toHaveBeenCalledWith('/chat/sessions/7/messages/', { params: { page: 3 } })
  })
})

describe('chatService - sendMessage SSE streaming', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('access_token', 'tok')
    global.fetch = vi.fn()
  })

  it('calls onToken for each token event', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: {"token":"Hola"}\n\n',
      'data: {"token":" mundo"}\n\n',
      'data: [DONE]\n\n',
    ]))

    const onToken = vi.fn()
    const onDone = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onToken, onDone })

    expect(onToken).toHaveBeenCalledTimes(2)
    expect(onToken).toHaveBeenNthCalledWith(1, 'Hola')
    expect(onToken).toHaveBeenNthCalledWith(2, ' mundo')
  })

  it('calls onDone with session_id and title when received', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: {"token":"ok"}\n\n',
      'data: {"session_id":42,"session_title":"Mi chat"}\n\n',
      'data: [DONE]\n\n',
    ]))

    const onDone = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onDone })

    expect(onDone).toHaveBeenCalledWith(42, 'Mi chat')
  })

  it('[DONE] sentinel triggers onDone with no arguments', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: [DONE]\n\n',
    ]))

    const onDone = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onDone })

    expect(onDone).toHaveBeenCalledWith()
  })

  it('calls onModerated when moderated flag is true', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: {"moderated":true,"response":"Mensaje bloqueado"}\n\n',
      'data: [DONE]\n\n',
    ]))

    const onModerated = vi.fn()
    const onToken = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onModerated, onToken })

    expect(onModerated).toHaveBeenCalledWith('Mensaje bloqueado')
    expect(onToken).not.toHaveBeenCalled()
  })

  it('calls onToken when response field present without moderated flag (input moderation)', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: {"response":"Tu mensaje fue moderado"}\n\n',
      'data: [DONE]\n\n',
    ]))

    const onToken = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onToken })

    expect(onToken).toHaveBeenCalledWith('Tu mensaje fue moderado')
  })

  it('calls onError when error field present in event', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: {"error":"Error en motor IA"}\n\n',
    ]))

    const onError = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onError })

    expect(onError).toHaveBeenCalledWith('Error en motor IA')
  })

  it('calls onError when response is not ok', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([], false, 401))

    const onError = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onError })

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('401'))
  })

  it('swallows AbortError silently', async () => {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'
    global.fetch.mockRejectedValue(abortError)

    const onError = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onError })

    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onError on network failure', async () => {
    global.fetch.mockRejectedValue(new Error('network error'))

    const onError = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onError })

    expect(onError).toHaveBeenCalledWith('network error')
  })

  it('sends Authorization header with token from localStorage', async () => {
    global.fetch.mockReturnValue(makeFetchResponse(['data: [DONE]\n\n']))

    await chatService.sendMessage({ prompt: 'test' }, {})

    const [_url, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer tok')
  })

  it('ignores non-parseable SSE lines gracefully', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      'data: not-json\n\n',
      'data: [DONE]\n\n',
    ]))

    const onError = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onError })

    // Should complete without calling onError for the bad line
    expect(onError).not.toHaveBeenCalled()
  })

  it('skips lines that do not start with "data: "', async () => {
    global.fetch.mockReturnValue(makeFetchResponse([
      ': heartbeat\n\n',
      'event: message\n\n',
      'data: [DONE]\n\n',
    ]))

    const onToken = vi.fn()
    const onDone = vi.fn()
    await chatService.sendMessage({ prompt: 'test' }, { onToken, onDone })

    expect(onToken).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalled()
  })
})
