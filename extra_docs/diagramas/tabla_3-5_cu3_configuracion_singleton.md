# Tabla 3-5: Caso de Uso CU3 — Configuración Global (Singleton) por el Administrador

| Campo              | Descripción                                                                                                                                                                                                                       |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Identificador**  | CU3                                                                                                                                                                                                                               |
| **Nombre**         | Configuración global del sistema (patrón Singleton)                                                                                                                                                                               |
| **Actor principal**| Administrador (usuario con `is_staff=True`)                                                                                                                                                                                       |
| **Actores secundarios** | —                                                                                                                                                                                                                            |
| **Descripción**    | El administrador accede al panel de Django Admin para configurar los parámetros globales del sistema: modelo LLM del tutor, modelo LLM de moderación y modo de moderación. La configuración se almacena en una única fila de la tabla `SystemConfig` (patrón Singleton). |
| **Precondiciones** | 1. El administrador tiene acceso al panel de Django Admin (`/admin/`). <br> 2. El usuario tiene permisos de staff (`is_staff=True`).                                                                                               |
| **Postcondiciones**| 1. La configuración queda persistida en la fila con `pk=1` de `SystemConfig`. <br> 2. Las peticiones de chat subsiguientes utilizarán los nuevos valores de forma inmediata (lectura en cada petición mediante `SystemConfig.get()`). |

## Flujo Principal (Happy Path)

| Paso | Actor         | Acción                                                                                                                                                                          |
|------|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1    | Administrador | Accede a `http://localhost:8000/admin/` e inicia sesión con credenciales de staff.                                                                                               |
| 2    | Sistema       | Muestra el panel de administración con la sección "Configuración del sistema".                                                                                                   |
| 3    | Administrador | Hace clic en "Configuración del sistema". El sistema redirige automáticamente al formulario de edición de la única fila existente (`changelist_view` → `redirect(pk/change/)`).  |
| 4    | Sistema       | Muestra el formulario organizado en dos fieldsets: <br> — **Moderación de contenido**: campo `moderation_mode` (desplegable: Input + Output, Solo Input, Solo Output, Desactivada). <br> — **Modelos LLM (Ollama)**: campos `llm_model` y `moderation_model` (texto libre, ej: `llama3.2`, `phi4-mini-reasoning`). |
| 5    | Administrador | Modifica los valores deseados y pulsa "Guardar".                                                                                                                                 |
| 6    | Sistema       | El método `save()` sobrescrito fuerza `self.pk = 1` antes de guardar, garantizando que solo exista una fila (Singleton). Persiste los cambios en PostgreSQL.                     |
| 7    | Sistema       | Muestra confirmación de guardado exitoso.                                                                                                                                        |

## Flujos Alternativos

| ID    | Condición                                          | Acción del sistema                                                                                                                                                        |
|-------|----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FA-01 | No existe configuración previa                     | El método de clase `SystemConfig.get()` (invocado por `changelist_view`) ejecuta `get_or_create(pk=1)`, creando la fila con valores por defecto: `moderation_mode='both'`, `llm_model='llama3.2'`, `moderation_model='llama3.2'`. |
| FA-02 | Intento de crear una segunda fila                  | `has_add_permission()` devuelve `False` si ya existe una fila, ocultando el botón "Añadir" en el Admin.                                                                    |
| FA-03 | Intento de eliminar la configuración               | `has_delete_permission()` devuelve siempre `False`, impidiendo el borrado de la configuración.                                                                              |
| FA-04 | Modelo LLM no disponible en Ollama                 | El sistema no valida la existencia del modelo en tiempo de guardado (validación diferida). El error se producirá en la siguiente petición de chat, donde `ollama.chat()` lanzará una excepción capturada por el flujo de error del CU1 (FA-05). |
| FA-05 | Acceso por usuario sin permisos de staff            | Django Admin deniega el acceso y redirige a la página de login del Admin.                                                                                                  |

## Patrón Singleton: Detalles de implementación

| Mecanismo               | Implementación                                                                                                                                   |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| Forzar PK única          | `save()` sobrescrito: `self.pk = 1` antes de `super().save()`.                                                                                   |
| Creación automática      | Método de clase `get()`: `cls.objects.get_or_create(pk=1)`.                                                                                       |
| Impedir creación manual  | `has_add_permission()` → `not SystemConfig.objects.exists()`.                                                                                     |
| Impedir eliminación      | `has_delete_permission()` → `False`.                                                                                                              |
| Redirección automática   | `changelist_view()` → `redirect(f'{obj.pk}/change/')`.                                                                                            |
