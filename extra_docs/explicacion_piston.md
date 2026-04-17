# Funcionamiento Interno de Piston en SocratiCode

La ejecución de código en la aplicación está delegada a **Piston**, un motor de ejecución remota diseñado específicamente para compilar y ejecutar código no confiable de manera segura y controlada. A continuación se desglosa el flujo y los mecanismos subyacentes.

## 1. El Flujo de Ejecución (Petición - Respuesta)
1. **Frontend:** El alumno escribe el código fuente en el editor y presiona "Ejecutar". Se envía el código (junto con el lenguaje y su versión).
2. **Backend (SocratiCode):** En `apps/compiler/views.py`, el backend recibe la petición, extrae el código y realiza una solicitud HTTP `POST` a la API de Piston (`http://[PISTON_URL]/api/v2/execute`). Pasa la información en un array de archivos en formato JSON.
3. **Contenedor Piston:** Piston recibe el payload, ejecuta el código en un entorno aislado, captura las salidas (salida estándar `stdout`, salida de errores `stderr`, y el código de retorno) y devuelve un resumen JSON.
4. **Backend -> Frontend:** Django la recibe, formatea correctamente los posibles errores —por ejemplo, detectando señales de detención como `SIGKILL` si ocurre un bucle infinito— y manda el resultado al frontend para mostrarlo al alumno.

## 2. Aislamiento y Entornos de Ejecución (Jobs)
**No se crea un contenedor de Docker por cada usuario ni por cada sesión.** Crear un contenedor de Docker tarda varios segundos, lo que haría a la aplicación demasiado lenta para una experiencia en tiempo real.

En cambio, Piston utiliza **Sandboxing basado en Linux (chroots, isolate o bwrap) y cgroups** dentro de un único contenedor Docker principal:
* Al recibir una ejecución, Piston inicia lo que llama un **"Job"** (Trabajo).
* Genera dinámicamente un directorio temporal, aislando la ejecución.
* El código del usuario se corre bajo un **usuario sin privilegios** (típicamente el usuario `piston` `uid=1000` dentro del entorno del sandbox). No tiene permisos de administrador (root).

## 3. Aislamiento del Sistema de Archivos y Persistencia (¿Pueden ver otros archivos?)
**Respuesta corta: No. Tienen los recursos completamente segregados.**
* **tmpfs (En memoria):** Fijándonos en tu archivo `docker-compose.yml`, el contenedor de Piston levanta los volúmenes `/piston/jobs` y `/tmp` como `tmpfs` (sistemas de archivo montados en la memoria RAM). Esto garantiza máxima velocidad.
* **Sesiones puras y efímeras:** Cuando Piston ejecuta un "job", lo hace en una nueva subcarpeta exclusiva dentro de ese tmpfs (ej. `/piston/jobs/uuid-del-trabajo/`). Una vez finaliza la ejecución o falla, **esa carpeta se purga y se destruye completamente**.
* **Protección del Host:** Puesto que Piston se ejecuta dentro de su propio contenedor de Docker (`tutor_compiler`), el código del alumno ni siquiera sabe de la existencia de tu sistema base real (tus archivos del TFG de Ubuntu, tus tokens de `.env` o código fuente backend). El sandbox restringe el binario para que la carpeta raíz sea únicamente el entorno de trabajo del lenguaje.

## 4. Limitación de Recursos (Seguridad contra ataques DoS)
Para evitar que un alumno malintencionado —o uno novato que se equivoca— tumbe nuestro servidor ejecutando bucles infinitos (`while True`), recursión infinita o consumiendo mucha RAM, Piston aplica restricciones de entorno estrictas:
1. **CPU / Tiempo:** Cada ejecución tiene un límite máximo de vida estricto (timeouts típicos de 3 segundos). Si el código rebasa el tiempo, Piston manda un `SIGKILL` destruyendo el proceso. (En tu `views.py` está excelentemente gestionado, cuando `signal == 'SIGKILL'` el backend le muestra al alumno que ha superado el tiempo o existe un bucle infinito).
2. **Memoria Restringida:** El código del sandbox no puede exigir gigabytes de memoria u ocupar el disco entero; Piston deniega la asignación y aborta la ejecución en caso de abuso (Ej: Memory Limits & Out Of Memory killers).
3. **Cantidad de procesos:** Límite máximo del número de procesos hijos para evitar ataques de replicación en cadena (*Fork Bomb*). Del mismo modo, el acceso a la red externa suele bloquearse por defecto dentro del SandBox del binario.

## 5. Resumen Comparativo para la Memoria (Implementación)

En la sección de tu memoria dedicada a la implementación y seguridad (ya que anotaste "Investigar la seguridad de piston y explicarlo en el apartado implementación" y "decir que la seguridad es floja por piston"), te sugiero enfocarlo así:

*Puedes decir que aunque Piston provee una buena capa de seguridad inicial, la seguridad nativa a nivel del clúster se podría endurecer (trabajo futuro).*

> *"Debido a la naturaleza del Tutor Socrático, donde el sistema interactúa directamente con el código no confiable provisto por los estudiantes, era imperativo contar con un entorno de ejecución estanco (sandbox). Se descartó la virtualización dinámica de contenedores Docker por petición debido al retraso temporal inasumible (overhead) que perjudicaría la interacción en tiempo real. En su lugar se ha integrado **Piston**, un motor tolerante a fallos que funciona mediante trabajos (*jobs*) efímeros ubicados en almacenamiento volátil (`tmpfs` en RAM). Aprovecha tecnologías del núcleo de Linux (`cgroups`, `chroot`) para restringir la asignación de CPU, uso de memoria RAM, accesos de red y tiempo máximo de vida del proceso ejecutado mediante un usuario sin privilegios plenos. Esto impide que los archivos de distintas ejecuciones se mezclen y protege el sistema huésped (host) contra fugas de información, intentos de desbordamiento u operaciones perjudiciales (como bucles infinitos, mitigados mediante señales SIGKILL pre-programadas)."*
