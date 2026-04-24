2.1. Fundamentos Pedagógicos en la Enseñanza de la Programación

2.1.1. Dificultades en el aprendizaje inicial (CS1): Análisis de la alta carga cognitiva, las tasas de frustración y la barrera que supone la sintaxis para el desarrollo del pensamiento computacional.

2.1.2. El Método Socrático como mitigación: Justificación teórica del diálogo guiado, el cual fomenta que el estudiante deduzca la solución por sí mismo en lugar de recibir instrucción directa.

2.2. Inteligencia Artificial Generativa en la Educación

2.2.1. Riesgos del facilismo algorítmico: Evaluación del impacto negativo provocado por herramientas de propósito general (como ChatGPT o GitHub Copilot) cuando se utilizan sin restricciones, propiciando el comportamiento de "copiar y pegar".

2.2.2. Sistemas de tutoría guiada (Casos de Éxito): Revisión de plataformas académicas recientes que adaptan la IA para la docencia. Aquí se debe incluir la literatura sobre proyectos vanguardistas como el CS50 Duck de la Universidad de Harvard (que aproxima un ratio de tutorización 1:1 sin dar respuestas directas) y el asistente CodeAid.

2.2.3. Ingeniería de Prompts en educación: Metodologías y estructuración semántica para alinear de forma determinista el comportamiento de un modelo fundacional hacia el rol de un tutor filosófico y restrictivo.

2.3. Modelos de Lenguaje Extenso (LLMs) y Despliegue Local

2.3.1. APIs en la nube vs. Inferencia Local: Análisis comparativo de los despliegues comerciales frente a infraestructuras autohospedadas, evaluando aspectos críticos como la soberanía de los datos, el cumplimiento normativo (GDPR) en entornos educativos y la previsibilidad de los costes operativos.

2.3.2. Optimización de modelos ligeros (Llama 3.2): Estado del arte sobre la viabilidad de la inferencia local mediante modelos de parámetros reducidos orientados a dispositivos de borde, apoyados en técnicas de cuantización para minimizar el uso de memoria (VRAM) manteniendo una alta capacidad de razonamiento.

2.4. Seguridad y Aislamiento de Procesos (Sandboxing)

2.4.1. Vectores de amenaza en plataformas interactivas: Análisis de los riesgos inherentes a permitir la Ejecución de Código Arbitrario (ACE) no confiable por parte de múltiples usuarios, incluyendo escalada de privilegios y ataques de denegación de servicio como las fork bombs.

2.4.2. Primitivas de aislamiento a nivel de Kernel: Exploración técnica sobre cómo los namespaces de Linux aíslan la visibilidad del sistema (red, montaje) y cómo los grupos de control (cgroups) imponen límites físicos sobre el consumo de CPU y memoria.

2.4.3. Motores de ejecución efímeros: Revisión de arquitecturas diseñadas para la compilación segura y políglota con sobrecarga mínima, destacando integraciones robustas como Piston.

2.5. Arquitecturas Web Educativas y Transmisión de Datos

2.5.1. Paradigma de Aplicación Web Desacoplada: Justificación de la división estructural entre clientes interactivos asíncronos (SPA) y servidores orientados a microservicios e interfaces de programación (APIs) para soportar entornos complejos de codificación en el navegador.

2.5.2. Protocolos de comunicación en tiempo real: Estudio comparativo entre WebSockets y Server-Sent Events (SSE). Se debe argumentar cómo SSE proporciona un conducto unidireccional mucho más eficiente y liviano para retransmitir las respuestas secuenciales (streaming de tokens) emitidas por los modelos de IA.

2.6. Conclusiones del Estado del Arte

2.6.1. Síntesis y propuesta de valor: Breve resumen de las brechas identificadas en la literatura analizada y posicionamiento de la plataforma SocratiCode como la solución arquitectónica que amalgama la seguridad de ejecución, la privacidad local y la rigurosidad pedagógica socrática.

Esta estructura organizará de manera robusta su memoria, justificando paso a paso cada una de las decisiones de ingeniería expuestas en los capítulos posteriores de su Trabajo de Fin de Grado.