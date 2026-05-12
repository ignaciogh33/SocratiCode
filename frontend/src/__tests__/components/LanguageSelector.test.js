import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useEditorStore, SUPPORTED_LANGUAGES } from '../../stores/editor'
import LanguageSelector from '../../components/editor/LanguageSelector.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div/>' } }],
})

function mountSelector(editorState = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      editor: { language: 'python', ...editorState },
    },
  })
  const wrapper = mount(LanguageSelector, {
    global: { plugins: [router, pinia] },
  })
  return { wrapper, editorStore: useEditorStore() }
}

describe('LanguageSelector', () => {
  it('renders a select element', () => {
    const { wrapper } = mountSelector()
    expect(wrapper.find('select').exists()).toBe(true)
  })

  it('renders one option per supported language', () => {
    const { wrapper } = mountSelector()
    const options = wrapper.findAll('option')
    expect(options.length).toBe(SUPPORTED_LANGUAGES.length)
  })

  it('option values match language ids', () => {
    const { wrapper } = mountSelector()
    const options = wrapper.findAll('option')
    SUPPORTED_LANGUAGES.forEach((lang, i) => {
      expect(options[i].attributes('value')).toBe(lang.id)
    })
  })

  it('select value matches editorStore.language', () => {
    const { wrapper } = mountSelector({ language: 'python' })
    expect(wrapper.find('select').element.value).toBe('python')
  })

  it('select reflects updated language', () => {
    const { wrapper } = mountSelector({ language: 'java' })
    expect(wrapper.find('select').element.value).toBe('java')
  })

  it('change event calls editorStore.setLanguage with selected value', async () => {
    const { wrapper, editorStore } = mountSelector({ language: 'python' })
    const select = wrapper.find('select')
    await select.setValue('c')
    expect(editorStore.setLanguage).toHaveBeenCalledWith('c')
  })

  it('option text labels match language labels', () => {
    const { wrapper } = mountSelector()
    const options = wrapper.findAll('option')
    SUPPORTED_LANGUAGES.forEach((lang, i) => {
      expect(options[i].text()).toBe(lang.label)
    })
  })
})
