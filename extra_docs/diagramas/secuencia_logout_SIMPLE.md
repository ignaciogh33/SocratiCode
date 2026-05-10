sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant API as Backend
    participant DB as Base de Datos

    Usuario->>UI: Pulsa el botón "Cerrar Sesión"
    UI->>API: Solicitud POST para invalidar token de refresco (Blacklist)
    API->>DB: Añadir token a la lista negra
    DB-->>API: Confirmación
    API-->>UI: Retornar HTTP 200 OK
    UI->>UI: Eliminar tokens almacenados en cliente
    UI->>UI: Redirigir a pantalla de acceso
    UI-->>Usuario: Mostrar pantalla de inicio de sesión