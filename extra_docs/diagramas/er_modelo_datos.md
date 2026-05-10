# Figura 3-4: Diagrama Entidad-Relación — Modelo de Datos

Modelo de datos de SocratiCode extraído de los modelos Django (`apps/chat/models.py`, `apps/users/models.py`).

```mermaid
erDiagram
    User {
        int id PK
        string username UK
        string email
        string password
        string bio "nullable"
        string theme "light | dark (default: dark)"
        boolean is_staff "default: False"
        boolean is_active "default: True"
        datetime date_joined
    }

    ChatSession {
        int id PK
        int user_id FK
        string title "max 200 chars (default: Nueva conversacion)"
        datetime created_at "auto_now_add"
        datetime updated_at "auto_now"
    }

    Message {
        int id PK
        int session_id FK
        string role "user | assistant | system"
        text content
        boolean moderated "default: False"
        datetime created_at "auto_now_add"
    }

    SystemConfig {
        int id PK "Siempre 1 (Singleton)"
        string moderation_mode "both | input | output | none"
        string llm_model "default: llama3.2"
        string moderation_model "default: llama3.2"
    }

    User ||--o{ ChatSession : "posee"
    ChatSession ||--o{ Message : "contiene"
    SystemConfig }o--o| SystemConfig : "Singleton (pk=1)"
```

## Notas sobre el modelo

| Entidad        | Particularidad                                                                                                                                         |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `User`         | Extiende `AbstractUser` de Django. Añade campos `bio` (TextField nullable) y `theme` (CharField con choices `light`/`dark`). Modelo intercambiable vía `AUTH_USER_MODEL = 'users.User'`. |
| `ChatSession`  | Relación `ForeignKey` a `User` con `on_delete=CASCADE` y `related_name='chat_sessions'`. El campo `updated_at` se actualiza manualmente en `_auto_name_and_touch()` para reflejar la actividad real. |
| `Message`      | Relación `ForeignKey` a `ChatSession` con `on_delete=CASCADE` y `related_name='messages'`. El campo `moderated` indica si el mensaje fue bloqueado por el sistema de moderación. |
| `SystemConfig` | Implementa el patrón Singleton: `save()` fuerza `pk=1`, `get()` usa `get_or_create(pk=1)`. No tiene relación con otras entidades; es una tabla de configuración global consultada en cada petición de chat. |
