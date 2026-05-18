sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Pulsa icono de papelera en una sesión
    UI-->>Usuario: Muestra diálogo de confirmación
    Usuario->>UI: Confirma la eliminación
    
    UI->>API: Solicitud DELETE /api/chat/sessions/{id}/
    API->>API: Validar que el usuario es propietario
    
    rect rgb(255, 235, 238)
        Note over API,DB: Eliminación en cascada
        API->>DB: Eliminar mensajes asociados a la sesión
        API->>DB: Eliminar sesión de chat
        DB-->>API: Confirmación de borrado
    end
    
    API-->>UI: Retornar HTTP 204 No Content
    
    UI->>UI: Eliminar sesión del estado local
    
    opt Sesión eliminada era la sesión activa
        UI->>UI: Limpiar pantalla y deseleccionar sesión
        UI-->>Usuario: Mostrar vista inicial ("Nueva conversación")
    end
    
    UI-->>Usuario: Mostrar panel lateral actualizado

    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over Usuario,UI: FA-01: Cancelación del borrado
        Usuario->>UI: Pulsa "Cancelar" en el diálogo de confirmación
        UI->>UI: Cerrar cuadro de diálogo
        UI-->>Usuario: Mantener sesión intacta (no se envía petición)
    end