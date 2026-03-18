import ollama
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from rest_framework.response import Response  # type: ignore
from django.shortcuts import get_object_or_404
from .models import ChatSession, Message
from .serializers import (
    ChatInputSerializer, ChatResponseSerializer,
    ChatSessionSerializer, ChatSessionDetailSerializer,
)

SYSTEM_PROMPT = "Eres un tutor socrático. No des la solución, da pistas."


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_view(request):
    # 1. VALIDACIÓN AUTOMÁTICA (DRF)
    serializer = ChatInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    # Datos limpios y seguros
    session_id = serializer.validated_data.get('session_id')
    user_text = serializer.validated_data['prompt']

    # 2. LÓGICA DE NEGOCIO
    if session_id:
        session = ChatSession.objects.filter(id=session_id, user=request.user).first()
        if not session:
            return Response({"error": "Sesión no encontrada."}, status=404)
    else:
        session = ChatSession.objects.create(user=request.user)
    
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """Lista las sesiones de chat del usuario autenticado."""
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    serializer = ChatSessionSerializer(sessions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """Crea una nueva sesión de chat vacía para el usuario autenticado."""
    session = ChatSession.objects.create(user=request.user)
    return Response(ChatSessionSerializer(session).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_detail(request, session_id):
    """Devuelve el detalle de una sesión con todos sus mensajes."""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    serializer = ChatSessionDetailSerializer(session)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    """Elimina una sesión de chat y todos sus mensajes (CASCADE)."""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    session.delete()
    return Response(status=204)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def rename_session(request, session_id):
    """Renombra una sesión de chat."""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    title = request.data.get('title')
    if not title or not title.strip():
        return Response({"error": "El campo 'title' es obligatorio."}, status=400)
    session.title = title.strip()[:200]
    session.save(update_fields=['title'])
    return Response(ChatSessionSerializer(session).data)
