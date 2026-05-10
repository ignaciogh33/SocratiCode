sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Accede a vista de perfil
    Usuario->>UI: Introduce contraseña actual y nueva
    Usuario->>UI: Pulsa "Cambiar contraseña"
    
    UI->>API: Solicitud POST /users/set_password/ (Token Bearer)
    
    API->>API: Validar Token JWT
    API->>API: Validar políticas de la nueva contraseña
    
    API->>DB: Consultar usuario
    DB-->>API: Devolver hash de contraseña actual
    API->>API: Verificar coºntraseña proporcionada contra hash
    
    API->>API: Generar nuevo hash de contraseña
    API->>DB: Actualizar hash en base de datos
    DB-->>API: Confirmación de guardado
    API-->>UI: Retornar HTTP 204 No Content
    UI-->>Usuario: Mostrar notificación de éxito

    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over UI,API: FA-01: Contraseña actual incorrecta
        API->>DB: Consultar usuario
        DB-->>API: Devolver hash de contraseña actual
        API->>API: Verificar contraseña proporcionada contra hash
        API-->>UI: Retornar HTTP 400 Bad Request
        UI-->>Usuario: Mostrar error de credenciales
    end

    rect rgb(255, 224, 224)
        Note over UI,API: FA-02: Nueva contraseña inválida
        API->>API: Validar políticas de la nueva contraseña
        API-->>UI: Retornar HTTP 400 Bad Request
        UI-->>Usuario: Mostrar error de validación
    end
