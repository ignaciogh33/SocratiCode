# Tabla 3-4: Caso de Uso CU2 — Compilación y Ejecución de Código en Piston

| Campo              | Descripción                                                                                                                                                                                                                       |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Identificador**  | CU2                                                                                                                                                                                                                               |
| **Nombre**         | Compilación y ejecución de código en sandbox                                                                                                                                                                                      |
| **Actor principal**| Alumno (usuario autenticado)                                                                                                                                                                                                      |
| **Actores secundarios** | Piston (contenedor Docker de ejecución de código)                                                                                                                                                                            |
| **Descripción**    | El alumno ejecuta el código de su editor en un entorno sandbox aislado (Piston). El sistema envía el código fuente, el lenguaje y la versión al contenedor, y devuelve la salida estándar (`stdout`), los errores (`stderr`) y el código de salida. |
| **Precondiciones** | 1. El alumno está autenticado (JWT válido). <br> 2. El contenedor Piston (`tutor_compiler`) está activo y accesible en `PISTON_URL` (por defecto `http://localhost:2000`). <br> 3. El runtime del lenguaje solicitado está instalado en Piston. |
| **Postcondiciones**| 1. El alumno recibe la salida de ejecución (`stdout`, `stderr`, `exit_code`). <br> 2. No se persiste ningún dato de ejecución en la base de datos (operación efímera). <br> 3. Los archivos temporales en el contenedor se eliminan automáticamente (tmpfs). |

## Flujo Principal (Happy Path)

| Paso | Actor   | Acción                                                                                                                                                                  |
|------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1    | Alumno  | Pulsa el botón "Ejecutar" en el editor. El frontend envía `POST /api/compiler/execute/` con `{ source_code, language, version }`.                                        |
| 2    | Sistema | Valida los datos de entrada mediante `ExecuteInputSerializer`. Valores por defecto: `language='python3'`, `version='3.10.0'`.                                            |
| 3    | Sistema | Construye el payload para la API de Piston: `{ language, version, files: [{ content: source_code }] }`.                                                                  |
| 4    | Sistema | Envía `POST` a `{PISTON_URL}/api/v2/execute` con el payload JSON. Timeout: 30 segundos.                                                                                 |
| 5    | Piston  | Ejecuta el código en un sub-contenedor aislado. Para lenguajes compilados (C, Java), primero compila y luego ejecuta.                                                    |
| 6    | Piston  | Devuelve la respuesta JSON con los campos `compile` (opcional), `run.stdout`, `run.stderr`, `run.code` y `run.signal`.                                                   |
| 7    | Sistema | Procesa la respuesta: extrae `stdout`, concatena `stderr` de compilación y ejecución, extrae `exit_code` (o asigna `-1` si es `null`).                                  |
| 8    | Sistema | Devuelve al frontend: `{ stdout, stderr, exit_code, language }` con HTTP 200.                                                                                            |
| 9    | Frontend| Muestra `stdout` en el panel de salida del editor. Si `stderr` no está vacío, lo muestra como error.                                                                     |

## Flujos Alternativos

| ID    | Condición                                          | Acción del sistema                                                                                                                                                        |
|-------|----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FA-01 | Piston no accesible (`ConnectionError`)            | Se devuelve HTTP 503 con `{"error": "No se pudo conectar con el servicio de ejecución de código.", "details": null}`.                                                      |
| FA-02 | Timeout de ejecución (`requests.Timeout`)          | Se devuelve HTTP 504 con `{"error": "El servicio de ejecución de código tardó demasiado.", "details": null}`.                                                              |
| FA-03 | Señal SIGKILL recibida                             | El programa del alumno ha excedido el límite de tiempo de Piston. Se añade al `stderr`: `"[Error del Sistema]: El programa ha superado el límite de tiempo y ha sido detenido. Revisa si tienes un bucle infinito (while True)."` |
| FA-04 | Error de Piston (campo `message` en respuesta)     | Se devuelve HTTP 400 con el mensaje de error de Piston (ej: lenguaje no instalado).                                                                                        |
| FA-05 | Error inesperado del servidor                      | Se devuelve HTTP 500 con `{"error": "Error inesperado: <detalle>", "details": null}`.                                                                                      |
| FA-06 | Error de compilación (lenguajes compilados)        | `compile.stderr` contiene los errores del compilador. Se concatena con `run.stderr` y se devuelve al alumno como `stderr`.                                                |
