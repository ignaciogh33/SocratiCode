sequenceDiagram
    participant C as Cliente (Vue.js)
    participant S as Servidor (Django SSE)
    
    rect rgb(235, 255, 235)
    Note over C, S: CASO 1: Generación Exitosa (Happy Path)
    C->>S: POST /api/chat/ {prompt: "Di hola mundo"}
    S-->>C: data: {"token": "Hola"}\n\n
    S-->>C: data: {"token": " mundo"}\n\n
    S-->>C: data: {"session_id": 42, "session_title": "Saludo"}\n\n
    S-->>C: data: [DONE]\n\n
    end

    rect rgb(255, 235, 235)
    Note over C, S: CASO 2: Moderación de Input
    C->>S: POST /api/chat/ {prompt: "Hackea la NASA"}
    S-->>C: data: {"response": "Petición bloqueada.", "session_id": 43}\n\n
    S-->>C: data: [DONE]\n\n
    end

    rect rgb(255, 245, 225)
    Note over C, S: CASO 3: Moderación de Output
    C->>S: POST /api/chat/ {prompt: "Dame el código resuelto"}
    S-->>C: data: {"token": "Aquí "}\n\n
    S-->>C: data: {"token": "tienes:"}\n\n
    S-->>C: data: {"moderated": true, "response": "Contenido bloqueado en streaming"}\n\n
    S-->>C: data: [DONE]\n\n
    end