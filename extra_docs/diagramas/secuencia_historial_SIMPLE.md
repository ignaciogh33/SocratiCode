sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Note over Usuario,DB: Carga inicial de sesiones
    Usuario->>UI: Accede a la pantalla principal
    UI->>API: GET /api/chat/sessions/
    API->>DB: Consultar sesiones del usuario ordenadas
    DB-->>API: Lista de sesiones (metadatos)
    API-->>UI: Retornar lista de sesiones
    UI-->>Usuario: Mostrar sesiones en barra lateral

    Note over Usuario,DB: Carga de historial de una sesión
    Usuario->>UI: Selecciona una sesión antigua
    UI->>API: GET /api/chat/sessions/{id}/messages/
    API->>API: Validar permisos de acceso a la sesión
    API->>DB: Consultar mensajes vinculados a la sesión
    DB-->>API: Historial de mensajes completo
    API-->>UI: Retornar array de mensajes cronológicos
    
    UI->>UI: Limpiar chat actual y renderizar mensajes recuperados
    UI->>UI: Desplazar scroll al fondo de la conversación
    UI-->>Usuario: Mostrar historial y habilitar escritura