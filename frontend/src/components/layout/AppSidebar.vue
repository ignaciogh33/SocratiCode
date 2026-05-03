<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': uiStore.sidebarCollapsed }">
    <!-- Header: Logo + Toggle -->
    <div class="sidebar__header" :class="{ 'sidebar__header--collapsed': uiStore.sidebarCollapsed }">
      <!-- Expanded Mode -->
      <template v-if="!uiStore.sidebarCollapsed">
        <div class="sidebar__brand">
          <img src="../../assets/images/logo-circular.svg" alt="SocratiCode" class="sidebar__logo" />
          <span class="sidebar__brand-name">SocratiCode</span>
        </div>
        <button class="sidebar__toggle" @click="uiStore.toggleSidebar" title="Minimizar sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </template>

      <!-- Collapsed Mode -->
      <template v-else>
        <button class="sidebar__logo-toggle" @click="uiStore.toggleSidebar" title="Expandir sidebar">
          <img src="../../assets/images/logo-circular.svg" alt="SC" class="sidebar__logo sidebar__logo--small" />
          <div class="sidebar__logo-hover">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </div>
        </button>
      </template>
    </div>

    <!-- New conversation button -->
    <button class="sidebar__new-chat" @click="handleNewChat" :title="uiStore.sidebarCollapsed ? 'Nueva conversación' : ''">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span v-if="!uiStore.sidebarCollapsed">Nueva conversación</span>
    </button>

    <!-- Toggle editor button -->
    <button class="sidebar__toggle-editor" @click="editorStore.toggleEditor" :title="editorStore.editorVisible ? 'Ocultar editor' : 'Mostrar editor'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <polyline points="16,18 22,12 16,6"/>
        <polyline points="8,6 2,12 8,18"/>
      </svg>
      <span v-if="!uiStore.sidebarCollapsed">{{ editorStore.editorVisible ? 'Ocultar editor' : 'Mostrar editor' }}</span>
    </button>

    <!-- Sessions list -->
    <div ref="sessionsContainer" class="sidebar__sessions" @scroll="onSessionsScroll">
      <template v-if="!uiStore.sidebarCollapsed">
        <!-- Skeleton loading -->
        <template v-if="chatStore.isLoadingSessions && chatStore.sessions.length === 0">
          <div v-for="i in 5" :key="i" class="sidebar__session-skeleton">
            <SkeletonLoader width="100%" height="38px" />
          </div>
        </template>

        <!-- Session items -->
        <template v-else>
          <div
            v-for="session in chatStore.sortedSessions"
            :key="session.id"
            :class="['sidebar__session', { 'sidebar__session--active': session.id === chatStore.activeSessionId }]"
            @click="chatStore.setActiveSession(session.id)"
          >
            <!-- Edit mode -->
            <input
              v-if="editingSessionId === session.id"
              ref="editInput"
              v-model="editTitle"
              class="sidebar__session-edit"
              @keyup.enter="saveRename(session.id)"
              @keyup.escape="cancelRename"
              @blur="saveRename(session.id)"
            />
            <!-- Normal display -->
            <span v-else class="sidebar__session-title">{{ session.title }}</span>

            <!-- Actions -->
            <div class="sidebar__session-actions" v-if="editingSessionId !== session.id">
              <button @click.stop="startRename(session)" title="Renombrar" class="sidebar__session-action">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button @click.stop="handleDelete(session.id)" title="Eliminar" class="sidebar__session-action sidebar__session-action--danger">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Infinite scroll loading -->
          <div v-if="chatStore.isLoadingSessions && chatStore.sessions.length > 0" class="sidebar__session-skeleton">
            <SkeletonLoader width="100%" height="38px" />
          </div>
        </template>
      </template>
    </div>

    <!-- Footer -->
    <div class="sidebar__footer">
      <button class="sidebar__footer-btn sidebar__footer-btn--profile" :title="uiStore.sidebarCollapsed ? 'Perfil' : ''" @click="router.push({ name: 'Profile' })">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span v-if="!uiStore.sidebarCollapsed">Perfil</span>
      </button>

      <button class="sidebar__footer-btn sidebar__footer-btn--logout" :title="uiStore.sidebarCollapsed ? 'Cerrar sesión' : ''" @click="handleLogout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span v-if="!uiStore.sidebarCollapsed">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import { useEditorStore } from '../../stores/editor'
import { useUIStore } from '../../stores/ui'
import SkeletonLoader from '../ui/SkeletonLoader.vue'

const router = useRouter()
const chatStore = useChatStore()
const authStore = useAuthStore()
const editorStore = useEditorStore()
const uiStore = useUIStore()

const editingSessionId = ref(null)
const editTitle = ref('')
const sessionsContainer = ref(null)

