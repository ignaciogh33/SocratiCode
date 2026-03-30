### 🎨 BRIEFING DE DISEÑO DE MARCA Y UI/UX (SocratiCode)

**Concepto de Marca:**
SocratiCode no es una simple academia de programación. Es un **Tutor Personal Socrático**. La identidad visual debe transmitir **concienzuda paciencia**, **sabiduría intelectual** y **tecnología avanzada pero accesible**. No debe parecer un juguete (como Scratch), pero tampoco una herramienta de desarrollo corporativa intimidante (como VS Code puro). Es un puente entre el alumno y el conocimiento.

**Público Objetivo:** Estudiantes de programación (todas las edades), principiantes o intermedios.

---

#### 1. Arquitectura de Información y Pantallas

La aplicación debe comportarse como una **Single Page Application (SPA)** muy fluida. Se recomienda fuertemente ofrecer un **Tema Claro (Light)** y un **Tema Oscuro (Dark)**, siendo el oscuro el predeterminado para el editor de código.

**A. Pantalla Pública (Landing / Login)**
* **Diseño:** Limpio, minimalista. Debe vender el concepto de "Aprende pensando, no copiando".
* **Elementos:**
    * Slogan grande y claro (ej: "Tu código. Tus pistas. Tu aprendizaje.").
    * Formulario de Login muy sencillo (Email/Password).
    * *(Opcional: Si el alumno se registra solo, un formulario de registro. Si no, ignorar).*

**B. Pantalla Principal del Panel de Control (Dashboard)**
* Esta es la pantalla central donde el alumno pasa el 90% del tiempo.
* **Layout (Estructura):** Se recomienda un diseño de tres columnas:
    1.  **Sidebar Lateral (Izquierda, estrecha):**
        * Logo de SocratiCode arriba.
        * Botón destacado "Nueva Conversación".
        * Lista de chats anteriores (paginado).
        * Botón de Configuración/Perfil y Cerrar Sesión abajo.
    2.  **Área del Editor de Código (Centro, ancha):**
        * Selector de Lenguaje (desplegable).
        * El componente de Monaco Editor ocupando casi todo el alto.
        * Botón flotante o destacado "Ejecutar Código" (Compilador).
    3.  **Área del Chat (Derecha, ancha):**
        * Burbujas de chat del historial (con scroll infinito).
        * Input de texto del alumno abajo.
        * Botón de enviar.
* **UX Crítica:** El editor de código y el chat deben ser visibles simultáneamente sin solaparse. La IA (en el chat) hará referencia a líneas del editor central.

**C. Configuración / Perfil (Opcional, puede ser un modal)**
* Cambio de contraseña.
* Selector de Tema (Claro/Oscuro).

---

#### 2. Sistema de Diseño Visual (Colores y Tipografía)

**A. Paleta de Colores (Brand Identity)**
Buscamos colores que denoten tecnología pero también educación y confianza. Se recomienda usar una base de **Greys (Grises)** fríos para la interfaz y un color de acento intelectual.

* **Tema Oscuro (Recomendado por defecto):**
    * **Fondo Principal:** `#1E1E1E` (Gris oscuro tipo VS Code, reduce fatiga visual).
    * **Fondo de Paneles/Chat:** `#252526` (Ligeramente más claro para diferenciar).
    * **Burbuja Alumno:** `#2D2D2D` o gris oscuro con borde sutil.
    * **Burbuja IA (Tutor):** Un toque del color de acento (ej: `#213547` o un degradado sutil).

* **Tema Claro (Alternativo):**
    * **Fondo Principal:** `#FFFFFF` (Blanco puro).
    * **Fondo de Paneles/Chat:** `#F5F5F7` (Gris ultra claro).
    * **Burbuja Alumno:** `#E9E9EB` (Gris suave).
    * **Burbuja IA (Tutor):** `#D1E3F7` (Azul muy suave).

* **Color de Acento (Identidad de Marca):** Un azul intelectual o morado tecnológico.
    * **Recomendación 1 (Modern Tech):** Indigo (`#4F46E5`).
    * **Recomendación 2 (Académico Trust):** Teal (`#008080`). *Usemos el **Indigo (`#4F46E5`)** por defecto.*

* **Colores de Estado:**
    * Error (Alertas/Stderr): `#EF4444` (Rojo).
    * Éxito (Compilación OK): `#10B981` (Verde esmeralda).
    * Pistas (Resaltado en chat): `#F59E0B` (Ámbar).

