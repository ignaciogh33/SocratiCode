# Comparativa de Arquitecturas: Ejecución de Código Python en SocratiCode

Este documento recoge el análisis técnico sobre las opciones de diseño para implementar el entorno de ejecución de código interactivo en la plataforma. 

Actualmente, el proyecto utiliza la **Opción 1 (Backend)** para priorizar la estabilidad y rapidez de desarrollo en la fase MVP, con la posibilidad de migrar a la **Opción 2 (Frontend)** en el futuro para optimizar costes de servidor.

---

## Opción 1: Ejecución en Servidor (Piston + Docker)
**Estado actual:** Implementado.

El código del alumno viaja desde el navegador hasta el backend (Django), el cual delega la ejecución a un microservicio aislado (Piston) alojado en un contenedor Docker.

**Ventajas:**
* **Estabilidad y Simplicidad:** El Frontend solo tiene que hacer peticiones HTTP estándar (POST). Toda la complejidad reside en el servidor.
* **Entorno Real:** Se ejecuta Python nativo sobre un sistema operativo Linux real, evitando problemas de compatibilidad con ciertas librerías estándar.
* **Seguridad Integrada:** Piston maneja automáticamente los *timeouts* (cortando bucles infinitos) y restringe el acceso a la red y al sistema de archivos del host.
* **Aprovechamiento de Infraestructura:** Utiliza el ecosistema `docker-compose` ya configurado para la base de datos y otros servicios.

**Desventajas:**
* **Carga de Servidor:** Cada ejecución consume CPU y memoria RAM del servidor. En un escenario de alta concurrencia, requiere escalar la infraestructura.
* **Latencia:** El resultado no es instantáneo, ya que depende del viaje de ida y vuelta por la red (Network I/O).

---

## Opción 2: Ejecución en Navegador (Pyodide / WebAssembly)
**Estado actual:** Propuesta para futura refactorización.

El código del alumno se ejecuta directamente en su propio navegador utilizando una versión de Python compilada a WebAssembly (Pyodide). El backend (Django) solo interviene para gestionar el chat y la IA.

**Ventajas:**
* **Coste Cero de Servidor:** La carga de procesamiento se transfiere al dispositivo del usuario (Edge Computing). Altamente escalable y económico.
* **Ejecución Instantánea:** Al no haber latencia de red, la experiencia de usuario (UX) es inmediata.
* **Innovación Tecnológica:** Demuestra dominio de tecnologías de vanguardia (WebAssembly) en el desarrollo web.

**Desventajas:**
* **Complejidad del Frontend:** Requiere interceptar la salida estándar (`sys.stdout`) mediante JavaScript para mostrarla en la interfaz.
* **Gestión de Bloqueos:** Exige implementar *Web Workers* para evitar que un bucle infinito congele la pestaña del navegador del usuario.
* **Carga Inicial:** El navegador debe descargar el entorno de Pyodide (varios Megabytes) en la primera visita, retrasando el tiempo interactivo (TTI).

---

## Resumen de Decisión Técnica

| Característica | Opción 1 (Piston/Docker) | Opción 2 (Pyodide/WASM) |
| :--- | :--- | :--- |
| **Complejidad de Desarrollo** | Baja | Alta |
| **Carga en el Servidor** | Alta | Nula |
| **Latencia de Ejecución** | Media (Depende de la red) | Inmediata |
| **Madurez en el Proyecto** | MVP Recomendado | Evolución Futura |