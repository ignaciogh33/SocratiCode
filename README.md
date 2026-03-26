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

# 3. Instalar runtime de Python en Piston
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'

# 4. Aplicar migraciones
uv run python src/manage.py migrate

# 5. Crear superusuario
uv run python src/manage.py createsuperuser

# 6. Arrancar el servidor
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
    "prompt": "¿Cómo funcionan los bucles for en Python?",
    "code_context": "for i in range(10):\n    print(i)",
    "last_output": "0\n1\n2\n...",
    "language": "python"
}
```

> Los campos `code_context`, `last_output` y `language` son **opcionales**. El frontend los envía automáticamente con el contenido actual del editor y la última salida de ejecución, para que el LLM tenga contexto del código del alumno sin que este tenga que copiarlo.

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
            "created_at": "2026-03-17T20:00:05Z",
            "moderated": false
        },
        {
            "id": 2,
            "role": "assistant",
            "content": "Buena pregunta. ¿Conoces algún proceso que se repita a sí mismo?",
            "created_at": "2026-03-17T20:00:08Z",
            "moderated": false
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

### ⚙️ Compilador (Piston)

> **Nota:** Requiere autenticación JWT (`Authorization: Bearer <access_token>`).

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/compiler/execute/` | Ejecutar código vía Piston |

#### Ejecutar código

**Body (JSON):**

```json
{
    "source_code": "print('hola mundo')",
    "language": "python3",
    "version": "3.10.0"
}
```

> Los campos `language` y `version` son obligatorios. Piston devuelve error 400 si no se envían.

**Respuesta (200 OK):**

```json
{
    "stdout": "hola mundo\n",
    "stderr": "",
    "exit_code": 0,
    "language": "python3"
}
```

**Errores posibles:**

| Código | Causa |
|--------|-------|
| `400` | `source_code` vacío o lenguaje no instalado en Piston |
| `503` | Piston no está arrancado |
| `504` | Timeout de ejecución |

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

## Comandos de Piston

| Acción | Comando |
|---|---|
| **Instalar un runtime** | `curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d '{"language": "python", "version": "3.10.0"}'` |
| **Listar runtimes instalados** | `curl http://localhost:2000/api/v2/runtimes` |
| **Probar ejecución directa** | `curl -X POST http://localhost:2000/api/v2/execute -H "Content-Type: application/json" -d '{"language": "python3", "version": "3.10.0", "files": [{"content": "print(42)"}]}'` |

> **Nota:** Piston corre en Docker con `privileged: true` y expone su API en el puerto `2000`. Los runtimes se instalan vía API REST, no por CLI.

---

## Moderación de Contenido

Todas las respuestas del LLM pasan por una capa de moderación antes de llegar al estudiante. El sistema usa el mismo modelo `llama3.2` con un system prompt independiente que evalúa si la respuesta es apropiada.

**Flujo:**

1. El LLM principal genera la respuesta con contexto socrático
2. Un segundo prompt (sin contexto de la conversación) evalúa si el contenido es apropiado
3. Si es apropiado → se envía al estudiante
4. Si no es apropiado o el moderador falla → se bloquea y se devuelve un mensaje predeterminado

> **Fail-safe:** Si el moderador falla (timeout, error), la respuesta se bloquea por defecto.

Los mensajes bloqueados se guardan con `moderated: true` para auditoría. Se pueden filtrar desde el panel de admin.

---

## Panel de Administración

Accede a `http://127.0.0.1:8000/admin/` con las credenciales de superusuario para gestionar usuarios, sesiones de chat y mensajes.

Desde el panel puedes filtrar mensajes por el campo **Moderated** para revisar los que fueron bloqueados por la capa de moderación.