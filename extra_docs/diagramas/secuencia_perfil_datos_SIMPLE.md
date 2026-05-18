sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Accede a vista de perfil
    Usuario->>UI: Edita los campos "Nombre de usuario" y "Sobre mí"
    UI->>UI: Aplicaría cambio de tema localmente si aplica (no implementado aún)
    Usuario->>UI: Pulsa "Guardar cambios"
    UI->>API: Solicitud PATCH /users/me/ (Token Bearer)
    
    API->>API: Validar Token JWT
    API->>DB: Consultar si nombre de usuario ya existe
    
    API->>DB: Actualizar nombre y biografía
    DB-->>API: Confirmación de guardado
    API-->>UI: Retornar HTTP 200 OK con datos actualizados
    UI->>UI: Actualizar estado local
    UI-->>Usuario: Mostrar notificación de éxito

    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over API,DB: FA-01: Nombre de usuario ya en uso
        API->>DB: Consultar si nombre de usuario ya existe
        DB-->>API: Conflicto detectado
        API-->>UI: Retornar HTTP 400 Bad Request
        UI-->>Usuario: Mostrar error de nombre no disponible
    end
