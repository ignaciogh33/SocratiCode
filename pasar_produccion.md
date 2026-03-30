# 🚀 Checklist: Pasar SocratiCode a Producción

Esta es la lista de tareas y configuraciones que debes cambiar o asegurar ANTES de desplegar tu aplicación en un servidor de producción (como los VPS de DigitalOcean, AWS, Heroku, etc.), basándonos en el código actual.

## 1. Variables de Entorno (`.env`)
En tu servidor de producción, el archivo `.env` o las variables de entorno inyectadas deben tener estos valores estrictamente:
- [ ] `DEBUG=False` (Crucial. Si esto está en `True`, cualquier error expondrá todo tu código fuente e historial al mundo).
- [ ] `SECRET_KEY=tu-clave-secreta-gigante-y-aleatoria` (Nunca uses la de desarrollo, genera una nueva de 50 caracteres).
- [ ] `DATABASE_URL=postgres://usuario:contraseña@host:puerto/nombre_db` (Conectar a una base de datos segura de producción, no usar credenciales `admin:secret`).

## 2. Archivo `settings.py` (Modificaciones de Seguridad)
Tienes que entrar a `src/config/settings.py` y revisar lo siguiente:
- [ ] **`ALLOWED_HOSTS`**: Ahora mismo probablemente esté vacío `[]` o aceptando todo `['*']`. Debes configurarlo explícitamente con el dominio de tu servidor, ej: `ALLOWED_HOSTS = ['api.socraticode.com', 'www.socraticode.com', 'localhost']`.
- [ ] **Configuración de CORS**: 
  - Comentar o eliminar la línea `CORS_ALLOW_ALL_ORIGINS = True`.
  - Descomentar y configurar `CORS_ALLOWED_ORIGINS = ["https://tudominio-frontend.com"]` para que solo tu propia web Vue/React pueda hacerle peticiones a la API del backend.

## 3. Envío de Emails (Djoser y Gestión de Usuarios)
- [ ] **Backend SMTP**: En `settings.py`, debes buscar y reemplazar el bloque `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'` por un backend real (SMTP) como SendGrid, Amazon SES o Gmail, de lo contrario tus usuarios nunca podrán restablecer su contraseña.
  ```python
  EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
  EMAIL_HOST = 'smtp.sendgrid.net' # o el servicio que uses
  EMAIL_PORT = 587
  EMAIL_USE_TLS = True
  EMAIL_HOST_USER = env('EMAIL_USER')
  EMAIL_HOST_PASSWORD = env('EMAIL_PASSWORD')
  ```

## 4. Servicios Externos y URLs
- [ ] **Piston (Compilador de código)**: Cerciorarte de que la variable `PISTON_URL` en tu `.env` apunta al Piston desplegado en tu servidor de producción, NO a `http://localhost:2000`. Además, asegúrate de que el contenedor de Piston esté fuertemente securizado y aislado para evitar escapes del contenedor.
- [ ] **LLM**: Si usas un servicio de pago (OpenAI, Anthropic), verifica que tus tokens y el flag `LLM_MOD` están correctamente introducidos.

## 5. Servidor y Archivos Estáticos
- [ ] **Archivos Estáticos (CSS, JS del Admin)**: Ya instalamos `whitenoise`, lo cual es perfecto. Sólo asegúrate de ejecutar `python manage.py collectstatic --noinput` como parte de tu script de despliegue automatizado cada vez que subas código.
- [ ] **Servidor ASGI (Uvicorn)**: En producción, NO debes usar `uvicorn --reload`. El comando ideal para desplegar Uvicorn de forma estable y para servir el streaming (Server-Sent Events) correctamente sería algo manejado por gunicorn para multiproceso, o usando workers dedicados: `uv run uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --workers 4`.

## 6. Base de datos
- [ ] Realizar las migraciones en el servidor de producción: `python manage.py migrate`.
- [ ] Crear el superuser original del proyecto en el servidor de producción para poder acceder al Admin de Django: `python manage.py createsuperuser`.
