======================================================================
                 ESTRUCTURA DEL PAYLOAD FINAL (JSON)
======================================================================

[Índice 0] 🛡️ SYSTEM (Fijo)
           El "Alma" del tutor. Le dice cómo debe comportarse.
           ---------------------------------------------------
           { "role": "system", "content": "Eres SocratiCode..." }

......................................................................

[Índice 1] 💻 SYSTEM (Dinámico - Inyectado)
           La "Foto" del entorno del alumno en ese instante.
           Une el código y el error de ejecución.
           ---------------------------------------------------
           { "role": "system", 
             "content": "El alumno tiene este código: \n [CÓDIGO] \n
                         La última salida fue: \n [ERROR_CONSOLA]" }

......................................................................

[Índice 2] 👤 USER (Historial Antiguo)
           { "role": "user", "content": "Pregunta antigua" }

[Índice 3] 🤖 ASSISTANT (Historial Antiguo)
           { "role": "assistant", "content": "Respuesta antigua" }

......................................................................

[Índice N] 👤 USER (Mensaje Actual)
           La última acción o mensaje que acaba de enviar el alumno.
           ---------------------------------------------------
           { "role": "user", "content": "¡No entiendo este error!" }

======================================================================