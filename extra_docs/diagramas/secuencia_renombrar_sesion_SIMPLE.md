sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Pulsa el icono de renombrar en una sesión
    UI->>UI: Convierte el título en un campo input
    Usuario->>UI: Escribe el nuevo título y pulsa Enter
    
    UI->>UI: Validar que el título no esté vacío
    
    UI->>API: Solicitud PATCH /api/chat/sessions/{id}/
    API->>API: Validar permisos y que no esté vacío
    API->>API: Truncar título a 200 caracteres si excede el límite
    API->>DB: Actualizar título de la sesión
    DB-->>API: Confirmación de guardado
    API-->>UI: Retornar HTTP 200 OK (con título final)
    UI->>UI: Actualizar lista de sesiones en estado local
    UI-->>Usuario: Mostrar sesión con el nuevo título

    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over Usuario,UI: FA-01: Título vacío o en blanco
        UI->>UI: Validar que el título no esté vacío
        UI->>UI: Abortar envío y restaurar título original
        UI-->>Usuario: Finalizar modo de edición silenciosamente
    end