# Plan de Implementación — Frontend SocratiCode

## Decisiones Técnicas (Resueltas)

| Decisión | Resolución |
|---|---|
| **Tailwind CSS** | **v4** — tokens via `@theme` en CSS |
| **Estructura monorepo** | Renombrar `src/` → `backend/`, crear `frontend/` a la misma altura |
| **Editor de código** | **Monaco Editor** (lazy loaded) |
| **Tipografías** | **Self-hosted** (Inter + Fira Code en el bundle) |
| **HTTP client** | **Axios** para API REST + **`fetch()` nativo** para SSE streaming |

> [!NOTE]
> **¿Por qué `fetch()` para SSE y no Axios?** Axios no soporta streaming de respuestas en el navegador (necesita recibir la respuesta completa). Para el efecto máquina de escribir token-a-token, necesitamos `fetch()` con `ReadableStream` que sí permite leer datos conforme llegan. `EventSource` nativo tampoco sirve porque solo soporta GET sin headers personalizados, y nuestro endpoint es POST con JWT. Solución: **Axios para todo** excepto `POST /api/chat/` que usa **`fetch()` nativo**.

---

## Fase 0: Renombrar `src/` → `backend/`

### Análisis de Impacto

He auditado todas las referencias a `src/` en el proyecto. **Django internamente NO se rompe** porque usa rutas relativas (`BASE_DIR = Path(__file__).resolve().parent.parent`), y los módulos se referencian como `config.settings`, `apps.chat`, etc. sin mención a la carpeta física.

**Archivos que SÍ necesitan actualización:**

