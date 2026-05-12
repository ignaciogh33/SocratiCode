import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useEditorStore } from '../../stores/editor'
import TerminalOutput from '../../components/editor/TerminalOutput.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function mountTerminal(editorState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      editor: {
        stdout: '',
        stderr: '',
        isExecuting: false,
        exitCode: null,
        isSuccess: false,
        ...editorState,
      },
    },
  })
  const wrapper = mount(TerminalOutput, {
    global: { plugins: [router, pinia] },
  })
  return { wrapper, editorStore: useEditorStore() }
}

describe('TerminalOutput — empty state', () => {
  it('shows empty state text when idle with no output', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal__empty').exists()).toBe(true)
  })

  it('hides empty state when executing', () => {
    const { wrapper } = mountTerminal({ isExecuting: true })
    expect(wrapper.find('.terminal__empty').exists()).toBe(false)
  })

  it('hides empty state when stdout present', () => {
    const { wrapper } = mountTerminal({ stdout: 'Hello' })
    expect(wrapper.find('.terminal__empty').exists()).toBe(false)
  })

  it('hides empty state when stderr present', () => {
    const { wrapper } = mountTerminal({ stderr: 'Error' })
    expect(wrapper.find('.terminal__empty').exists()).toBe(false)
  })
})

describe('TerminalOutput — output', () => {
  it('shows stdout content', () => {
    const { wrapper } = mountTerminal({ stdout: 'Hello World' })
    expect(wrapper.find('.terminal__stdout').text()).toBe('Hello World')
  })

  it('shows stderr content', () => {
    const { wrapper } = mountTerminal({ stderr: 'TypeError: oops' })
    expect(wrapper.find('.terminal__stderr').text()).toBe('TypeError: oops')
  })

  it('hides stdout element when empty', () => {
    const { wrapper } = mountTerminal({ stdout: '' })
    expect(wrapper.find('.terminal__stdout').exists()).toBe(false)
  })

  it('hides stderr element when empty', () => {
    const { wrapper } = mountTerminal({ stderr: '' })
    expect(wrapper.find('.terminal__stderr').exists()).toBe(false)
  })
})

describe('TerminalOutput — executing state', () => {
  it('shows spinner when isExecuting', () => {
    const { wrapper } = mountTerminal({ isExecuting: true })
    expect(wrapper.find('.terminal__loading').exists()).toBe(true)
    expect(wrapper.find('.terminal__spinner').exists()).toBe(true)
  })

  it('hides spinner when not executing', () => {
    const { wrapper } = mountTerminal({ isExecuting: false })
    expect(wrapper.find('.terminal__loading').exists()).toBe(false)
  })
})

describe('TerminalOutput — exit code', () => {
  it('shows exit code when exitCode is not null', () => {
    const { wrapper } = mountTerminal({ exitCode: 0 })
    expect(wrapper.find('.terminal__exit-code').exists()).toBe(true)
    expect(wrapper.find('.terminal__exit-code').text()).toBe('exit: 0')
  })

  it('hides exit code when exitCode is null', () => {
    const { wrapper } = mountTerminal({ exitCode: null })
    expect(wrapper.find('.terminal__exit-code').exists()).toBe(false)
  })

  it('applies success class when isSuccess', () => {
    const { wrapper } = mountTerminal({ exitCode: 0, isSuccess: true })
    expect(wrapper.find('.terminal__exit-code').classes()).toContain('terminal__exit-code--success')
  })

  it('applies error class when not isSuccess', () => {
    const { wrapper } = mountTerminal({ exitCode: 1, isSuccess: false })
    expect(wrapper.find('.terminal__exit-code').classes()).toContain('terminal__exit-code--error')
  })
})

describe('TerminalOutput — controls', () => {
  it('clear button calls editorStore.clearTerminal', async () => {
    const { wrapper, editorStore } = mountTerminal()
    await wrapper.find('.terminal__clear').trigger('click')
    expect(editorStore.clearTerminal).toHaveBeenCalledOnce()
  })

  it('close button calls editorStore.toggleTerminal', async () => {
    const { wrapper, editorStore } = mountTerminal()
    await wrapper.find('.terminal__close').trigger('click')
    expect(editorStore.toggleTerminal).toHaveBeenCalledOnce()
  })

  it('renders Terminal title', () => {
    const { wrapper } = mountTerminal()
    expect(wrapper.find('.terminal__title').text()).toBe('Terminal')
  })
})
