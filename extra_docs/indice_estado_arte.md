2.1. Fundamentos Pedagógicos en la Enseñanza de la Programación

2.1.1. Dificultades en el aprendizaje inicial (CS1): Análisis de la alta carga cognitiva, las tasas de frustración y la barrera que supone la sintaxis para el desarrollo del pensamiento computacional.

2.1.2. El Método Socrático como mitigación: Justificación teórica del diálogo guiado, el cual fomenta que el estudiante deduzca la solución por sí mismo en lugar de recibir instrucción directa.

2.2. Inteligencia Artificial Generativa en la Educación

2.2.1. Riesgos del facilismo algorítmico: Evaluación del impacto negativo provocado por herramientas de propósito general (como ChatGPT o GitHub Copilot) cuando se utilizan sin restricciones, propiciando el comportamiento de "copiar y pegar".

2.2.2. Sistemas de tutoría guiada (Casos de Éxito): Revisión de plataformas académicas recientes que adaptan la IA para la docencia. Aquí se debe incluir la literatura sobre proyectos vanguardistas como el CS50 Duck de la Universidad de Harvard (que aproxima un ratio de tutorización 1:1 sin dar respuestas directas) y el asistente CodeAid.

2.2.3. Ingeniería de Prompts en educación: Metodologías y estructuración semántica para alinear de forma determinista el comportamiento de un modelo fundacional hacia el rol de un tutor filosófico y restrictivo.

2.3. Modelos de Lenguaje Extenso (LLMs) y Despliegue Local

2.3.1. APIs en la nube vs. Inferencia Local: Análisis comparativo de los despliegues comerciales frente a infraestructuras autohospedadas, evaluando aspectos críticos como la soberanía de los datos, el cumplimiento normativo (GDPR) en entornos educativos y la previsibilidad de los costes operativos.

2.3.2. Ecosistema y clasificación de modelos de lenguaje de código abierto: Revisión de la oferta de modelos open source según su cantidad de parámetros (1B, 3B, 8B) y análisis de familias destacadas como Llama, Mistral y Qwen para entornos educativos.

2.3.3. Optimización de modelos ligeros (Llama 3.2): Estado del arte sobre la viabilidad de la inferencia local mediante modelos de parámetros reducidos orientados a dispositivos de borde, apoyados en técnicas de cuantización para minimizar el uso de memoria (VRAM) manteniendo una alta capacidad de razonamiento.

2.4. Seguridad y aislamiento en la ejecución de código: Análisis de los riesgos inherentes a permitir la Ejecución de Código Arbitrario (ACE) no confiable por parte de múltiples usuarios, y la solución aplicada mediante motores de ejecución efímeros para la compilación segura y políglota con sobrecarga mínima, destacando integraciones robustas como Piston.
2.5. Arquitecturas Web Educativas y Transmisión de Datos

2.5.1. Paradigma de Aplicación Web Desacoplada: Justificación de la división estructural entre clientes interactivos asíncronos (SPA) y servidores orientados a microservicios e interfaces de programación (APIs) para soportar entornos complejos de codificación en el navegador.

2.5.2. Protocolos de comunicación en tiempo real: Estudio comparativo entre WebSockets y Server-Sent Events (SSE). Se debe argumentar cómo SSE proporciona un conducto unidireccional mucho más eficiente y liviano para retransmitir las respuestas secuenciales (streaming de tokens) emitidas por los modelos de IA.

2.6. Conclusiones del Estado del Arte

2.6.1. Síntesis y propuesta de valor: Breve resumen de las brechas identificadas en la literatura analizada y posicionamiento de la plataforma SocratiCode como la solución arquitectónica que amalgama la seguridad de ejecución, la privacidad local y la rigurosidad pedagógica socrática.

Esta estructura organizará de manera robusta su memoria, justificando paso a paso cada una de las decisiones de ingeniería expuestas en los capítulos posteriores de su Trabajo de Fin de Grado.


## Cambios

### 1. Simplificación de la Seguridad y Sandboxing (Punto 2.4)
[cite_start]Tal y como sospechabas, este bloque tiene demasiado peso técnico en comparación con el núcleo pedagógico del proyecto[cite: 219]. [cite_start]Actualmente tienes tres subapartados muy específicos[cite: 220, 221, 222]:
* [cite_start]**Recomendación:** Fusionar los puntos **2.4.1**, **2.4.2** y **2.4.3** en un único apartado titulado **"2.4. Seguridad y aislamiento en la ejecución de código"**[cite: 219].
* [cite_start]**Justificación:** Hablar de "Primitivas a nivel de Kernel" [cite: 221] es un nivel de detalle excesivo para un TFG centrado en IA. [cite_start]Al unificarlos, puedes explicar la necesidad del aislamiento (amenazas) y la solución aplicada (motores efímeros como Docker) en un solo bloque coherente[cite: 220, 222].

### 2. Actualización de Sistemas de Tutoría (Punto 2.2.2)
[cite_start]En tu texto actual sobre casos de éxito [cite: 190][cite_start], te centras en el **CS50 Duck** de Harvard [cite: 192] [cite_start]y en **CodeAid**[cite: 197]. 
* [cite_start]**Recomendación:** Incluir una mención o subpunto dedicado a **TreeInstruct (2024)** dentro de esta sección[cite: 190].
* **Justificación:** Es la investigación más puntera y reciente (publicada en el EMNLP 2024) sobre planificación multi-turno y cuestionamiento jerárquico. Incluirla demuestra que tu estado del arte está actualizado al máximo nivel posible.

### 3. Fortalecimiento de la Ingeniería de Prompts (Punto 2.2.3)
[cite_start]Este apartado es fundamental porque justifica tu implementación técnica[cite: 208].
* [cite_start]**Sugerencia:** Asegúrate de que este punto conecte directamente con la "jerarquía" que mencionas[cite: 213]. [cite_start]Debe quedar claro que los modelos actuales son "asistentes" por diseño y que es mediante esta ingeniería como los transformamos en "tutores"[cite: 211, 212].

### 4. Reorganización del Flujo Lógico
El orden actual es bueno, pero si aplicas los cambios anteriores, el flujo de lectura para el tribunal sería mucho más natural:
1.  [cite_start]**Fundamentos Pedagógicos (2.1):** ¿Por qué hace falta SocratiCode?[cite: 151, 153].
2.  [cite_start]**Sistemas Existentes (2.2):** ¿Qué han hecho otros (Harvard, CodeAid, TreeInstruct)?[cite: 190].
3.  [cite_start]**Tecnología y Prompts (2.3):** ¿Con qué herramientas lo hacemos (Llama 3.2 y Prompt Engineering)?[cite: 215, 218].
4.  [cite_start]**Seguridad (2.4):** ¿Cómo lo hacemos seguro (Sandboxing unificado)?[cite: 219].
5.  [cite_start]**Arquitectura Web (2.5):** ¿Cómo se comunica todo en tiempo real?[cite: 223, 228].

**Resumen de cambios sugeridos en el índice:**
* [cite_start]**Eliminar:** 2.4.2 (Primitivas a nivel de Kernel) y 2.4.3 (Motores efímeros) como puntos independientes[cite: 221, 222].
* [cite_start]**Añadir:** Referencia explícita a TreeInstruct en el punto 2.2.2[cite: 190].
* [cite_start]**Mantener:** El enfoque de "Inferencia Local" (2.3.1) y "Llama 3.2" (2.3.2), ya que son tu propuesta de valor frente a Harvard[cite: 196, 217, 218].
