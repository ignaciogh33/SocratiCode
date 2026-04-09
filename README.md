# SocratiCode

Plataforma educativa interactiva donde un LLM actúa como tutor socrático para la enseñanza de programación. 

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura desacoplada:
- **Backend (API REST + SSE)**: Desarrollado en Django y Django REST Framework. Funciona de manera asíncrona mediante ASGI para soportar flujos continuos.
- **Motor de IA**: Usa Ollama en local con el modelo `llama3.2` para streaming de respuestas token a token.
- **Ejecución de Código Aislado**: Motor Piston ejecutado en Docker (ejecución segura de código arbitrario).
- **Frontend *(En Preparación)***: Aplicación SPA basada en Vue y Vite (se alojará separada del core de Django).

---

## 🚀 Requisitos e Instalación Local

### 1. Dependencias Base
- Python 3.12+ con el gestor de paquetes [uv](https://docs.astral.sh/uv/)
- Docker y Docker Compose
- [Ollama](https://ollama.ai/) instalado localmente con el modelo `llama3.2` (`ollama run llama3.2`)

### 2. Variables de Entorno (`.env`)
Antes de levantar el backend, debes crear un archivo `.env` dentro de la carpeta `backend/` para proteger las credenciales:
```env
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=True
DATABASE_URL=postgres://admin:secret@localhost:5433/tutor_django
PISTON_URL=http://localhost:2000
LLM_MOD=True
```

### 3. Despliegue Rápido
Desde la raíz del proyecto (`/SocratiCode`):
```bash
# 1. Instalar dependencias de Python
uv sync

# 2. Levantar servicios locales (PostgreSQL + Piston API)
docker compose up -d

# 3. Instalar runtime de Python dentro del contenedor de Piston
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'

# 4. Aplicar migraciones y crear superusuario
cd backend
uv run python manage.py migrate
uv run python manage.py createsuperuser

# 5. Arrancar el servidor en modo ASGI (Necesario para SSE)
uv run uvicorn config.asgi:application --reload --port 8000
```

---

## 📚 API Endpoints

> **Atención:** Todos los endpoints (excepto los de Login/Registro base) requieren autenticación mediante cabecera HTTP: `Authorization: Bearer <access_token>`.

### 🚨 Formato de Errores Estandarizado
Toda la API (incluyendo autenticación) captura excepciones y devuelve un formato de error predecible para facilitar el desarrollo del frontend:
```json
{
  "error": "Mensaje principal del problema.",
  "details": {
    "campo_especifico": ["Detalle del error de validación"]
  }
}
```

---

### 🤖 Chat (Tutor Socrático)

Flujo de streaming en tiempo real (Server-Sent Events) y gestión paginada del historial de chat.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/chat/` | Enviar mensaje y recibir streaming SSE |
| `GET` | `/api/chat/sessions/` | Listar sesiones *(Paginadas a 15 items)* |
| `POST` | `/api/chat/sessions/create/` | Crear una sesión vacía |
| `GET` | `/api/chat/sessions/<id>/` | Obtener datos base de una sesión |
| `GET` | `/api/chat/sessions/<id>/messages/` | Obtener historial de mensajes *(Paginados a 50, más recientes primero)* |
| `DELETE` | `/api/chat/sessions/<id>/delete/` | Borrar sesión |
| `PATCH` | `/api/chat/sessions/<id>/rename/` | Renombrar sesión |

#### Petición de Streaming (`POST /api/chat/`)
El frontend envía el prompt actual, y opcionalmente, el contexto extraído del editor del estudiante.
```json
{
    "session_id": 1,
    "prompt": "¿Por qué falla este bucle en C?",
    "code_context": "for(int i=0; i<10; i--) { ... }",
    "last_output": "Segmentation Fault",
    "language": "c"
}
```
**Respuesta:** Flujo constante de eventos `text/event-stream`.
```text
data: {"token": "P"}
data: {"token": "ar"}
data: {"token": "ece"}
...
data: {"session_id": 1}
data: [DONE]
```

### ⚖️ Moderación de Input de Seguridad
Antes de que el modelo principal analice y responda, el input del usuario y su código atraviesan una capa síncrona de revisión (`moderate_input`). Si se detecta lenguaje obsceno, peticiones peligrosas o intentos de inyección maliciosa (Prompt Injection), la API bloquea el input y responde amablemente interrumpiendo el flujo normal.

---

### ⚙️ Ejecución de Código (Piston)

Ejecuta el código del alumno en *sandboxes* aislados para evitar vulnerabilidades en el host.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/compiler/execute/` | Envía código fuente a Piston y devuelve stdout/stderr |

**Body:**
```json
{
    "source_code": "print('Hola a todos')",
    "language": "python",
    "version": "3.10.0"
}
```

---

### 🔐 Autenticación y Manejo de Usuarios (JWT)
Gestión delegada a la libería Djoser.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/users/` | Registrarse |
| `POST` | `/api/auth/jwt/create/` | Login (Obtener Token) |
| `POST` | `/api/auth/jwt/refresh/` | Renovar Token |
| `GET` | `/api/auth/users/me/` | Perfil propio |

---

## 💡 Comandos de Ayuda Comunes

**Ollama:**
- Reiniciar servicio (Linux): `sudo systemctl restart ollama`
- Ver qué corre: `ollama ps`

**Django:**
- Actualizar base de datos: `uv run python manage.py migrate`
- Tests: `uv run python manage.py test`

**Docker Piston:**
- Ver logs de compilación: `docker logs piston`
- Comprobar lenguajes: `curl http://localhost:2000/api/v2/runtimes`