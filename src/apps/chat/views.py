import ollama
from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.permissions import IsAuthenticated, AllowAny # type: ignore
from rest_framework.response import Response # type: ignore
from django.shortcuts import get_object_or_404
from .models import ChatSession, Message
from .serializers import ChatInputSerializer, ChatResponseSerializer

SYSTEM_PROMPT = "Eres un tutor socrático. No des la solución, da pistas."

@api_view(['POST'])
# @permission_classes([IsAuthenticated]) # Descomentar para producción
def chat_view(request):
    # 1. VALIDACIÓN AUTOMÁTICA (DRF)
    serializer = ChatInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    # Datos limpios y seguros
    session_id = serializer.validated_data['session_id']
    user_text = serializer.validated_data['prompt']

    # 2. LÓGICA DE NEGOCIO
    session = get_object_or_404(ChatSession, id=session_id)
    
    # Guardar mensaje usuario
    Message.objects.create(session=session, role="user", content=user_text)

    # Recuperar historial (Context Window)
    history_objs = session.messages.order_by('created_at')[:10]
    messages_payload = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for msg in history_objs:
        messages_payload.append({'role': msg.role, 'content': msg.content})

    # 3. LLAMADA A LA IA (Síncrona)
    try:
        ai_response = ollama.chat(
            model='llama3.2', 
            messages=messages_payload, 
            stream=False
        )
        ai_text = ai_response['message']['content']
    except Exception as e:
        return Response({"error": f"Error en motor IA: {str(e)}"}, status=500)

    # 4. GUARDAR Y RESPONDER
    Message.objects.create(session=session, role="assistant", content=ai_text)

    # Usamos el serializador de salida para garantizar el formato JSON
    return Response(ChatResponseSerializer({
        "response": ai_text,
        "session_id": session.id
    }).data)