// Auto-cargar más sesiones si el contenedor no tiene scroll
watch(
  () => chatStore.sessions.length,
  () => {
    nextTick(() => {
      const el = sessionsContainer.value
      if (!el) return
      // Si el contenido no desborda y hay más páginas, cargar la siguiente
      if (el.scrollHeight <= el.clientHeight && chatStore.sessionsNextPage && !chatStore.isLoadingSessions) {
        chatStore.fetchSessions(chatStore.sessionsNextPage)
      }
    })
  }
)

async function handleNewChat() {
  await chatStore.createSession()
}

function startRename(session) {
  editingSessionId.value = session.id
  editTitle.value = session.title
  nextTick(() => {
    const input = document.querySelector('.sidebar__session-edit')
    if (input) input.focus()
  })
}

async function saveRename(sessionId) {
  if (editTitle.value.trim() && editTitle.value.trim() !== '') {
    await chatStore.renameSession(sessionId, editTitle.value.trim())
  }
  editingSessionId.value = null
}

function cancelRename() {
  editingSessionId.value = null
}

async function handleDelete(sessionId) {
  if (confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) {
    await chatStore.deleteSession(sessionId)
  }
}

function handleLogout() {
  authStore.logout()
  router.push({ name: 'Login' })
}

function onSessionsScroll(e) {
  const el = e.target
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  if (nearBottom && chatStore.sessionsNextPage && !chatStore.isLoadingSessions) {
    chatStore.fetchSessions(chatStore.sessionsNextPage)
  }
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width-expanded);
  min-width: var(--sidebar-width-expanded);
  background-color: var(--color-surface-sidebar);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal), min-width var(--transition-normal);
  border-right: 1px solid var(--color-border);
  overflow: hidden;
}

.sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
  min-width: var(--sidebar-width-collapsed);
}

/* ─── Header ─── */
.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  gap: 8px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.sidebar__brand-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
}

.sidebar__logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar__logo--small {
  margin: 0 auto;
}

.sidebar__toggle {
  padding: 6px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
}

.sidebar__toggle:hover {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
}

.sidebar__logo-toggle {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 auto;
  transition: background-color var(--transition-fast);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
}

.sidebar__logo-toggle:hover {
  background-color: var(--color-surface-input);
}

.sidebar__logo-toggle .sidebar__logo {
  transition: opacity var(--transition-fast);
  width: 32px;
  height: 32px;
}

.sidebar__logo-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: var(--color-text-body);
}

.sidebar__logo-toggle:hover .sidebar__logo {
  opacity: 0;
}

.sidebar__logo-toggle:hover .sidebar__logo-hover {
  opacity: 1;
}

/* ─── New Chat Button ─── */
.sidebar__new-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 12px 8px;
  padding: 10px 14px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: background-color var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
}

.sidebar__new-chat:hover {
  background-color: var(--color-primary-hover);
}

.sidebar--collapsed .sidebar__new-chat {
  padding: 10px;
}

/* ─── Toggle Editor Button ─── */
.sidebar__toggle-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 12px 12px;
  padding: 8px 14px;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.sidebar__toggle-editor:hover {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
}

.sidebar--collapsed .sidebar__toggle-editor {
  padding: 8px;
}

/* ─── Sessions List ─── */
.sidebar__sessions {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__session {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  position: relative;
  min-height: 38px;
}

.sidebar__session:hover {
  background-color: var(--color-surface-input);
}

.sidebar__session--active {
  background-color: var(--color-primary-light);
  border-left: 2px solid var(--color-primary);
}

.sidebar__session-icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.sidebar__session--active .sidebar__session-icon {
  color: var(--color-primary);
}

.sidebar__session-title {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__session-edit {
  flex: 1;
  font-size: 13px;
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-primary);
  min-width: 0;
}

/* Actions (visible on hover) */
.sidebar__session-actions {
  display: none;
  gap: 2px;
  flex-shrink: 0;
}

.sidebar__session:hover .sidebar__session-actions {
  display: flex;
}

.sidebar__session-action {
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.sidebar__session-action:hover {
  background-color: var(--color-surface-chat);
  color: var(--color-text-body);
}

.sidebar__session-action--danger:hover {
  color: var(--color-error);
}

/* Skeleton */
.sidebar__session-skeleton {
  padding: 4px 8px;
}

/* ─── Footer ─── */
.sidebar__footer {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__footer-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 100%;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
  white-space: nowrap;
  overflow: hidden;
  border: none;
  background: transparent;
  cursor: pointer;
}

.sidebar__footer-btn svg {
  flex-shrink: 0;
}

.sidebar--collapsed .sidebar__footer-btn {
  justify-content: center;
  padding: 8px;
}

.sidebar__footer-btn:hover {
  background-color: var(--color-surface-input);
  color: var(--color-text-body);
}

.sidebar__footer-btn--profile:hover {
  color: var(--color-primary);
}

.sidebar__footer-btn--logout:hover {
  color: var(--color-error);
}
</style>