**B. Tipografía**
La legibilidad es la prioridad número uno. Necesitamos una tipografía moderna para la interfaz y una monoespaciada para el código.

1.  **UI y Chat (Sans-serif):**
    * **Fuente:** Inter (moderna, ultra-legible en pantallas y gratuita en Google Fonts), Roboto, o Lato. Recomiendo fuertemente **Inter**.
    * **Tamaños:**
        * Títulos H1 (Landing): `36px` - `48px`.
        * Títulos de Sesión (Sidebar): `14px` (Semibold).
        * Cuerpo del Chat (Mensajes): `16px`.
        * Input text: `16px`.

2.  **Editor de Código y Output (Monospace):**
    * **Fuente:** Fira Code (gratuita, con ligaduras de programación que se ven geniales), Source Code Pro, o Monaco. Recomiendo **Fira Code**.
    * **Tamaño:** `14px` o `15px`. El usuario debe poder hacer zoom.

---

#### 3. Detalles de UI/UX Específicos

* **Efecto de Streaming (SSE):** Los tokens de Ollama no deben aparecer de golpe. Deben aparecer suavemente, concatenándose a una velocidad de lectura natural. No usar animaciones de "fade-in" para cada letra, simplemente añadir el texto (`+=`) de forma reactiva.
* **Renderizado de Markdown:** Los bloques de código dentro del chat (ej: ````python...````) deben tener resaltado de sintaxis dentro de la burbuja y un botón de "Copiar código" integrado.
* **Burbujas del Chat:** Diferenciar claramente quién habla.
    * **Alumno (User):** Burbuja alineada a la derecha, color gris neutro, avatar de "Estudiante".
    * **IA (Socratic Tutor):** Burbuja alineada a la izquierda, borde sutil del color de acento Indigo, avatar de "Sócrates moderno" o búho de la sabiduría.
* **Estados de Carga:** Usar un *skeleton loader* (barras grises animadas) mientras se carga la lista de sesiones inicial. Mientras la IA piensa (antes del primer token del stream), usar un indicador de "La IA está redactando pistas..." (ej: tres puntitos animados).

---

### 🦉 SUGERENCIAS DE LOGO PARA SOCRATICODE

Me pides una descripción para el logo. Aquí tienes tres opciones conceptuales para dárselas a un diseñador o usar en un generador de imágenes.

**Concepto Clave:** "Unión del mundo clásico (Sócrates/Filosofía) y el mundo moderno (Código/IA)".

#### Opción 1: El Sócrates Sintáctico (Intelectual y Tech)
* **Descripción:** Un busto minimalista y abstracto de Sócrates (barba característica). El busto no está dibujado con líneas normales, sino formado por caracteres de código: corchetes `{}`, símbolos menor/mayor `< >` y barras `/`. Es como si la sabiduría de Sócrates estuviera "programada".
* **Símbolo:** Una silueta limpia de Sócrates con una `</>` estilizada en la barba.
* **Uso:** Muy potente para marca seria.

#### Opción 2: El Búho Programador (Sabiduría y Accesibilidad)
* **Descripción:** Un búho (animal que representa la sabiduría clásica y la filosofía) con un diseño geométrico y moderno. Sus ojos grandes no son pupilas, son corchetes `{ }`. El búho está posado sobre una barra de código `_` o una barra de scroll.
* **Símbolo:** Una cara de búho simplificada hecha de símbolos de sintaxis de programación.
* **Uso:** Más amigable para alumnos jóvenes, transmite paciencia.

#### Opción 3: La Pista Iluminada (Acción y Propósito)
* **Descripción:** Un símbolo de cursor de terminal parpadeando (`>_`) o un prompt de Python (`>>>`). De la barra del prompt parpadeante (`_`) sale hacia arriba una chispa o un destello de luz dorado que forma una bombilla estilizada. La bombilla representa la "idea" o la "pista" socrática que te ilumina.
* **Símbolo:** Un prompt de consola que genera una chispa dorada de idea.
* **Uso:** Muy directo sobre lo que hace la aplicación.

**Recomendación Personal:** La **Opción 1** (Sócrates sintáctico) o la **Opción 2** (Búho con ojos corchetes) son las más originales y capturan mejor la esencia "Socrática" + "Code".
