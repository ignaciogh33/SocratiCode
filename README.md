<div align="center">
  <img src="frontend/src/assets/images/logo-circular.svg" alt="SocratiCode logo" width="120"/>

  # SocratiCode

  **A Socratic programming tutor powered by a local LLM**

  ![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)
  ![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat-square&logo=django&logoColor=white)
  ![Vue](https://img.shields.io/badge/Vue-3-42b883?style=flat-square&logo=vue.js&logoColor=white)
  ![Ollama](https://img.shields.io/badge/Ollama-local-black?style=flat-square)
  ![Docker](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker&logoColor=white)
  ![Backend tests](https://img.shields.io/badge/backend%20tests-105%20%E2%80%94%2099%25%20coverage-brightgreen?style=flat-square)
  ![Frontend tests](https://img.shields.io/badge/frontend%20tests-345%20%E2%80%94%2091.6%25%20coverage-brightgreen?style=flat-square)

</div>

---

> *"I cannot teach anybody anything. I can only make them think."* — Socrates

SocratiCode is a web platform for programming tutoring that refuses to solve exercises for the student. Instead, it uses a locally-hosted language model, instructed through prompt engineering, to act as a Socratic tutor: it replies with targeted questions that guide the student toward discovering the error and the solution on their own. Under no circumstances will it provide corrected code.

No cloud APIs. No academic data sent to third parties. Runs entirely on your own infrastructure.

---

## What it looks like

<div align="center">
  <img src="docs/pantallas/pantalla_ejemplo.png" alt="SocratiCode main interface" width="90%"/>
  <br/>
  <em>Editor, terminal output, and Socratic chat — all on a single screen.</em>
</div>

<br/>

<div align="center">
  <img src="docs/pantallas/pantalla_centrado_codigo.png" alt="Editor expanded" width="45%"/>
  &nbsp;
  <img src="docs/pantallas/pantalla_centrado_chat.png" alt="Chat expanded" width="45%"/>
</div>

---

## Core features

| Feature | Description |
|---|---|
| **Socratic dialogue** | The tutor never gives solutions. It asks questions, highlights inconsistencies, and guides discovery |
| **Local LLM** | Runs via [Ollama](https://ollama.com) — no external API calls, no data leakage |
| **Real-time streaming** | Responses stream token by token over Server-Sent Events (SSE) |
| **Sandboxed code execution** | Student code runs inside isolated containers via [Piston](https://github.com/engineer-man/piston) |
| **Dual moderation** | Input moderation (fail-closed) blocks injections and off-topic requests; output moderation (fail-open) runs in parallel without blocking the stream |
| **Code context** | The editor's code and execution output are automatically sent to the tutor as context |
| **Session history** | Conversations are persisted and resumable across sessions |
| **JWT authentication** | Stateless auth with access/refresh tokens via Djoser + simplejwt |
| **Admin panel** | Configurable moderation parameters through Django Admin |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│          Vue 3 · Pinia · Monaco Editor · Tailwind           │
└────────────┬───────────────────────────────┬────────────────┘
             │  REST / SSE                   │  REST
             ▼                               ▼
┌────────────────────────┐      ┌────────────────────────────┐
│   Django + DRF (ASGI)  │      │        Piston API          │
│   JWT · Djoser · ADRF  │      │  (sandboxed code runner)   │
└────────┬───────────────┘      └────────────────────────────┘
         │
         ├──► PostgreSQL  (session & message persistence)
         │
         └──► Ollama      (local LLM inference, SSE streaming)
```

The frontend is a single-page application — chat context and editor state are never lost on navigation. The backend runs fully async (ASGI + ADRF) to support concurrent SSE streams without blocking.

---

## Tech stack

**Backend**
- [Django 6](https://djangoproject.com) + [Django REST Framework](https://django-rest-framework.org) — API layer
- [ADRF](https://github.com/em1208/adrf) — async Django views and viewsets
- [Ollama Python client](https://github.com/ollama/ollama-python) — async LLM streaming
- [Djoser](https://djoser.readthedocs.io) + [simplejwt](https://django-rest-framework-simplejwt.readthedocs.io) — JWT authentication
- [PostgreSQL 15](https://postgresql.org) — relational database
- [Uvicorn](https://www.uvicorn.org) — ASGI server

**Frontend**
- [Vue 3](https://vuejs.org) + [Vite](https://vitejs.dev) — SPA framework and build tool
- [Pinia](https://pinia.vuejs.org) — reactive state management
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code-grade code editor in the browser
- [Tailwind CSS](https://tailwindcss.com) — utility-first styling
- [marked](https://marked.js.org) + [highlight.js](https://highlightjs.org) — Markdown rendering with syntax highlighting
- [Axios](https://axios-http.com) — HTTP client

**Infrastructure**
- [Ollama](https://ollama.com) — local LLM inference server
- [Piston](https://github.com/engineer-man/piston) — sandboxed multi-language code execution (Docker)
- [Docker Compose](https://docs.docker.com/compose/) — PostgreSQL + Piston orchestration
- [uv](https://github.com/astral-sh/uv) — fast Python dependency and environment manager

---

## Getting started

### Prerequisites

- Python 3.12+ with [uv](https://github.com/astral-sh/uv)
- Node.js 20+ with npm
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Ollama](https://ollama.com) installed and running locally

### 1. Clone the repository

```bash
git clone https://github.com/ignaciogh33/SocratiCode.git
cd SocratiCode
```

### 2. Configure environment variables

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgres://admin:secret@localhost:5433/tutor_django
PISTON_URL=http://localhost:2000
LLM_MOD=True
```

### 3. Start infrastructure (database + code runner)

```bash
docker compose up -d
```

Install the Python runtime inside the Piston container:

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'
```

### 4. Start the LLM

```bash
ollama run llama3.2
```

### 5. Set up the backend

```bash
# Install Python dependencies
uv sync

# Run migrations and create admin user
cd backend
uv run python manage.py migrate
uv run python manage.py createsuperuser

# Start the ASGI server (required for SSE streaming)
uv run uvicorn config.asgi:application --reload --port 8000
```

### 6. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API reference

All endpoints except login and registration require a JWT token:
```
Authorization: Bearer <access_token>
```

### Chat (Socratic tutor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat/` | Send a message — returns an SSE stream |
| `GET` | `/api/chat/sessions/` | List sessions (paginated, 15 per page) |
| `POST` | `/api/chat/sessions/create/` | Create a new empty session |
| `GET` | `/api/chat/sessions/<id>/messages/` | Get message history (paginated, 50 per page) |
| `DELETE` | `/api/chat/sessions/<id>/delete/` | Delete session and all its messages |
| `PATCH` | `/api/chat/sessions/<id>/rename/` | Rename a session |

**Streaming request body:**
```json
{
  "session_id": 1,
  "prompt": "Why does this loop run forever?",
  "code_context": "while True:\n    pass",
  "last_output": "",
  "language": "python"
}
```

**Streaming response** (`text/event-stream`):
```
data: {"token": "What"}
data: {"token": " condition"}
data: {"token": " would"}
...
data: {"session_id": 1}
data: [DONE]
```

### Code execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/compiler/execute/` | Run code in an isolated Piston sandbox |

```json
{
  "source_code": "print('Hello, world!')",
  "language": "python",
  "version": "3.10.0"
}
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/users/` | Register |
| `POST` | `/api/auth/jwt/create/` | Login — returns access + refresh tokens |
| `POST` | `/api/auth/jwt/refresh/` | Refresh access token |
| `GET` | `/api/auth/users/me/` | Get own profile |
| `PATCH` | `/api/auth/users/me/` | Update profile (username, bio) |
| `POST` | `/api/auth/users/set_password/` | Change password |
| `POST` | `/api/auth/users/reset_password/` | Request password reset email |

---

## Testing

```bash
# Backend (Django)
cd backend
uv run python manage.py test
# or with coverage
uv run coverage run manage.py test && uv run coverage report

# Frontend (Vitest)
cd frontend
npm test
# with coverage
npm run test:coverage
```

| | Tests | Coverage |
|---|---|---|
| Backend | 105 | 99% |
| Frontend | 345 | 91.6% |

---

## Project structure

```
SocratiCode/
├── backend/
│   ├── apps/
│   │   ├── chat/          # Socratic tutor — SSE streaming, sessions, moderation
│   │   ├── compiler/      # Piston integration — sandboxed code execution
│   │   └── users/         # Custom user model, profile management
│   └── config/            # Django settings, ASGI, URL routing
├── frontend/
│   └── src/
│       ├── components/    # ChatInput, MessageList, CodeEditor, Sidebar...
│       ├── stores/        # Pinia stores (auth, chat, editor)
│       ├── views/         # Main, Login, Register, Profile, Admin
│       └── services/      # Axios API layer
├── docker-compose.yml     # PostgreSQL + Piston
└── pyproject.toml         # Python dependencies (managed with uv)
```

---

## Academic context

SocratiCode was developed as a Bachelor's Thesis (TFG) at the **Escuela Politécnica Superior, Universidad Autónoma de Madrid**, under the supervision of Óscar Delgado Ben Mohatar.

**Ignacio García Hernanz** — [ignaciogh33@gmail.com](mailto:ignaciogh33@gmail.com)
