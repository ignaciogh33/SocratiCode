# Tests del Chat

## Cómo ejecutar

```bash
uv run python src/manage.py test apps.chat
```

## Tests del modelo (`ChatSessionModelTest`)

| Test | Qué comprueba |
|------|--------------|
| `test_create_session` | Crear una sesión la asocia al usuario y el título es *"Nueva conversación"* |
| `test_delete_user_cascades_sessions` | Al borrar un usuario se borran sus sesiones (`CASCADE`) |
| `test_delete_session_cascades_messages` | Al borrar una sesión se borran sus mensajes (`CASCADE`) |

## Tests de endpoints (`ChatSessionEndpointTest`)

| Test | Qué comprueba |
|------|--------------|
| `test_unauthenticated_request_returns_401` | Sin token → **401** en todos los endpoints |
| `test_create_session` | `POST /sessions/create/` → crea sesión con título por defecto |
| `test_list_sessions_only_own` | Solo ves **tus** sesiones, no las de otro usuario |
| `test_session_detail_returns_messages` | `GET /sessions/<id>/` → devuelve la sesión con sus mensajes |
| `test_session_detail_other_user_returns_404` | Intentar ver sesión ajena → **404** |
| `test_delete_session` | `DELETE` borra la sesión |
| `test_delete_other_user_session_returns_404` | Intentar borrar sesión ajena → **404** (y no se borra) |
| `test_rename_session` | `PATCH` cambia el título correctamente |
| `test_rename_empty_title_returns_400` | Título vacío → **400** |
| `test_rename_other_user_session_returns_404` | Renombrar sesión ajena → **404** |
