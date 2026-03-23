# Mejoras Futuras para el Chat Backend (Django + Ollama)

Este documento guarda un plan de acción para llevar el sistema de chat actual (que ya es totalmente funcional) al siguiente nivel de escalabilidad, rendimiento y experiencia de usuario.

---

## 1. Respuestas en Streaming (Token a Token)
* **El Problema:** Actualmente, la llamada sincrónica obliga al usuario a mirar la pantalla congelada durante varios segundos hasta que el LLM genera el JSON final.
* **Plan de Implementación:**
  1. Habilitar el modo de respuesta fluida en la llamada a Ollama modificando sus argumentos: `ollama.chat(..., stream=True)`.
  2. Sustituir `Response()` de Django Rest Framework por `StreamingHttpResponse()`, la utilidad nativa de Django para flujos de datos continuos.
  3. Crear una función "generadora" en Python (usando la palabra clave `yield`) que empaquete cada fragmento ("chunk") devuelto por Ollama en el estándar **Server-Sent Events (SSE)**.
  4. Adaptar el frontend (cliente JS/React) para que consuma esta respuesta utilizando `EventSource` o procesando la respuesta HTTP como un stream para pintar el mensaje letra por letra.

## 2. Vistas Web Asíncronas nativas (`async def`)
* **El Problema:** La función `chat_view` utiliza hilos (threads) bloqueantes. Si 10 usuarios piden a LLaMA generar texto a la vez, se bloquearán 10 "workers" del servidor web esperando pasivamente a que Ollama conteste, lo cual ahoga los recursos y paraliza al servidor para otros visitantes.
* **Plan de Implementación:**
  1. Integrar el servidor ASGI compatible con tu proyecto (como Uvicorn o Daphne) en lugar de WSGI estándar.
  2. Modificar la definición de la vista para hacerla asíncrona: `async def chat_view(request):`.
  3. Usar el cliente asíncrono para tus peticiones HTTP a la IA: `client = ollama.AsyncClient()`, empleando `await client.chat(...)`.
  4. Envolver todas las operaciones con la Base de Datos (como `Message.objects.create()`) utilizando adaptadores como `sync_to_async` de Django (`from asgiref.sync import sync_to_async`) para evitar levantar errores de hilos concurrentes.

## 3. Rate Limiting (Protección Anti-Spam / Throttling)
* **El Problema:** Las inferencias de IAs requieren muchísima memoria y CPU local/GPU. Sin límites, cualquier script automatizado puede atacar tu API de `/api/chat/` en bucle y llevar el PC/Servidor al 100% de sobrecarga.
* **Plan de Implementación:**
  1. Valerse de la arquitectura de Django Rest Framework e importar sus utilidades dedicadas: `from rest_framework.throttling import UserRateThrottle`.
  2. Crear o configurar una cuota de llamadas diaria/por minuto para los usuarios autenticados directamente en el archivo `settings.py` bajo la clave `REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']`.
  3. Aplicar el decorador `@throttle_classes([UserRateThrottle])` en tu vista concreta `chat_view`.
  4. De esta manera, Django devolverá instantáneamente un error HTTP `429 Too Many Requests` sin llegar a estresar a Ollama, cuidando tu hardware.

## 4. Control Dinámico del Historial (Límite real de Tokens)
* **El Problema:** El código actual hace lo que se conoce como un hard-limit por cantidad de interacciones (`my_msgs[:10]`). Si los usuarios envían grandes bloques de texto (ej., ensayos o artículos completos), esos últimos 10 mensajes acabarán desbordando la memoria de la ventana contexto de la IA ("context window limit"), provocando cortes o fallos.
* **Plan de Implementación:**
  1. Diseñar una función auxiliar ligera en utilidades para medir los tokens reales aproximados. *(Como usar `tiktoken` en OpenAI, se puede estimar 1 token = 4 caracteres, o usar herramientas exactas para LLaMA).*
  2. Al construir el array `messages_payload`, iterar el historial de chat (desde el mensaje *más reciente* hasta el *más antiguo*).
  3. Ir sumando el recuento de caracteres/tokens en cada iteración y romper el bucle (usar un simple `break`) cuando se aproxime a la memoria máxima tolerada (por ejemplo, ~3500 palabras de contexto extra).

## 5. Moderación Rápida "En Segundo Plano" (Celery Task Worker)
* **El Problema:** Tu sistema actual requiere que `LLM_MOD` inspeccione cada mensaje antes de poder responder al usuario de forma segura. Eso duplica tu latencia estructural de espera.
* **Plan de Implementación:**
  1. Retornar la respuesta sincrónicamente al usuario en cuanto el *Primer* (1º) LLM termine. Al grabarlo en tu DB MySQL/Postgres se marca con una nueva bandera interna del modelo (e.g. `moderation_status = 'pending'`).
  2. Mandarlo evaluar como tarea asíncrona hacia una cola de mensajes (Redis/RabbitMQ) utilizando Celery: `task_moderate_llm_content.delay(session_id, message_id)`.
  3. Tu Worker de Celery de fondo completará la llamada pesada al *Segundo* (2º) LLM y posteriormente actualizará si es o no apropiado en la tabla de la Base de datos (`moderated_true / False`).
  4. De ser malicioso, el servidor puede emitir posteriormente un WebSocket alertando al usuario u oscureciendo permanentemente el mensaje ofensivo desde el Frontend sin paralizar la conversación inicial en vivo.
