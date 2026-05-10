sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant Sistema as Backend
    participant DB as Base de Datos
    participant ModIn as LLM Moderador (Entrada)
    participant LLM as LLM Tutor
    participant ModOut as LLM Moderador (Salida)

    Usuario->>UI: Escribe mensaje y pulsa enviar
    UI->>Sistema: Solicitud de envío de mensaje

    %% Validación y persistencia
    Sistema->>Sistema: Validar longitud del mensaje
    Sistema->>DB: Obtener o crear sesión de chat activa
    DB-->>Sistema: Identificador de sesión
    Sistema->>DB: Guardar mensaje del usuario
    Sistema->>DB: Asignar título si es el primer mensaje de la sesión
    DB-->>Sistema: Título de la sesión actualizado

    %% Lectura de configuración (CORREGIDO)
    Sistema->>DB: Consultar ajustes globales del sistema
    DB-->>Sistema: Parámetros de modelos y umbrales

    %% Moderación de input (síncrona)
    rect rgb(255, 243, 224)
        Note over Sistema,ModIn: MODERACIÓN DE ENTRADA (Síncrona)
        Sistema->>ModIn: Evaluar texto del usuario
        ModIn-->>Sistema: Veredicto positivo (OK)
    end

    %% Construcción del payload
    Sistema->>DB: Recuperar historial reciente de la sesión (10 mensajes)
    DB-->>Sistema: Historial de mensajes
    Sistema->>Sistema: Construir contexto con prompt, código e historial

    %% Streaming del LLM
    rect rgb(224, 247, 250)
        Note over Sistema,LLM: GENERACIÓN DE RESPUESTA (Streaming)
        Sistema->>LLM: Solicitar generación de respuesta (Tutor)

        loop Por cada token generado
            LLM-->>Sistema: Token
            Sistema-->>UI: Transmitir token en tiempo real
            UI-->>Usuario: Renderizar token (efecto de escritura)

            alt Periódicamente (según configuración)
                rect rgb(252, 228, 236)
                    Note over Sistema,ModOut: MODERACIÓN DE SALIDA (Asíncrona)
                    Sistema-)ModOut: Evaluar texto acumulado (en segundo plano)
                    ModOut--)Sistema: Veredicto positivo (OK)
                end
            end
        end
    end

    %% Finalización
    Sistema->>Sistema: Esperar validaciones de moderación pendientes
    Sistema-->>UI: Notificar actualización de sesión
    Sistema-->>UI: Notificar fin de la transmisión
    Sistema->>DB: Guardar respuesta completa del tutor

    UI->>UI: Actualizar barra lateral y estado de sesión
    UI-->>Usuario: Respuesta completa visible

    %% Flujos alternativos
    Note over Usuario,ModOut: ─── FLUJOS ALTERNATIVOS ───

    rect rgb(255, 224, 224)
        Note over Sistema,ModIn: FA-01: Entrada rechazada por moderación
        ModIn-->>Sistema: Veredicto negativo (Contenido bloqueado)
        Sistema->>DB: Marcar mensaje del usuario como moderado
        Sistema-->>UI: Enviar mensaje predefinido
        UI-->>Usuario: Mostrar mensaje predefinido
    end

    rect rgb(255, 243, 224)
        Note over Sistema,ModOut: FA-02: Salida rechazada por moderación
        ModOut--)Sistema: Veredicto negativo (Contenido bloqueado)
        Sistema->>Sistema: Interrumpir transmisión en tiempo real
        Sistema-->>UI: Enviar señal de moderación y mensaje predefinido
        Sistema->>DB: Guardar respuesta del tutor como contenido moderado
        UI->>UI: Eliminar texto parcial de la interfaz
        UI-->>Usuario: Mostrar mensaje predefinido
    end