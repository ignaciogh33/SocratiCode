sequenceDiagram
    autonumber
    actor Admin
    participant AdminUI as Django Admin<br/>(SystemConfigAdmin)
    participant Form as SystemConfigForm
    participant DB as PostgreSQL<br/>(SystemConfig)
    participant Ollama as Servicio Ollama

    %% Acceso inicial y Redirección Singleton
    Admin->>AdminUI: Clic en "Configuración del sistema"
    AdminUI->>DB: SystemConfig.get()
    
    alt No existe configuración
        DB-->>AdminUI: get_or_create(pk=1) -> nueva fila con valores por defecto
    else Ya existe
        DB-->>AdminUI: Fila existente (pk=1)
    end
    
    AdminUI->>AdminUI: redirect('/admin/chat/systemconfig/1/change/')
    
    %% Carga del formulario y modelos
    AdminUI->>Form: Inicializar formulario
    
    rect rgb(224, 247, 250)
        Note over Form,Ollama: Consulta de modelos disponibles
        Form->>Ollama: GET /api/tags (ollama.list())
        Ollama-->>Form: Lista de modelos instalados
        Form->>Form: Configurar campos como ChoiceField (desplegables)
    end

    Form-->>AdminUI: Formulario renderizado
    AdminUI-->>Admin: Muestra panel con desplegables y opciones

    %% Guardado de datos
    Admin->>AdminUI: Modifica valores y pulsa "Guardar"
    AdminUI->>Form: Validar datos enviados
    Form-->>AdminUI: Datos válidos
    
    rect rgb(255, 243, 224)
        Note over AdminUI,DB: Persistencia forzando Singleton
        AdminUI->>DB: save()
        DB->>DB: self.pk = 1 (sobrescritura explícita)
        DB->>DB: UPDATE systemconfig SET ...
    end

    AdminUI-->>Admin: Confirmación de guardado exitoso

    %% Flujos alternativos
    Note over Admin,Ollama: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over Form,Ollama: FA-01: Servicio Ollama inaccesible al cargar
        Form->>Ollama: GET /api/tags (ollama.list())
        Ollama--xForm: Connection Error
        Form->>Form: Retorna None y mantiene campos como texto libre
        Form-->>AdminUI: Formulario renderizado
        AdminUI-->>Admin: Muestra panel con inputs de texto normales
        Admin->>AdminUI: Modifica valores y pulsa "Guardar"
        AdminUI->>DB: Guarda configuración sin dar error
    end

    rect rgb(255, 243, 224)
        Note over Form,Ollama: FA-02: Modelo previamente guardado borrado
        Form->>Ollama: GET /api/tags (ollama.list())
        Ollama-->>Form: Lista de modelos instalados
        Form->>Form: Detecta que el modelo guardado no está en la lista
        Form->>Form: Añade al desplegable la opción "nombre_modelo ⚠ no disponible"
        Form-->>AdminUI: Formulario renderizado
        AdminUI-->>Admin: Muestra desplegable preseleccionado con la advertencia
    end
