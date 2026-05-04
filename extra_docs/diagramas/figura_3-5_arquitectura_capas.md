# Figura 3-5: Diagrama de Arquitectura — Separación en Capas

Arquitectura completa de SocratiCode mostrando la separación en capas y los servicios externos contenerizados.

```mermaid
flowchart TD
    subgraph PRESENTACION["🖥️ Capa de Presentación (Frontend)"]
        direction TB
        VUE["<b>Vue.js 3</b><br/>Vite + Vue Router + Pinia"]
        
        subgraph VIEWS["Vistas"]
            LOGIN["LoginView"]
            DASH["DashboardView"]
            PROFILE["ProfileView"]
        end

        subgraph COMPONENTS["Componentes"]
            CHAT_UI["Chat UI<br/>(MessageBubble, ChatInput)"]
            EDITOR_UI["Editor de Código<br/>(CodeEditor, OutputPanel)"]
            SIDEBAR["Sidebar<br/>(SessionList)"]
        end

        subgraph SERVICES["Servicios (API Client)"]
            API_SVC["api.js<br/>(Axios + JWT Interceptor)"]
            CHAT_SVC["chatService.js<br/>(SSE Streaming via fetch)"]
            COMP_SVC["compilerService.js"]
            AUTH_SVC["authService.js"]
        end

        VUE --> VIEWS
        VUE --> COMPONENTS
        VIEWS --> SERVICES
        COMPONENTS --> SERVICES
    end

    subgraph API["⚙️ Capa de API (Backend)"]
        direction TB
        DJANGO["<b>Django 6.0 + DRF</b><br/>ASGI (uvicorn)"]

        subgraph APPS["Django Apps"]
            CHAT_APP["<b>apps.chat</b><br/>chat_view (async SSE)<br/>CRUD sesiones<br/>Moderación dual"]
            COMP_APP["<b>apps.compiler</b><br/>execute_code<br/>(proxy a Piston)"]
            USER_APP["<b>apps.users</b><br/>User model extendido<br/>(bio, theme)"]
        end

        subgraph AUTH["Autenticación"]
            DJOSER["Djoser<br/>(registro, perfil)"]
            JWT["SimpleJWT<br/>(access 1d, refresh 7d)"]
        end

        subgraph CONFIG["Configuración"]
            SINGLETON["SystemConfig<br/>(Singleton pk=1)"]
            PROMPTS["prompts.py<br/>(SYSTEM_PROMPT,<br/>INPUT/OUTPUT_MODERATION)"]
            EXCEPT["exceptions.py<br/>(error handler unificado)"]
            PAGINATION["pagination.py<br/>(Session: 15, Message: 50)"]
        end

        DJANGO --> APPS
        DJANGO --> AUTH
        DJANGO --> CONFIG
        CHAT_APP --> SINGLETON
        CHAT_APP --> PROMPTS
    end

    subgraph PERSISTENCIA["💾 Capa de Persistencia"]
        PG[("fa:fa-database <b>PostgreSQL 15</b><br/>Docker: tutor_db<br/>Puerto: 5433:5432<br/>Volumen: postgres_data")]
    end

    subgraph EXTERNOS["🐳 Servicios Externos (Docker)"]
        direction LR
        OLLAMA["<b>Ollama</b><br/>(IA Local)<br/>Modelos: llama3.2, etc.<br/>Puerto: 11434"]
        PISTON["<b>Piston</b><br/>(Sandbox Ejecución)<br/>Docker: tutor_compiler<br/>Puerto: 2000<br/>tmpfs: /piston/jobs, /tmp"]
    end

    %% Conexiones entre capas
    SERVICES -->|"HTTP/JSON<br/>JWT Bearer<br/>Vite Proxy :5173→:8000"| DJANGO
    CHAT_SVC -->|"SSE Stream<br/>(fetch + ReadableStream)"| CHAT_APP
    COMP_SVC -->|"POST /api/compiler/execute/"| COMP_APP
    AUTH_SVC -->|"POST /api/auth/..."| AUTH

    DJANGO -->|"ORM<br/>Django Models"| PG

    CHAT_APP -->|"ollama.AsyncClient()<br/>stream=True<br/>(Tutor + Moderación)"| OLLAMA
    COMP_APP -->|"requests.post()<br/>POST /api/v2/execute<br/>timeout=30s"| PISTON

    %% Estilos
    style PRESENTACION fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    style API fill:#FFF3E0,stroke:#E65100,stroke-width:2px
    style PERSISTENCIA fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    style EXTERNOS fill:#FCE4EC,stroke:#C62828,stroke-width:2px

    style PG fill:#E8F5E9,stroke:#2E7D32
    style OLLAMA fill:#F3E5F5,stroke:#6A1B9A
    style PISTON fill:#FFF9C4,stroke:#F57F17
```

## Descripción de las Capas

| Capa                  | Tecnología                         | Responsabilidad                                                                                                                   |
|-----------------------|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| **Presentación**      | Vue.js 3 + Vite                    | Interfaz de usuario SPA. Gestión de estado con Pinia, enrutamiento con Vue Router, comunicación SSE con `fetch()` nativo y REST con Axios. |
| **API**               | Django 6.0 + DRF + ASGI (uvicorn)  | Lógica de negocio: endpoints REST, streaming asíncrono SSE, moderación dual (input síncrona + output async), autenticación JWT con Djoser. |
| **Persistencia**      | PostgreSQL 15 (Docker)             | Almacenamiento relacional de usuarios, sesiones, mensajes y configuración. Acceso exclusivo vía Django ORM.                        |
| **Servicios Externos**| Ollama + Piston (Docker)           | Ollama: inferencia LLM local (tutor socrático + moderación de contenido). Piston: ejecución aislada de código en sub-contenedores con almacenamiento efímero (tmpfs). |

## Flujo de Comunicación

| Origen → Destino              | Protocolo / Mecanismo                                                    |
|-------------------------------|--------------------------------------------------------------------------|
| Vue → Django                  | HTTP/JSON vía Vite proxy (`:5173` → `:8000`). JWT Bearer en headers.     |
| Vue → Django (chat)           | SSE vía `fetch()` + `ReadableStream`. Tokens enviados como `data: {...}`. |
| Django → PostgreSQL           | Django ORM (conexión configurada en `DATABASE_URL`).                      |
| Django → Ollama (tutor)       | `ollama.AsyncClient().chat(stream=True)` — streaming async token a token. |
| Django → Ollama (moderación)  | `ollama.chat(stream=False)` (input) / `ollama.AsyncClient().chat(stream=False)` (output). |
| Django → Piston               | `requests.post()` — HTTP/JSON síncrono a `PISTON_URL/api/v2/execute`.    |
