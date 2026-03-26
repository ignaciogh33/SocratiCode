# Propuestas de Nuevas Funcionalidades para SocratiCode

Ahora que tenemos una base super robusta con Autenticación (JWT), Chat con LLM en local (Ollama) moderado, y Ejecución de código aislada (Piston) con inyección de contexto, el abanico de posibilidades es enorme.

Aquí tienes algunas ideas divididas en **Mejoras Técnicas** y **Nuevas Funcionalidades**:

---

## 🚀 Mejoras Técnicas (del documento [mejoras_chat.md](file:///home/ignacio/Escritorio/SocratiCode/mejoras_chat.md))

Si quieres centrarte en que la plataforma sea profesional, rápida y escalable, estas son las prioridades técnicas documentadas que aún no hemos implementado:

1.  **Respuestas en Streaming (Token a Token)**
    *   **Qué es:** Ver cómo la IA escribe letra a letra en lugar de esperar 5 segundos a que aparezca todo el texto de golpe.
    *   **Por qué:** Mejora radicalmente la percepción de velocidad (UX) y evita que el alumno piense que la pestaña se ha congelado.
    *   **Esfuerzo:** Medio. Requiere cambiar la vista de Django a `StreamingHttpResponse` con Server-Sent Events (SSE) y usar `stream=True` en Ollama.

2.  **Moderación en Segundo Plano (Celery + Redis)**
    *   **Qué es:** Devolver la respuesta al estudiante de forma casi inmediata y evaluarla por debajo de forma asíncrona. Si es inapropiada pasada la validación, se borra/oculta.
    *   **Por qué:** Ahora mismo, el usuario espera el tiempo del LLM Principal + el tiempo del LLM Moderador. Dividiríamos el tiempo de espera casi a la mitad.
    *   **Esfuerzo:** Alto. Requiere introducir RabbitMQ/Redis y Celery Worker en la arquitectura de Docker.

3.  **Vistas Asíncronas (ASGI/Uvicorn)**
    *   **Qué es:** Migrar el backend para que no se bloqueen los "workers" mientras Ollama está "pensando".
    *   **Por qué:** Si hay 10 estudiantes a la vez, el servidor Django moriría por agotamiento de hilos. Con `async def` puede aguantar miles.
    *   **Esfuerzo:** Medio.

---

## 🎓 Nuevas Funcionalidades (Visión de Producto)

Si la parte técnica ya te vale por ahora (porque solo vas a tener pocos usuarios a la vez en esta fase inicial), podemos centrarnos en enriquecer el aprendizaje:

1.  **Módulos / Ejercicios Estructurados (Gamificación)**
    *   **Qué es:** Crear un modelo de base de datos `Exercise` o `Lesson` (ej: "Tema 1: Variables", "Tema 2: Bucles"). El estudiante no entra a un chat vacío, entra a un ejercicio con un objetivo.
    *   **Por qué:** SocratiCode pasaría de ser "una terminal con chat" a una plataforma de e-learning guiada (estilo LeetCode o freeCodeCamp). Sabe qué curso y lección está haciendo el alumno.
    *   **Bonus:** El system_prompt de Ollama se podría inyectar también con el "Objetivo del ejercicio" para que el tutor guíe hacia la meta específica.

2.  **Validación Automática de Ejercicios (Tests Unitarios Ocultos)**
    *   **Qué es:** Añadir un botón "Comprobar Solución". El backend ejecuta el código del alumno en Piston, pero inyectando un archivo `test.py` oculto que hace aserciones (`assert alumno_func() == esperado`).
    *   **Por qué:** Permite corrección instantánea y objetiva sin intervención humana ni alucinaciones de la IA.

3.  **"Tutor General" vs "Tutor de Ejercicio"**
    *   **Qué es:** Adaptar el backend para tener dos *rutas* de chat. Un chat libre general, y un chat anclado a un código/ejercicio específico. Ya tenemos mucha de esta base hecha.

4.  **Historial de Ejecuciones (Dashboard del Profesor)**
    *   **Qué es:** Guardar en la base de datos de Django todas las ejecuciones de los alumnos junto a su código, fecha y si dio error de compilación.
    *   **Por qué:** El profesor (tú) puede ver en la vista del Admin qué ejercicios les atascan más a los alumnos ("Analytics de Errores").

---

### ¿Qué te apetece atacar ahora?
Recomendaría:
1.  **Streaming (Mejora UX)** si vas a empezar pronto con el Frontend y quieres que el chat se sienta "mágico".
2.  **Creación de Ejercicios/Lecciones (Producto)** si quieres que realmente empiece a tener forma de "Tutor virtual estructurado".
