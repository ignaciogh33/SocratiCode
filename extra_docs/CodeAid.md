## 🦆 ¿Qué es CodeAid?
**CodeAid** es un asistente de programación basado en IA (UBC) diseñado para ser el "tutor perfecto": aquel que te guía hacia la respuesta sin darte el código final. A diferencia del sistema de Harvard (que se apoya en RAG para consultar materiales del curso), CodeAid se especializa en **la estructura del prompt y el control de la interfaz** para garantizar un aprendizaje activo.

---

## 🛠️ Cómo funciona: De la "caja negra" al Tutor Socrático
Gracias a la sección **3.3** y las figuras que compartiste, sabemos que su funcionamiento ha evolucionado drásticamente:

1.  **Entrada Multimodal (Fig. 1):** El sistema permite al alumno no solo preguntar, sino subir su código y elegir una "función" específica (Explicar, Corregir, Escribir).
2.  **Referencia Interna Silenciosa:** En las versiones nuevas, cuando pides ayuda para corregir código, la IA primero genera la solución correcta **internamente**. No se la muestra al alumno, pero la usa para asegurar que las sugerencias que le da sean 100% precisas.
3.  **Pseudo-código Interactivo (Fig. 5):** En lugar de dar código real (que fomenta el copiar/pegar), CodeAid genera **pseudo-código**. Esto obliga al estudiante a entender la lógica y traducirla él mismo al lenguaje de programación (C, Python, etc.).
4.  **Few-shot Prompting:** El sistema utiliza ejemplos de "entrada/salida" en sus instrucciones internas para que el tono sea siempre pedagógico y no abrumador.

---

## 🛡️ La Anonimización: El "Escudo" de Privacidad
CodeAid se toma la privacidad más en serio que los modelos comerciales estándar. Su proceso de **Scrubbing** funciona así:

* **Detección de PII:** Antes de que la pregunta salga hacia OpenAI, un filtro escanea nombres, IDs de estudiante y correos.
* **Tokenización:** Reemplaza los datos sensibles por etiquetas (`[NAME_1]`, `[ID_1]`). Así, la IA sabe que hay un nombre ahí, pero no de quién es.
* **Limpieza de Comentarios:** Escanea incluso el código del alumno en busca de firmas o datos personales olvidados en los comentarios.

---

