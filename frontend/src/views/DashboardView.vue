<template>
  <div class="dashboard" :class="{ 'dashboard--sidebar-collapsed': uiStore.sidebarCollapsed }">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main content area -->
    <div class="dashboard__content">
      <!-- Editor panel (center) -->
      <div
        v-if="editorStore.editorVisible"
        class="dashboard__editor"
        :style="{ flexBasis: editorWidth + '%' }"
      >
        <CodeEditor />
      </div>

      <!-- Resize handle -->
      <div
        v-if="editorStore.editorVisible"
        class="dashboard__resize-handle"
        @mousedown="startResize"
      >
        <div class="dashboard__resize-handle-line"></div>
      </div>

      <!-- Chat panel (right) -->
      <div
        class="dashboard__chat"
        :style="{ flexBasis: editorStore.editorVisible ? (100 - editorWidth) + '%' : '100%' }"
      >
        <ChatPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { useEditorStore } from '../stores/editor'
import { useUIStore } from '../stores/ui'
import AppSidebar from '../components/layout/AppSidebar.vue'
import ChatPanel from '../components/chat/ChatPanel.vue'
import CodeEditor from '../components/editor/CodeEditor.vue'

const chatStore = useChatStore()
const editorStore = useEditorStore()
const uiStore = useUIStore()

const editorWidth = ref(50) // porcentaje
let isResizing = false

// Cargar sesiones al montar
onMounted(() => {
  chatStore.fetchSessions()
})

// ─── Resize logic ───
function startResize(e) {
  isResizing = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e) {
  if (!isResizing) return
  const content = document.querySelector('.dashboard__content')
  if (!content) return
  const rect = content.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  editorWidth.value = Math.max(25, Math.min(75, pct))
}

function stopResize() {
  isResizing = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-surface-chat);
}

.dashboard__content {
  flex: 1;
  display: flex;
  min-width: 0;
  overflow: hidden;
}

/* ─── Editor Panel ─── */
.dashboard__editor {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  overflow: hidden;
  background-color: var(--color-surface-editor);
}

/* ─── Resize Handle ─── */
.dashboard__resize-handle {
  width: 6px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface-sidebar);
  transition: background-color var(--transition-fast);
  flex-shrink: 0;
}

.dashboard__resize-handle:hover {
  background-color: var(--color-primary);
}

.dashboard__resize-handle-line {
  width: 2px;
  height: 32px;
  border-radius: 1px;
  background-color: var(--color-border);
  transition: background-color var(--transition-fast);
}

.dashboard__resize-handle:hover .dashboard__resize-handle-line {
  background-color: var(--color-text-on-primary);
}

/* ─── Chat Panel ─── */
.dashboard__chat {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  overflow: hidden;
  background-color: var(--color-surface-chat);
}
</style>
