import os
import ollama
from django.conf import settings
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

MODERATION_PROMPT = (
    "Eres un moderador de contenido educativo. Tu ÚNICA tarea es evaluar "
    "si el siguiente mensaje es apropiado para un estudiante. "
    "El mensaje NO debe contener: lenguaje vulgar, contenido sexual, "
    "violencia explícita, discriminación, instrucciones peligrosas, "
    "ni información personal sensible. "
    "Responde ÚNICAMENTE con la palabra 'OK' si el mensaje es apropiado, "
    "o 'NO' si no lo es. No añadas explicación alguna."
)

MODERATED_RESPONSE = (
    "Lo siento, no he podido generar una respuesta apropiada. "
    "¿Puedes reformular tu pregunta?"
)


def moderate_content(text: str) -> bool:
    """Devuelve True si el contenido es apropiado, False si no."""
    try:
        messages_payload = [
            {'role': 'system', 'content': MODERATION_PROMPT},
            {'role': 'user', 'content': text},
        ]
        
        if settings.DEBUG:
            print("\n" + "═"*70)
            print("🛡️  3. PETICIÓN AL SEGUNDO LLM (OLLAMA - MODERADOR)")
            print("─"*70)
            print("🛠️  [ROL DEL SISTEMA] (Reglas de moderación):")
            print(f"   {messages_payload[0]['content']}")
            print("─"*70)
            print("📩 [MENSAJE A EVALUAR] (Texto de la IA anterior):")
            print(f"   {messages_payload[1]['content']}")
            print("═"*70 + "\n")
            
        result = ollama.chat(
            model='llama3.2',
            messages=messages_payload,
            stream=False,
        )
        verdict = result['message']['content'].strip().upper()
        
        if settings.DEBUG:
            print("\n" + "═"*70)
            print("⚖️  4. RESPUESTA DEL SEGUNDO LLM (OLLAMA - MODERADOR)")
            print("─"*70)
            print(f"📝 [RESPUESTA CRUDA]: {result['message']['content']}")
            print(f"✅ [VEREDICTO FINAL]: {verdict}")
            print("═"*70 + "\n")
            
        return verdict == 'OK'
    except Exception:
        # Si el moderador falla, bloqueamos por seguridad
        return False


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

    # Recuperar historial (Context Window - Últimos 10 mensajes)
    # Obtenemos los 10 más recientes y revertimos la lista para orden cronológico
    history_objs = list(session.messages.order_by('-created_at')[:10])
    history_objs.reverse()
    
    messages_payload = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for msg in history_objs:
        messages_payload.append({'role': msg.role, 'content': msg.content})

    # 3. LLAMADA A LA IA (Síncrona)
    try:
        if settings.DEBUG:
            print("\n" + "═"*80)
            print("🤖 1. PETICIÓN AL PRIMER LLM (OLLAMA - CHAT)")
            print("─"*80)
            
            # System Prompt
            if len(messages_payload) > 0:
                print("🛠️  [ROL DEL SISTEMA] (Configuración / Personalidad):")
                print(f"   {messages_payload[0]['content']}")
                print("─"*80)
                
            # Historial previo
            if len(messages_payload) > 2:
                print("📚 [HISTORIAL PREVIO]:")
                # Iterar desde el índice 1 hasta el penúltimo (-1)
                for m in messages_payload[1:-1]:
                    role_str = "Tú" if m['role'] == 'user' else "IA"
                    print(f"   [{role_str}]: {m['content']}")
                print("─"*80)
                
            # Último mensaje del usuario
            if len(messages_payload) > 1:
                print("📩 [NUEVO MENSAJE] (Lo que envías ahora):")
                print(f"   {messages_payload[-1]['content']}")
                print("═"*80 + "\n")

        ai_response = ollama.chat(
            model='llama3.2', 
            messages=messages_payload, 
            stream=False
        )
        ai_text = ai_response['message']['content']
        
        if settings.DEBUG:
            print("\n" + "═"*80)
            print("🧠 2. RESPUESTA DEL PRIMER LLM (OLLAMA - CHAT)")
            print("─"*80)
            print("📝 [TEXTO GENERADO]:")
            print(f"   {ai_text}")
            print("═"*80 + "\n")
            
    except Exception as e:
        return Response({"error": f"Error en motor IA: {str(e)}"}, status=500)

    # 3.5. MODERACIÓN DE CONTENIDO
    do_moderation = getattr(settings, 'LLM_MOD', True)

    if do_moderation:
        is_safe = moderate_content(ai_text)
        if not is_safe:
            Message.objects.create(
                session=session, role="assistant",
                content=ai_text, moderated=True
            )
            ai_text = MODERATED_RESPONSE
    
        # 4. GUARDAR Y RESPONDER
        if is_safe:
            Message.objects.create(session=session, role="assistant", content=ai_text)
    else:
        # Modo rápido: nos saltamos el LLM moderador
        if settings.DEBUG:
            print("\n" + "═"*70)
            print("⚡ 3. MODERACIÓN DESACTIVADA (LLM_MOD=False)")
            print("─"*70)
            print("Guardando directamente la respuesta de la IA...")
            print("═"*70 + "\n")
            
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
