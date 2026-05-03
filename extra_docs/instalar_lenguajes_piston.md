# Guía de Instalación de Lenguajes en Piston (SocratiCode)

Esta guía explica cómo añadir soporte para nuevos lenguajes de programación en el contenedor de **Piston** que se usa como motor de ejecución segura de código en la aplicación SocratiCode.

## Entorno

SocratiCode utiliza la versión v3 de la API de Piston (`ghcr.io/engineer-man/piston`). A diferencia de versiones más antiguas que utilizaban el comando interno `piston ppman`, en esta versión **los paquetes se instalan mediante peticiones a la API web** que el propio contenedor levanta.

En nuestro entorno, el servicio de Docker `compiler` (Piston) expone el puerto `2000` de la máquina anfitriona hacia el contenedor. Por tanto, todas las peticiones se realizan hacia `http://localhost:2000`.

## 1. Ver lenguajes disponibles

Para ver qué lenguajes y versiones están disponibles para instalar, puedes hacer una petición GET a la API:

```bash
curl -s http://localhost:2000/api/v2/packages
```

El resultado será un JSON extenso listando todos los paquetes que puedes solicitar. Para buscar un lenguaje específico, puedes filtrar la salida por consola. Por ejemplo, para buscar Node:

```bash
curl -s http://localhost:2000/api/v2/packages | grep -i '"node"'
```

## 2. Instalar un nuevo lenguaje

Para instalar un paquete, debes realizar una petición POST a la misma ruta indicando en el cuerpo del JSON el `language` y la `version`. 

Ejecuta el comando en tu terminal local (no hace falta entrar dentro del contenedor con `docker exec`).

> **Nota importante:** Algunas instalaciones (como GCC/C++ o Java) implican descargar y descomprimir archivos grandes (>100MB). El terminal se quedará "congelado" hasta que termine el proceso. **Si el contenedor se apaga repentinamente** (por ejemplo debido a un micro-corte de red con GitHub al descargar), simplemente vuelve a arrancar el contenedor (`docker start tutor_compiler`) y vuelve a intentarlo.

### Ejemplo: Instalar GCC (Soporte para C y C++)

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "gcc", "version": "10.2.0"}'
```

### Ejemplo: Instalar Python

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'
```

### Ejemplo: Instalar Java

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "java", "version": "15.0.2"}'
```

## 3. Comprobar lenguajes instalados

Para verificar que la instalación se ha realizado correctamente o ver qué lenguajes tienes configurados en tu contenedor actual, haz una consulta al endpoint de `runtimes`:

```bash
curl -s http://localhost:2000/api/v2/runtimes
```

Esto devolverá un JSON únicamente con los lenguajes que Piston ya tiene listos para ejecutar.
