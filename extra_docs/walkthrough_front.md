# Walkthrough — Frontend SocratiCode

## Resumen

Se ha implementado el frontend completo de SocratiCode como SPA con **Vue 3 (Composition API) + Vite + Tailwind CSS v4**. La aplicación incluye autenticación JWT, chat con streaming SSE (efecto máquina de escribir), editor de código Monaco y terminal integrada.

---

## Cambios Realizados

### Fase 0: Reestructuración del Monorepo
- Renombrada carpeta `src/` → `backend/`
- Actualizados 3 archivos con referencias:
  - [.vscode/settings.json](file:///home/ignacio/Escritorio/SocratiCode/.vscode/settings.json)
  - [README.md](file:///home/ignacio/Escritorio/SocratiCode/README.md)
  - [pasar_produccion.md](file:///home/ignacio/Escritorio/SocratiCode/pasar_produccion.md)
- Django `manage.py check` pasa sin problemas

### Fase 1: Scaffolding
- Instalado NVM + Node v22.22.2 (necesario para Vite 8+)
- Proyecto Vue 3 creado con `create-vite --template vue`
- Dependencias: tailwindcss v4, vue-router, pinia, monaco-editor, marked, highlight.js, axios

### Fase 2: Design Tokens
Archivo central: [theme.css](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/assets/css/theme.css)

```css
@theme {
  --color-primary: #94618E;        /* ← Cambiar aquí = cambiar toda la app */
  --color-hint: #B8860B;
  --color-surface-sidebar: #1A1515;
  --color-surface-chat: #262624;
  /* ... */
}
```

- Fonts self-hosted: Inter (variable) + Fira Code (regular, semibold)
- Base CSS: [base.css](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/assets/css/base.css)

### Fase 3: Infraestructura

| Archivo | Función |
|---|---|
| [api.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/api.js) | Axios con JWT auto-inject + refresh en 401 |
| [chatService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/chatService.js) | CRUD sesiones (Axios) + SSE streaming (`fetch` nativo) |
| [authService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/authService.js) | Login, registro, perfil (Djoser) |
| [compilerService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/compilerService.js) | Ejecución de código (Piston) |
| [stores/auth.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/auth.js) | Pinia: tokens, user, login/register/logout |
| [stores/chat.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/chat.js) | Pinia: sesiones, mensajes, SSE streaming |
| [stores/editor.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/editor.js) | Pinia: código, lenguaje, terminal output |
| [router/index.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/router/index.js) | `/login` + `/` con guards de auth |

### Fase 4-7: Vistas y Componentes

| Componente | Descripción |
|---|---|
| [LoginView](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/views/LoginView.vue) | Login/Registro con tabs, orbs animados, error handling |
| [DashboardView](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/views/DashboardView.vue) | Layout 3 columnas resizables |
| [AppSidebar](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/layout/AppSidebar.vue) | Colapsable, sesiones, rename/delete |
| [ChatPanel](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/ChatPanel.vue) | Empty state + mensajes + input |
| [MessageBubble](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/MessageBubble.vue) | Markdown + syntax highlighting + copiar código |
| [ChatInput](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/ChatInput.vue) | Autoexpand, Ctrl+Enter, envía code_context |
| [CodeEditor](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/editor/CodeEditor.vue) | Monaco Editor lazy loaded, Fira Code |
| [TerminalOutput](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/editor/TerminalOutput.vue) | stdout/stderr con exit code |

---

## Página de Login Verificada

![Login page screenshot](/home/ignacio/.gemini/antigravity/brain/c9aa351a-6c36-422b-9723-1cf4b97d9ec7/login_page_1775759151663.png)

---

## Cómo Ejecutar

```bash
# Terminal 1: Backend
cd backend
docker compose up -d        # PostgreSQL + Piston
uv run uvicorn config.asgi:application --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev                  # Vite en http://localhost:5173
```

El proxy de Vite redirige `/api/*` al backend automáticamente.

---

## Pendiente (minor polish)
- Responsive móvil (sidebar → drawer)
- Modal de confirmación (en vez de `confirm()` nativo)
- Toast/snackbar para errores de red