| Archivo | Línea | Cambio |
|---|---|---|
| [settings.json](file:///home/ignacio/Escritorio/SocratiCode/.vscode/settings.json) | 4, 5, 8, 11 | `${workspaceFolder}/src` → `${workspaceFolder}/backend` |
| [README.md](file:///home/ignacio/Escritorio/SocratiCode/README.md) | 23 | `"src/"` → `"backend/"` |
| [pasar_produccion.md](file:///home/ignacio/Escritorio/SocratiCode/pasar_produccion.md) | 12 | `src/config/settings.py` → `backend/config/settings.py` |
| [README.md](file:///home/ignacio/Escritorio/SocratiCode/README.md) | 47 | `cd src` → `cd backend` |

**Archivos que NO necesitan cambios:**

| Archivo | Razón |
|---|---|
| `manage.py` | Usa `config.settings` (relativo), no `src/config/settings` |
| `settings.py` | `BASE_DIR` se calcula con `Path(__file__).resolve()` — agnóstico al nombre |
| `asgi.py` / `wsgi.py` | Usan `config.settings` sin referencia a `src/` |
| `docker-compose.yml` | Solo define PostgreSQL y Piston, no monta la carpeta `src/` |
| `.gitignore` | No referencia `src/` |
| `.env` | Está en la raíz, `settings.py` lee de `BASE_DIR.parent` → sigue siendo la raíz |
| `pyproject.toml` | No tiene ninguna ruta a `src/` |

---

## Fase 1: Scaffolding del Proyecto Vue

#### [NEW] Proyecto Vue 3 + Vite

```bash
# Desde /SocratiCode/
npx -y create-vite@latest frontend -- --template vue
cd frontend && npm install
```

#### [NEW] Dependencias

```bash
# Tailwind CSS v4 + plugin Vite
npm install tailwindcss @tailwindcss/vite

# Routing + Estado global
npm install vue-router pinia

# Monaco Editor
npm install monaco-editor @monaco-editor/loader

# Markdown (chat) + syntax highlighting
npm install marked highlight.js

# HTTP client
npm install axios
```

---

## Fase 2: Design Tokens + Sistema Visual Base

> **Fase crítica.** Todo el resto la consume.

#### [NEW] [theme.css](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/assets/css/theme.css)

Fuente única de verdad para toda la identidad visual:

```css
@import "tailwindcss";

@theme {
  /* ═══════════════════════════════════════════
     BRAND — Editar aquí = cambiar toda la app
     ═══════════════════════════════════════════ */
  --color-primary: #94618E;
  --color-primary-hover: #7D5177;
  --color-hint: #B8860B;
  --color-hint-hover: #9A7009;

  /* SURFACES */
  --color-surface-sidebar: #1A1515;
  --color-surface-chat: #262624;
  --color-surface-input: #30302E;
  --color-surface-editor: #1E1E1E;
  --color-surface-bubble-user: #2D2D2D;

  /* STATES */
  --color-error: #D62828;
  --color-success: #2D5A27;

  /* TEXT */
  --color-text-on-primary: #FFFFFF;
  --color-text-body: #D4D4D4;
  --color-text-muted: #888888;

  /* TYPOGRAPHY */
  --font-sans: 'Inter', Helvetica, sans-serif;
  --font-mono: 'Fira Code', 'Source Code Pro', monospace;

  /* LAYOUT */
  --sidebar-width-expanded: 280px;
  --sidebar-width-collapsed: 64px;

  /* BORDER RADIUS */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

**Uso en la práctica:**
- Tailwind: `bg-primary`, `text-hint`, `font-mono`, `bg-surface-chat`
- CSS puro: `var(--color-primary)`
- Cambiar el **Rosa Pastel por Rojo Académico**: editar una línea → toda la app se actualiza

#### [NEW] [base.css](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/assets/css/base.css)

Reset CSS, tipografía global Inter, scrollbar personalizada (colores del tema), estilos globales para html/body.

#### [NEW] [main.css](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/assets/css/main.css)

```css
@import './theme.css';
@import './base.css';
```

#### [NEW] Fonts self-hosted

Descargar Inter (variable) y Fira Code a `src/assets/fonts/` con `@font-face` en `base.css`.

---

## Fase 3: Infraestructura (Router, Stores, Services)

#### [NEW] [router/index.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/router/index.js)

| Ruta | Vista | Guard |
|---|---|---|
| `/login` | `LoginView` | Solo si NO autenticado |
| `/` | `DashboardView` | Solo si autenticado |

#### [NEW] [services/api.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/api.js)

Instancia Axios con:
- `baseURL: http://localhost:8000/api`
- Interceptor request: inyecta `Authorization: Bearer <token>`
- Interceptor response: 401 → intenta refresh JWT → si falla → logout + redirect `/login`

#### [NEW] [services/authService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/authService.js)

- `login(username, password)` → `POST /auth/jwt/create/`
- `register(data)` → `POST /auth/users/`
- `refreshToken(refresh)` → `POST /auth/jwt/refresh/`
- `fetchUser()` → `GET /auth/users/me/`

#### [NEW] [services/chatService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/chatService.js)

- `getSessions(page)` → `GET /chat/sessions/?page=N`
- `createSession()` → `POST /chat/sessions/create/`
- `deleteSession(id)` → `DELETE /chat/sessions/:id/delete/`
- `renameSession(id, title)` → `PATCH /chat/sessions/:id/rename/`
- `getMessages(sessionId, page)` → `GET /chat/sessions/:id/messages/?page=N`
- `sendMessage(data)` → **`fetch()` nativo con ReadableStream** a `POST /chat/`

#### [NEW] [services/compilerService.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/services/compilerService.js)

- `executeCode(sourceCode, language, version)` → `POST /compiler/execute/`

#### [NEW] [stores/auth.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/auth.js) (Pinia)

```
State:    { accessToken, refreshToken, user }
Actions:  login(), register(), logout(), fetchUser(), tryRefreshToken()
Getters:  isAuthenticated
```
- Tokens en `localStorage` para persistencia
- `fetchUser()` se lanza al arrancar la app

#### [NEW] [stores/chat.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/chat.js) (Pinia)

```
State:    { sessions[], activeSessionId, messages[], isStreaming, streamBuffer }
Actions:  fetchSessions(), createSession(), deleteSession(), renameSession(),
          fetchMessages(id), sendMessage(prompt, codeContext, lastOutput, lang)
Getters:  activeSession, activeMessages, sortedSessions
```
- `sendMessage()` consume SSE via `fetch()`, acumula tokens en `streamBuffer`, al recibir `[DONE]` mueve a `messages[]`

#### [NEW] [stores/editor.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/stores/editor.js) (Pinia)

```
State:    { sourceCode, language, version, stdout, stderr, exitCode, isExecuting, terminalVisible }
Actions:  executeCode(), toggleTerminal(), setLanguage(), clearTerminal()
```

#### [NEW] [composables/useSSE.js](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/composables/useSSE.js)

Composable reutilizable para consumir SSE via `fetch()` + `ReadableStream`:
- Recibe URL, body, headers
- Parsea líneas `data: {...}` → callback por token
- Gestiona `[DONE]`, errores, abort via `AbortController`

---

## Fase 4: Pantalla de Login / Registro

#### [NEW] [views/LoginView.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/views/LoginView.vue)

Siguiendo el brief:
- Fondo oscuro, centrado vertical/horizontal
- Logo (cara+prompt) en `#94618E`
- Slogan: *"Tu código. Tus pistas. Tu aprendizaje."*
- Tabs Login / Registro
- Botón primario `bg-primary text-text-on-primary`
- Links en `text-primary`
- Manejo de errores `{error, details}` del backend

#### [NEW] Componentes auth
- `LoginForm.vue` — Email + Password + "Iniciar Sesión"
- `RegisterForm.vue` — Username + Email + Password + Confirmar (Djoser `re_password`)

---

## Fase 5: Dashboard — Layout con Paneles Resizables

#### [NEW] [views/DashboardView.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/views/DashboardView.vue)

```
┌─────────────┬──────────────────────┬──────────────────┐
│   Sidebar   │  Editor + Terminal   │      Chat        │
│  (#1A1515)  │    (#1E1E1E)         │   (#262624)      │
│  280/64px   │   resizable ←→       │   resizable      │
└─────────────┴──────────────────────┴──────────────────┘
```

- Sidebar colapsable (280px ↔ 64px)
- Paneles editor/chat resizables con drag handle
- Editor+terminal puede ocultarse (solo chat)

#### [NEW] [components/layout/AppSidebar.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/layout/AppSidebar.vue)

- Logo arriba
- Botón "Nueva Conversación" `bg-primary`
- Lista sesiones con `last_message` truncado
- Sesión activa resaltada
- Menú contextual: Renombrar / Eliminar
- Abajo: Perfil + Cerrar Sesión
- Skeleton loaders

#### [NEW] [components/layout/ResizablePanel.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/layout/ResizablePanel.vue)

Panel genérico resizable con pointer events para resize fluido.

---

## Fase 6: Chat — Streaming SSE + Markdown

#### [NEW] [components/chat/ChatPanel.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/ChatPanel.vue)

Header con título de sesión (editable) + MessageList + ChatInput.

#### [NEW] [components/chat/MessageBubble.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/MessageBubble.vue)

- **Assistant**: izquierda, borde `primary`, avatar Sócrates
- **User**: derecha, fondo `surface-bubble-user`
- Markdown via `marked` + syntax highlighting via `highlight.js`
- Botón "Copiar código" en code blocks
- Mensajes moderados con estilo especial

#### [NEW] [components/chat/ChatInput.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/ChatInput.vue)

- Textarea autoexpandible, fondo `surface-input`
- Enviar con botón `bg-primary` o `Ctrl+Enter`
- Deshabilitado durante streaming
- Envía automáticamente `code_context` y `last_output` del editor store

#### [NEW] [components/chat/TypingIndicator.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/TypingIndicator.vue)

Tres puntos animados con keyframes CSS.

#### [NEW] [components/chat/MessageList.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/chat/MessageList.vue)

Lista scrollable. Auto-scroll al final cuando llegan tokens SSE. Scroll up para cargar mensajes anteriores (paginación).

---

## Fase 7: Editor de Código + Terminal

#### [NEW] [components/editor/CodeEditor.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/editor/CodeEditor.vue)

- Monaco Editor via `@monaco-editor/loader`
- Tema oscuro nativo de Monaco (no custom — brief)
- Fira Code con ligaduras
- Lazy loaded con `defineAsyncComponent` + fallback spinner
- Selector de lenguaje dropdown

#### [NEW] [components/editor/TerminalOutput.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/editor/TerminalOutput.vue)

- Debajo del editor, toggle abierto/cerrado
- `stdout` en blanco, `stderr` en `color-error`
- Exit code visible
- Botón "EJECUTAR" flotante `bg-primary`

#### [NEW] [components/editor/LanguageSelector.vue](file:///home/ignacio/Escritorio/SocratiCode/frontend/src/components/editor/LanguageSelector.vue)

Dropdown: Python 3.10.0, C, JavaScript (hardcoded inicialmente).

---

## Fase 8: Polish y UX

- `<Transition>` de Vue en sidebar expand/collapse y cambio de chat
- Skeleton loaders para carga de sesiones y mensajes
- Auto-scroll al final del chat con tokens SSE
- Responsive: sidebar → drawer en móvil, editor/chat en stack vertical
- Favicon + meta tags
- Toast/snackbar para errores de red
- Componentes UI base: `AppButton`, `AppInput`, `SkeletonLoader`, `AppModal`

---

## Arquitectura de Carpetas Final

```
SocratiCode/
├── .env
├── .gitignore
├── docker-compose.yml
├── pyproject.toml
├── README.md
│
├── backend/                       # (antes src/)
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   └── apps/
│       ├── chat/
│       ├── compiler/
│       └── users/
│
├── frontend/                      # [NEW]
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── assets/
│       │   ├── css/
│       │   │   ├── theme.css      # 🎨 DESIGN TOKENS
│       │   │   ├── base.css
│       │   │   └── main.css
│       │   ├── fonts/
│       │   │   ├── Inter-*.woff2
│       │   │   └── FiraCode-*.woff2
│       │   └── images/
│       ├── router/
│       │   └── index.js
│       ├── stores/
│       │   ├── auth.js
│       │   ├── chat.js
│       │   └── editor.js
│       ├── composables/
│       │   └── useSSE.js
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── chatService.js
│       │   └── compilerService.js
│       ├── views/
│       │   ├── LoginView.vue
│       │   └── DashboardView.vue
│       └── components/
│           ├── layout/
│           ├── auth/
│           ├── chat/
│           ├── editor/
│           └── ui/
│
├── marca/
└── docs/
```

---

## Verification Plan

### Fase 0 (Renombrado)
```bash
cd backend && uv run python manage.py check      # Django system check
uv run python manage.py test                       # Tests existentes pasan
```

### Fase 1 (Scaffolding)
```bash
cd frontend && npm run dev                         # Vite arranca sin errores
```

### Fase 2 (Design Tokens)
- Verificar en DevTools que `bg-primary` aplica `#94618E`
- Cambiar `--color-primary` en `theme.css` → confirmar que toda la app se actualiza

### Integración completa
- Login → Dashboard → Crear sesión → Enviar mensaje → Streaming token a token → Ejecutar código
- Verificar lazy loading de Monaco (pestaña Network)
- Verificar responsive en móvil
