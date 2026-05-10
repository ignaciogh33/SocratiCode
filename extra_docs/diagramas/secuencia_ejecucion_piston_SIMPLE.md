sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Cliente Web
    participant Sistema as Backend
    participant Piston as Motor de Ejecución

    Usuario->>UI: Presiona botón "Ejecutar"
    UI->>Sistema: Solicitud de ejecución de código

    %% Validación
    Sistema->>Sistema: Validar formato de código y lenguaje

    %% Llamada a Piston
    rect rgb(224, 247, 250)
        Note over Sistema,Piston: Ejecución en sandbox aislado
        Sistema->>Piston: Enviar código para ejecución segura

        Piston->>Piston: Crear entorno aislado temporal
        
        alt Lenguaje compilado (C, Java)
            Piston->>Piston: Fase 1: Compilar código
            Piston->>Piston: Fase 2: Ejecutar binario
        else Lenguaje interpretado (Python)
            Piston->>Piston: Ejecutar código
        end

        Piston-->>Sistema: Devolver salida y errores de ejecución
    end

    %% Procesamiento de respuesta
    Sistema->>Sistema: Procesar y estructurar resultados

    Sistema->>Sistema: Evaluar campo de estado (Status)
    opt Status indica error de ejecución o interrupción
        Sistema->>Sistema: Añadir un mensaje de error didáctico al stderr
    end

    Sistema-->>UI: Enviar resultados procesados

    alt Ejecución exitosa
        UI-->>Usuario: Mostrar salida del programa
    else Ejecución con errores
        UI-->>Usuario: Mostrar detalles del error
    end