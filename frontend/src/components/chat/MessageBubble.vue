<template>
  <div :class="['message-bubble', `message-bubble--${message.role}`]">
    <div class="message-bubble__avatar">
      <template v-if="message.role === 'assistant'">
        <img src="../../assets/images/logo-circular.svg" alt="Sócrates" class="message-bubble__avatar-img" />
      </template>
      <template v-else>
        <div class="message-bubble__avatar-user">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </template>
    </div>

    <div class="message-bubble__content">
      <div class="message-bubble__header" v-if="message.moderated">
        <span class="message-bubble__moderated" title="Mensaje moderado">
          ⚠️
        </span>
      </div>
      <div class="message-bubble__body" v-html="renderedContent"></div>

      <span v-if="message._isStreaming" class="message-bubble__cursor">▊</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import c from 'highlight.js/lib/languages/c'
import xml from 'highlight.js/lib/languages/xml'
import bash from 'highlight.js/lib/languages/bash'
import 'highlight.js/styles/github-dark.min.css'

hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('c', c)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('bash', bash)

const props = defineProps({
  message: { type: Object, required: true },
})

const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      let highlighted
      try {
        highlighted = hljs.highlight(text, { language }).value
      } catch {
        highlighted = text
      }
      return `<div class="code-block">
        <div class="code-block__header">
          <span class="code-block__lang">${language}</span>
          <button class="code-block__copy" onclick="navigator.clipboard.writeText(this.closest('.code-block').querySelector('code').textContent)">
            Copiar
          </button>
        </div>
        <pre><code class="hljs language-${language}">${highlighted}</code></pre>
      </div>`
    },
  },
})

const renderedContent = computed(() => {
  if (!props.message.content) return ''
  return marked.parse(props.message.content)
})
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  max-width: 85%;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-bubble--assistant {
  align-self: flex-start;
}

.message-bubble--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble--user .message-bubble__content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble__avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.message-bubble__avatar-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.message-bubble__avatar-user {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-surface-bubble-user);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.message-bubble__content {
  min-width: 0;
}

.message-bubble__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.message-bubble__moderated {
  font-size: 12px;
}

.message-bubble__body {
  font-size: 15px;
  line-height: 1.7;
  color: var(--color-text-body);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-bubble--user .message-bubble__body {
  background-color: var(--color-primary-light);
  border: 1px solid rgba(148, 97, 142, 0.3);
  padding: 14px 20px;
  border-radius: 24px;
  border-top-right-radius: 2px;
}

.message-bubble__cursor {
  animation: blink 0.8s step-end infinite;
  color: var(--color-primary);
  font-size: 14px;
}

@keyframes blink {
  50% { opacity: 0; }
}

.message-bubble__body :deep(p) {
  margin-bottom: 8px;
}

.message-bubble__body :deep(p:last-child) {
  margin-bottom: 0;
}

.message-bubble__body :deep(ul),
.message-bubble__body :deep(ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

.message-bubble__body :deep(li) {
  margin-bottom: 2px;
}

.message-bubble__body :deep(strong) {
  color: var(--color-text-on-primary);
  font-weight: 600;
}

.message-bubble__body :deep(.code-block) {
  margin: 8px 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.message-bubble__body :deep(.code-block__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: var(--color-surface-sidebar);
  font-size: 11px;
}

.message-bubble__body :deep(.code-block__lang) {
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.message-bubble__body :deep(.code-block__copy) {
  color: var(--color-text-muted);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font-sans);
  transition: all var(--transition-fast);
}

.message-bubble__body :deep(.code-block__copy:hover) {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
}

.message-bubble__body :deep(pre) {
  margin: 0;
  padding: 12px 16px;
  background-color: var(--color-surface-editor);
  overflow-x: auto;
}

.message-bubble__body :deep(code) {
  font-family: var(--font-mono);
  font-size: 13px;
  background: none;
  padding: 0;
}

/* Inline code (not in a code block) */
.message-bubble__body :deep(:not(pre) > code) {
  background-color: var(--color-surface-input);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.9em;
}
</style>
