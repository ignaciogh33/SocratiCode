sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Completa formulario de registro
    UI->>UI: Validar contraseñas coinciden
    UI->>API: Solicitud POST /users/ (datos de registro)
    
    API->>API: Validar política de contraseñas seguras
    API->>DB: Consultar existencia de email / usuario
    
    DB-->>API: Confirmación de disponibilidad
    
    API->>API: Generar hash de contraseña (PBKDF2 SHA-256)
    API->>DB: Guardar nuevo registro de usuario
    DB-->>API: Confirmación de guardado
    API-->>UI: Retornar HTTP 201 Created
    UI->>UI: Redirigir a vista de inicio de sesión
    UI-->>Usuario: Mostrar mensaje de registro exitoso

    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over API,DB: FA-01 / FA-02: Usuario ya existe o datos inválidos
        API->>DB: Consultar existencia de email / usuario
        DB-->>API: Conflict / Error de validación
        API-->>UI: Retornar código HTTP 400
        UI-->>Usuario: Mostrar mensaje de error
    end