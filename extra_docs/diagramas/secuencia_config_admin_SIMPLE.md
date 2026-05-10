sequenceDiagram
    actor Administrador
    participant UI as Cliente Web
    participant Sistema as Backend (Django Admin)
    participant DB as Base de Datos
    participant Modelos as Servicio de Modelos
    autonumber

    %% Acceso inicial y Redirección Singleton
    Administrador->>UI: Accede a la configuración global
    UI->>Sistema: Solicitar configuración actual
    Sistema->>DB: Consultar registro en BD
    alt Configuración inexistente
        DB-->>Sistema: No se encuentra registro
        Sistema->>DB: Crear registro con valores por defecto
        DB-->>Sistema: Confirmar creación
    else Configuración existente
        DB-->>Sistema: Devolver registro único activo
    end
    %% Carga del formulario y modelos
    rect rgb(224, 247, 250)
        Note over Sistema,Modelos: Consulta de modelos disponibles
        Sistema->>Modelos: Consultar modelos de lenguaje instalados
        Modelos-->>Sistema: Devolver lista de modelos locales
    end

    Sistema->>Sistema: Configurar selectores de modelos en la interfaz
    Sistema-->>UI: Retornar configuración y lista de modelos
    UI-->>Administrador: Presentar opciones de configuración

    %% Guardado de datos
    Administrador->>UI: Modifica parámetros y solicita guardar
    UI->>Sistema: Enviar nuevos parámetros
    Sistema->>Sistema: Validar parámetros introducidos
    rect rgb(255, 243, 224)
        Note over Sistema,DB: Persistencia forzando registro único (Singleton)
        Sistema->>DB: Solicitar guardado de configuración
        DB->>DB: Forzar sobrescritura del registro principal
        DB-->>Sistema: Confirmar actualización en la base de datos
    end

    Sistema-->>UI: Retornar HTTP 200 OK
    UI-->>Administrador: Mostrar confirmación de éxito

    %% Flujos alternativos
    Note over Administrador,Modelos: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over Sistema,Modelos: FA-01: Servicio de Modelos inaccesible
        Sistema->>Modelos: Consultar modelos de lenguaje instalados
        Modelos--xSistema: Fallo de conexión
        Sistema-->>UI: Mostrar error de conexión con modelos
        UI->>UI: Habilitar entrada de texto manual
        UI-->>Administrador: Presentar formulario estándar sin selectores
        Administrador->>UI: Introduce datos manualmente y guarda
        UI->>Sistema: Enviar datos introducidos
        Sistema->>DB: Guardar configuración sin validar existencia del modelo
    end

    rect rgb(255, 243, 224)
        Note over Sistema,Modelos: FA-02: Modelo configurado previamente no disponible
        Sistema->>Modelos: Consultar modelos de lenguaje instalados
        Modelos-->>Sistema: Devolver lista de modelos locales
        Sistema->>Sistema: Detectar ausencia del modelo activo en la lista
        Sistema->>Sistema: Añadir opción con advertencia de no disponibilidad
        Sistema-->>UI: Retornar configuración y lista de modelos
        UI-->>Administrador: Mostrar selector preseleccionado con advertencia visual
    end