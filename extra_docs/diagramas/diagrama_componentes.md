# Figura 3-6: Diagrama de Componentes del Sistema

Este diagrama ilustra a alto nivel los cinco componentes principales que conforman la arquitectura de SocratiCode y cómo interactúan entre sí, de una manera simplificada y directa.

```mermaid
flowchart TD
    %% Nodos principales (Componentes)
    Cliente["💻 Cliente Web (Frontend)<br/><i>Vue 3 SPA</i>"]
    Backend["⚙️ Servidor Backend (API)<br/><i>Django 6.0</i>"]
    DB[("💾 Base de Datos<br/><i>PostgreSQL</i>")]
    Ollama["🧠 Motor de Inteligencia Artificial<br/><i>Ollama (Modelos Locales)</i>"]
    Piston["📦 Sandbox de Ejecución de Código<br/><i>Piston (Docker)</i>"]

    %% Conexiones e Interfaces
    Cliente <-->|"1. Peticiones HTTP/JSON<br/>2. Streaming asíncrono (SSE)"| Backend
    Backend <-->|"Lectura y Escritura (ORM)"| DB
    Backend <-->|"API REST interna<br/>(Generación y Moderación)"| Ollama
    Backend <-->|"Envío de código fuente<br/>Recepción de stdout/stderr"| Piston

    %% Estilos simples
    classDef frontend fill:#E3F2FD,stroke:#1565C0,stroke-width:2px;
    classDef backend fill:#FFF3E0,stroke:#E65100,stroke-width:2px;
    classDef db fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
    classDef ai fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px;
    classDef sandbox fill:#FFF9C4,stroke:#F57F17,stroke-width:2px;

    class Cliente frontend;
    class Backend backend;
    class DB db;
    class Ollama ai;
    class Piston sandbox;
```

## Descripción de los componentes:

1. **Cliente Web (Frontend)**: La interfaz con la que interactúa el alumno. Construida como una aplicación de página única (SPA) con Vue 3. Se encarga de capturar la entrada del usuario, mostrar la interfaz del chat y el editor de código, y renderizar en tiempo real el streaming de respuestas del tutor.
2. **Servidor Backend (API)**: El núcleo orquestador del sistema desarrollado en Django. Gestiona la lógica de negocio, la autenticación de usuarios, coordina el streaming Server-Sent Events (SSE) hacia el frontend y actúa como puente de comunicación (proxy) seguro con los servicios externos.
3. **Base de Datos**: Sistema de persistencia (PostgreSQL) donde se almacenan a largo plazo los usuarios, sus historiales de sesiones, los mensajes de chat enviados/recibidos y la configuración global del sistema.
4. **Motor de Inteligencia Artificial**: Servicio autónomo (Ollama) encargado de realizar la inferencia de los modelos de lenguaje (LLMs) localmente. Provee tanto el flujo conversacional del tutor socrático como las evaluaciones de moderación de contenido.
5. **Sandbox de Ejecución de Código**: Entorno aislado (Piston) que recibe código fuente en distintos lenguajes, lo compila o interpreta dentro de un sub-contenedor efímero, y devuelve los resultados (salida estándar o errores) de forma segura sin comprometer la máquina anfitriona.
