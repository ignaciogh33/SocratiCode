import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from rest_framework.response import Response  # type: ignore
from .serializers import ExecuteInputSerializer, ExecuteOutputSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def execute_code(request):
    """Ejecuta código del alumno vía Piston. No pasa por Ollama."""
    serializer = ExecuteInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    source_code = serializer.validated_data['source_code']
    language = serializer.validated_data['language']
    version = serializer.validated_data['version']

    piston_url = f"{settings.PISTON_URL}/api/v2/execute"
    payload = {
        "language": language,
        "version": version,
        "files": [
            {"content": source_code}
        ],
    }

    try:
        if settings.DEBUG:
            print("\n" + "═"*70)
            print("⚙️  PETICIÓN A PISTON (Ejecución de código)")
            print("─"*70)
            print(f"🔧 Lenguaje: {language} v{version}")
            print(f"📝 Código:\n{source_code}")
            print("═"*70 + "\n")

        piston_response = requests.post(piston_url, json=payload, timeout=30)
        piston_data = piston_response.json()

        if settings.DEBUG:
            print("\n" + "═"*70)
            print("📤 RESPUESTA DE PISTON")
            print("─"*70)
            print(f"📊 Status HTTP: {piston_response.status_code}")
            print(f"📝 Data: {piston_data}")
            print("═"*70 + "\n")

    except requests.ConnectionError:
        return Response(
            {"error": "No se pudo conectar con el servicio de ejecución de código.", "details": None},
            status=503,
        )
    except requests.Timeout:
        return Response(
            {"error": "El servicio de ejecución de código tardó demasiado.", "details": None},
            status=504,
        )
    except Exception as e:
        return Response(
            {"error": f"Error inesperado: {str(e)}", "details": None},
            status=500,
        )

    if "message" in piston_data:
        return Response(
            {"error": piston_data["message"], "details": None},
            status=400,
        )

    # Para lenguajes compilados (C, Java, etc.)
    compile_data = piston_data.get("compile", {})
    run_data = piston_data.get("run", {})

    stdout = run_data.get("stdout", "")

    stderr = compile_data.get("stderr", "") + run_data.get("stderr", "")

    exit_code = run_data.get("code")
    signal = run_data.get("signal")
    status = run_data.get("status")

    if exit_code is None:
        exit_code = -1

    PISTON_STATUS_MESSAGES = {
        'CE': (
            '\n[Error de compilación]: El código no se ha podido compilar. '
            'Revisa errores graves de sintaxis, como llaves o puntos y coma sin cerrar.'
        ),
        'RE': (
            '\n[Error de ejecución]: El programa se detuvo con un error. '
            'Revisa la lógica de tu código (divisiones por cero, variables inexistentes, etc.).'
        ),
        'SG': (
            '\n[Error del sistema]: El proceso fue terminado por el sistema operativo '
            '(señal {signal}). Esto suele indicar que se superó el límite de memoria (RAM) '
            'o, en C/C++, un fallo de segmentación por uso incorrecto de punteros.'
        ),
        'TO': (
            '\n[Tiempo excedido]: El programa tardó demasiado y fue detenido. '
            'Revisa si tienes un bucle infinito (while True sin break).'
        ),
        'OL': (
            '\n[Salida demasiado larga]: Tu programa generó demasiado texto por '
            'la consola (stdout). Reduce la cantidad de print() o el tamaño de los datos que imprimes.'
        ),
        'EL': (
            '\n[Errores demasiado largos]: Tu programa generó demasiado texto de error '
            '(stderr). Revisa si estás produciendo excepciones en un bucle.'
        ),
        'XX': (
            '\n[Error interno]: Hubo un problema en la infraestructura de ejecución. '
            'Esto no es culpa de tu código. Inténtalo de nuevo más tarde.'
        ),
    }

    if status and status in PISTON_STATUS_MESSAGES:
        msg = PISTON_STATUS_MESSAGES[status]
        if '{signal}' in msg:
            msg = msg.format(signal=signal or 'desconocida')
        stderr += msg

    result = {
        "stdout": stdout.strip(),
        "stderr": stderr.strip(),
        "exit_code": exit_code,
        "language": language,
    }

    return Response(ExecuteOutputSerializer(result).data)
