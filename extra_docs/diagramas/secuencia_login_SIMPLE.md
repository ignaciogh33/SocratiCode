sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Introduce credenciales y pulsa "Iniciar Sesión"
    UI->>API: Solicitud POST /jwt/create/
    API->>DB: Consultar usuario y hash
    DB-->>API: Datos del usuario
    
    API->>API: Validar hash de contraseña
    API->>API: Generar Tokens JWT (Access & Refresh)
    API-->>UI: Retornar tokens JWT
    UI->>UI: Guardar tokens en LocalStorage / Estado
    UI->>UI: Redirigir al área privada (Panel del Tutor)
    UI-->>Usuario: Interfaz principal cargada
    
    %% Flujos alternativos
    Note over Usuario,DB: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over API,DB: FA-01: Credenciales incorrectas
        API->>API: Validar hash de contraseña
        API-->>UI: Retornar HTTP 401 Unauthorized
        UI-->>Usuario: Mostrar error de credenciales
    end