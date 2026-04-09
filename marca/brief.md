### **SOCRATICODE - HOJA DE ESPECIFICACIONES DE DISEÑO UI/UX**

#### **1. CONCEPTO DE MARCA Y MISIÓN**

SocratiCode se define como un **Tutor Personal Socrático**, no una academia de programación. La identidad visual debe transmitir **concienzuda paciencia**, **sabiduría intelectual** y **tecnología avanzada pero accesible**. El diseño debe ser un puente entre el alumno y el conocimiento, evitando la estética infantil o la frialdad corporativa.

#### **2. SISTEMA DE DISEÑO VISUAL (SISTEMA CORE)**

-----

**A. Paleta de Colores (Brand Identity - Actualizada)**

Esta paleta utiliza grises fríos para la estructura y el acento de marca para la identidad y las acciones.

* **Color de Marca (Primary):** `#94618E`
    * *Uso:* Botones de acción principal (Enviar, Nuevo chat, Ejecutar), bordes de elementos activos, borde de la viñeta de los mensajes del alumno, nombres de usuario y el logotipo.
* **Color Secundario (Hint):** `#B8860B`
    * *Uso:* Exclusivo para las pistas socráticas y detalles específicos que requieran atención.
* **Fondo Sidebar:** `#1A1515`
    * *Uso:* Color de fondo sólido para el panel lateral izquierdo (expandido o minimizado).
* **Fondo Chat:** `#262624`
    * *Uso:* Color de fondo para el área de lectura de la conversación.
* **Fondo Caja de Texto:** `#30302E`
    * *Uso:* Fondo del input inferior donde el alumno escribe sus dudas o pega su código.
* **Editor de Código y Terminal:**
    * *Uso:* Se utilizarán estrictamente los colores predeterminados del componente Monaco Editor (tema oscuro).
* **Estados del Sistema:**
    * **Error:** `#D62828` (Alertas y fallos de compilación).
    * **Éxito:** `#2D5A27` (Ejecución correcta).
* **Textos:**
    * **Sobre color pleno:** `#FFFFFF` (ej. texto blanco sobre el botón primario).
    * **Texto de lectura:** `#D4D4D4` (Gris claro para la interfaz y el chat).


**B. Tipografía (Prioridad: Legibilidad y Estilo - Actualizada)**

| Categoría | Fuente | Tamaños Específicos | Muestra Visiva |
| :--- | :--- | :--- | :--- |
| **UI y Chat (Sans-serif)** | **Inter** (Recomendación Principal) | H1 (36-48px), Títulos Sesión (14px semibold), Cuerpo Chat (16px), Input Text (16px). | `Inter, Helvetica, sans-serif` |
| **Código y Output (Monospace)** | **Fira Code** (Recomendación Principal) | 14px-15px (con ligaduras de programación). | `Fira Code, Source Code Pro, monospace` |

**La fuente de marca es la que se usa para el logo, la cual es una fuente personalizada está por definir**

-----

**C. Logos de Marca (Uso Correcto - Actualizado)**

Se ha creado una versión corregida del logo para alinearse con el nuevo color de marca `#94618E`. El logo principal es la variante de línea minimalista que integra la cara de Sócrates con un terminal prompt.

