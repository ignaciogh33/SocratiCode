sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos
    participant Email as Servidor SMTP

    %% Solicitud de restablecimiento
    Note over Usuario,Email: FASE 1: Solicitud de recuperación
    Usuario->>UI: Introduce email y pulsa enviar
    UI->>API: POST /users/reset_password/
    API->>DB: Consultar existencia del email
    DB-->>API: Datos del usuario (si existe)
    
    API-->>UI: Retornar HTTP 204
    UI-->>Usuario: Muestra mensaje de confirmación
    
    opt Usuario existe
        API->>API: Generar Token de un solo uso (HMAC)
        API->>Email: Enviar correo con enlace (UID + Token)
        Email-->>Usuario: Correo electrónico entregado
    end

    %% Establecimiento de nueva clave
    Note over Usuario,DB: FASE 2: Confirmación y cambio de clave
    Usuario->>Usuario: Abre el enlace del correo
    Usuario->>UI: Carga vista de restablecimiento
    Usuario->>UI: Introduce nueva contraseña y pulsa confirmar
    UI->>API: POST /users/reset_password_confirm/ (UID, Token, Nueva Clave)
    
    API->>API: Validar firma del Token y caducidad
    
    API->>API: Generar nuevo hash de contraseña
    API->>DB: Actualizar contraseña del usuario
    DB-->>API: Confirmación
    API-->>UI: Retornar HTTP 204 No Content
    UI->>UI: Redirigir a inicio de sesión
    UI-->>Usuario: Mostrar mensaje de éxito

    %% Flujos alternativos
    Note over Usuario,Email: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over API,DB: FA-01: Token inválido o expirado
        API->>API: Validar firma del Token y caducidad
        API-->>UI: Retornar HTTP 400 Bad Request
        UI-->>Usuario: Mostrar error de enlace inválido
    end