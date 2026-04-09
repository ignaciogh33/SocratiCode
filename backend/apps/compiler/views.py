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
    # 1. VALIDACIÓN
    serializer = ExecuteInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    source_code = serializer.validated_data['source_code']
    language = serializer.validated_data['language']
    version = serializer.validated_data['version']

    # 2. LLAMADA A PISTON
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

    # 3. PROCESAR RESPUESTA DE PISTON
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

    # Si exit_code es None, le asignamos -1
    if exit_code is None:
        exit_code = -1

    if signal == "SIGKILL":
        stderr += (
            "\n[Error del Sistema]: El programa ha superado el límite de tiempo "
            "y ha sido detenido. Revisa si tienes un bucle infinito (while True)."
        )

    result = {
        "stdout": stdout.strip(),
        "stderr": stderr.strip(),
        "exit_code": exit_code,
        "language": language,
    }

    return Response(ExecuteOutputSerializer(result).data)
