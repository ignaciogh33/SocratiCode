# SocratiCode

LLM como tutor socrático para el aprendizaje de programación.

## Requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes)
- Docker (para PostgreSQL y Piston)
- Ollama con el modelo `llama3.2`

## Instalación

```bash
# 1. Instalar dependencias
uv sync

# 2. Levantar servicios (PostgreSQL + Piston)
docker compose up -d

# 3. Aplicar migraciones
uv run python src/manage.py migrate

# 4. Crear superusuario
uv run python src/manage.py createsuperuser

# 5. Arrancar el servidor
uv run python src/manage.py runserver
```

El servidor estará disponible en `http://127.0.0.1:8000/`.

---

## API Endpoints

### 🤖 Chat (Tutor Socrático)

> **Nota:** Todos los endpoints de chat requieren autenticación JWT (`Authorization: Bearer <access_token>`).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/chat/` | Enviar un mensaje al tutor socrático |
| `GET` | `/api/chat/sessions/` | Listar las sesiones de chat del usuario autenticado |
| `POST` | `/api/chat/sessions/create/` | Crear una nueva sesión de chat vacía |
| `GET` | `/api/chat/sessions/<id>/` | Obtener detalle de una sesión con todos sus mensajes |
| `DELETE` | `/api/chat/sessions/<id>/delete/` | Eliminar una sesión y sus mensajes |
| `PATCH` | `/api/chat/sessions/<id>/rename/` | Renombrar una sesión de chat |

#### Enviar mensaje

**Body (JSON):**

```json
{
    "session_id": 1,
    "prompt": "¿Cómo funcionan los bucles for en Python?"
}
```

> Si no se envía `session_id`, se crea automáticamente una nueva sesión para el usuario.

**Respuesta (200 OK):**

```json
{
    "response": "Respuesta del tutor socrático...",
    "session_id": 1
}
```

#### Listar sesiones

`GET /api/chat/sessions/`

**Respuesta (200 OK):**

```json
[
    {
        "id": 2,
        "title": "Bucles en Python",
        "created_at": "2026-03-18T00:30:00Z",
        "last_message": "¿Cómo funcionan los bucles for en Python?"
    },
    {
        "id": 1,
        "title": "Funciones recursivas",
        "created_at": "2026-03-17T20:00:00Z",
        "last_message": "Explícame qué es una función recursiva..."
    }
]
```

#### Crear sesión

`POST /api/chat/sessions/create/`

**Respuesta (201 Created):**

```json
{
    "id": 3,
    "title": "Nueva conversación",
    "created_at": "2026-03-18T00:35:00Z",
    "last_message": null
}
```

#### Detalle de sesión (con mensajes)

`GET /api/chat/sessions/1/`

**Respuesta (200 OK):**

```json
{
    "id": 1,
    "title": "Funciones recursivas",
    "created_at": "2026-03-17T20:00:00Z",
    "messages": [
        {
            "id": 1,
            "role": "user",
            "content": "¿Qué es una función recursiva?",
            "created_at": "2026-03-17T20:00:05Z"
        },
        {
            "id": 2,
            "role": "assistant",
            "content": "Buena pregunta. ¿Conoces algún proceso que se repita a sí mismo?",
            "created_at": "2026-03-17T20:00:08Z"
        }
    ]
}
```

#### Eliminar sesión

`DELETE /api/chat/sessions/1/delete/`

**Respuesta:** `204 No Content`

#### Renombrar sesión

`PATCH /api/chat/sessions/1/rename/`

**Body (JSON):**

```json
{
    "title": "Bucles en Python"
}
```

**Respuesta (200 OK):**

```json
{
    "id": 1,
    "title": "Bucles en Python",
    "created_at": "2026-03-17T20:00:00Z",
    "last_message": "¿Cómo funcionan los bucles for en Python?"
}
```

---

### 🔐 Autenticación (JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/jwt/create/` | Login: devuelve `access` y `refresh` tokens |
| `POST` | `/api/auth/jwt/refresh/` | Renovar el `access` token usando el `refresh` |
| `POST` | `/api/auth/jwt/verify/` | Verificar si un `access` token sigue siendo válido |

**Login (JSON):**

```json
{
    "username": "alumno1",
    "password": "MiPassword123!"
}
```

**Respuesta (200 OK):**

```json
{
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 👤 Gestión de Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/users/` | Registro de usuario nuevo |
| `GET` | `/api/auth/users/me/` | Ver perfil del usuario autenticado |
| `PUT/PATCH` | `/api/auth/users/me/` | Editar perfil del usuario autenticado |
| `DELETE` | `/api/auth/users/me/` | Eliminar cuenta propia |
| `POST` | `/api/auth/users/set_password/` | Cambiar contraseña |

**Registro (JSON):**

```json
{
    "username": "alumno1",
    "email": "alumno1@ejemplo.com",
    "password": "MiPassword123!",
    "re_password": "MiPassword123!"
}
```

**Cambiar contraseña (JSON):**

```json
{
    "current_password": "MiPassword123!",
    "new_password": "NuevaPassword456!"
}
```

> **Nota:** Todos los endpoints que requieren autenticación necesitan la cabecera `Authorization: Bearer <access_token>`.

---

## Comandos Básicos de Ollama

| Acción | Comando en Terminal |
|---|---|
| **Ver modelos instalados** | `ollama list` |
| **Comprobar si hay modelos corriendo**| `ollama ps` |
| **Arrancar/Probar un modelo en consola**| `ollama run llama3.2` |
| **Parar temporalmente un modelo** | `ollama stop llama3.2` |
| **Iniciar servicio general (Linux)** | `sudo systemctl start ollama` |
| **Detener servicio general (Linux)** | `sudo systemctl stop ollama` |

---

## Panel de Administración

Accede a `http://127.0.0.1:8000/admin/` con las credenciales de superusuario para gestionar usuarios, sesiones de chat y mensajes.