| Variante de Logo | Uso Específico | Visualización Corregida |
| :--- | :--- | :--- |
| **Logo de Marca Principal** (Línea \#94618E) | Cabecera del sidebar, pantallas de login. Variante **minimalista de cara y prompt integrado**. |  |
| **Logo con Texto** (Línea \#94618E + Texto) | Cabecera de sidebar cuando hay espacio, landing pages. |  |

-----

#### **3. ARQUITECTURA DE INFORMACIÓN Y PANTALLAS ESPECÍFICAS**

El diseño de pantallas sigue una estructura de **Single Page Application (SPA)** de tres columnas, con paneles resizables por el usuario. El tema predeterminado es **Oscuro (Dark Theme)**.

-----

**1. PANTALLA PÚBLICA (LANDING / LOGIN)**

  * **Diseño:** Limpio, minimalista. Concepto: "Aprende pensando, no copiando".
  * **Elementos:**
      * **Logo Corregido:** Variante de cara y prompt integrado en línea `#94618E`, centrado.
      * Slogan grande: "Tu código. Tus pistas. Tu aprendizaje." (Inter).
      * Formulario centrado: Email (placeholder con ejemplo), Password.
      * Botón **"Iniciar Sesión"** en fondo `#94618E` con texto blanco.
      * Links: "¿Olvidaste tu contraseña?" y "Crear una cuenta" en color `#94618E`.

-----

**2. PANTALLA DE PANEL DE CONTROL (EXPANDIDO)**

  * **Layout:** Tres columnas, sidebar completamente visible.
  * **Sidebar (Izquierda, estrecha, `#1A1515`):**
      * Logo de SocratiCode corregido arriba.
      * Botón destacado **"Nueva Conversación"** con fondo `#94618E` y texto blanco. Icono "+".
      * Lista de chats anteriores con iconos y títulos. Chat activo resaltado sutilmente.
      * Botón de Configuración/Perfil y Cerrar Sesión abajo. Icono para alternar sidebar.
  * **Chat (Derecha, ancha, `#262624`):**
      * Historial de chat con burbujas.
      * **UX Crítica:** Editor de código y chat son visibles simultáneamente sin solaparse.

-----

**3. PANTALLA DE PANEL DE CONTROL (MINIMIZADO)**

  * **Layout:** Tres columnas, sidebar reducido a una columna de iconos para ganar espacio de contenido.
  * **Sidebar (Izquierda, mínima, `#1A1515`):**
      * Logo corregido simplificado.
      * Botón "Nueva Conversación" reducido a icono "+".
      * Iconos de chats recientes. Iconos de perfil y logout.
      * Icono para desplegar sidebar.
  * **Contenido:** El área del chat ocupa la mayor parte de la pantalla.

-----

**4. PANTALLA DE PANEL DE CONTROL (CÓDIGO Y TERMINAL)**

  * **Layout:** Tres columnas resizables. Sidebar completamente visible.
  * **Área del Editor de Código (Centro, `#1E1E1E`):**
      * Selector de Lenguaje dropdown.
      * Componente Monaco Editor con números de línea y Fira Code (ej. Python de `image_20.png`).
      * Botón flotante **"EJECUTAR"** con estado (ej. "EJECUTAR"). Fondo `#94618E` con texto blanco.
  * **Área del Terminal (Inferior):**
      * Terminal output integrado abajo del editor. Muestra la ejecución del código (ej. Fibonacci de `image_20.png`). Fira Code.
      * Se puede abrir/cerrar desde un botón en el sidebar.
  * **Chat (Derecha):** Visible simultáneamente.

-----

**5. PANTALLA DE PANEL DE CONTROL (MINIMIZADO CON CÓDIGO Y TERMINAL)**

  * **Layout:** Tres columnas resizables. Sidebar reducido a iconos.
  * **Sidebar (Izquierda, mínima, `#1A1515`):** Iconos de acceso rápido.
  * **Contenido:** El área del editor de código y terminal output ocupan la mayor parte de la pantalla, con el chat ocupando la columna derecha.

-----

#### **4. DETALLES DE UI/UX ESPECÍFICOS**

  * **Títulos de Sesión:** Texto "SocratiCode" en letra de marca (letra definida para el logo), color `#94618E` primary.
  * **Avatares de Chat:**
      * **IA Profile:** Burbuja alineada a la izquierda, borde sutil `#94618E` primary, avatar de "Modern Socrates" o sabiduría.
      * **User Profile:** Burbuja alineada a la derecha, color gris neutro `#2D2D2D`, avatar de "Estudiante".
  * **UX Crítica:** Editor de código y chat visibles simultáneamente sin solaparse. Drag handles para ajustar relative width chat vs código.
  * **Efecto de Streaming SSE:** Tokens de IA aparecen de golpe suavemente concatenándose a velocidad natural reactivamente.
  * **Renderizado de Markdown:** Bloques de código en chat con syntax highlighting y botón "Copiar código".
  * **Estados de Carga:** *Skeleton loader* para sesiones, tres puntos animados para IA pensando.
  * **Ajustes Adicionales:** El usuario puede modificar tamaño de sidebar, abrir/cerrar terminal y output desde sidebar, ajustar chat/código.