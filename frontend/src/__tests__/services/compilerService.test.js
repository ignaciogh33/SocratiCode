import { describe, it, expect, vi } from 'vitest'

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}))

import { compilerService } from '../../services/compilerService'
import api from '../../services/api'

describe('compilerService', () => {
  it('executeCode calls POST /compiler/execute/ with the right payload', async () => {
    api.post.mockResolvedValue({
      data: { stdout: 'hello\n', stderr: '', exit_code: 0, language: 'python' },
    })
    const result = await compilerService.executeCode('print("hello")', 'python', '3.10.0')
    expect(api.post).toHaveBeenCalledWith('/compiler/execute/', {
      source_code: 'print("hello")',
      language: 'python',
      version: '3.10.0',
    })
    expect(result.stdout).toBe('hello\n')
    expect(result.exit_code).toBe(0)
  })

  it('executeCode uses default language and version when not provided', async () => {
    api.post.mockResolvedValue({ data: { stdout: '', stderr: '', exit_code: 0 } })
    await compilerService.executeCode('x = 1')
    expect(api.post).toHaveBeenCalledWith('/compiler/execute/', {
      source_code: 'x = 1',
      language: 'python',
      version: '3.10.0',
    })
  })
})
