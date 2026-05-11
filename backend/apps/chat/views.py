import json
import asyncio
import ollama
from django.utils import timezone
from django.conf import settings
from django.http import StreamingHttpResponse
from asgiref.sync import sync_to_async
from adrf.decorators import api_view as async_api_view  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from rest_framework.response import Response  # type: ignore
from django.shortcuts import get_object_or_404
from .models import ChatSession, Message, SystemConfig
from config.pagination import SessionPagination, MessagePagination
from .serializers import (
    ChatInputSerializer,
    ChatSessionSerializer, ChatSessionDetailSerializer,
    MessageSerializer,
)

from .prompts import (
    SYSTEM_PROMPT,
    INPUT_MODERATION_PROMPT,
    OUTPUT_MODERATION_PROMPT,
    MODERATED_RESPONSE,
)
def moderate_input(user_text: str, code_context: str = "", mod_model: str = 'llama3.2') -> bool:
    """Modera el INPUT del alumno (prompt + código). Síncrono y rápido."""
    try:
        content_to_evaluate = user_text
        if code_context:
            content_to_evaluate += f"\n\nCódigo del alumno:\n{code_context}"

        messages_payload = [
            {'role': 'system', 'content': INPUT_MODERATION_PROMPT},
            {'role': 'user', 'content': content_to_evaluate},
        ]

        result = ollama.chat(
            model=mod_model,
            messages=messages_payload,
            stream=False,
        )
        verdict = result['message']['content'].strip().upper()
        is_ok = verdict.startswith('OK')

        if settings.DEBUG:
            status = '✅ SAFE' if is_ok else '🚫 BLOCKED'
            print(f"   └─ Veredicto: {status}  (raw: {result['message']['content'].strip()})")

        return is_ok
    except Exception:
        if settings.DEBUG:
            print("   └─ Veredicto: ⚠️  ERROR (fail-closed: bloqueado)")
        return False


# Contador global para numerar los checks de output moderation por petición
_output_mod_counter = 0

async def moderate_output_async(text: str, mod_model: str = 'llama3.2') -> bool:
    """Modera un fragmento de la salida del LLM. Totalmente async."""
    global _output_mod_counter
    try:
        client = ollama.AsyncClient()
        result = await client.chat(
            model=mod_model,
            messages=[
                {'role': 'system', 'content': OUTPUT_MODERATION_PROMPT},
                {'role': 'user',   'content': text},
            ],
            stream=False,
        )
        verdict = result['message']['content'].strip().upper()
        is_ok = verdict.startswith('OK')

        if settings.DEBUG:
            _output_mod_counter += 1
            wc = len(text.split())
            status = '✅' if is_ok else '🚫'
            print(f"   │  check #{_output_mod_counter}: {status} ({wc} palabras acumuladas)")

        return is_ok
    except Exception:
        return True  # fail-open para no romper el stream


def _get_or_create_session(session_id, user):
    """Obtiene o crea una sesión. Devuelve (session, error_response)."""
    if session_id:
        session = ChatSession.objects.filter(id=session_id, user=user).first()
        if not session:
            return None, Response({"error": "Sesión no encontrada.", "details": None}, status=404)
        return session, None
    else:
        session = ChatSession.objects.create(user=user)
        return session, None


def _build_messages_payload(session, code_context, last_output, language):
    """Construye el array de mensajes para Ollama (historial + contexto de código)."""
    history_objs = list(session.messages.order_by('-created_at')[:10])
    history_objs.reverse()

    messages_payload = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for msg in history_objs:
        messages_payload.append({'role': msg.role, 'content': msg.content})

    if code_context:
        context_parts = [
            f"El alumno tiene este código en el editor:\n```{language}\n{code_context}\n```"
        ]
        if last_output:
            context_parts.append(
                f"La última salida de ejecución fue:\n```\n{last_output}\n```"
            )
        context_msg = "\n\n".join(context_parts)
        messages_payload.insert(1, {'role': 'system', 'content': context_msg})

    return messages_payload


def _mark_user_message_moderated(session_id):
    """Marca el último mensaje del usuario en la sesión como moderado."""
    user_msg = (
        Message.objects.filter(session_id=session_id, role="user")
        .order_by('-created_at').first()
    )
    if user_msg:
        user_msg.moderated = True
        user_msg.save(update_fields=['moderated'])


@async_api_view(['POST'])
@permission_classes([IsAuthenticated])
async def chat_view(request):
    """Endpoint principal del chat."""
    serializer = ChatInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    session_id = serializer.validated_data.get('session_id')
    user_text = serializer.validated_data['prompt']
    code_context = serializer.validated_data.get('code_context', '')
    last_output = serializer.validated_data.get('last_output', '')
    language = serializer.validated_data.get('language', 'python')

    # 2. OBTENER / CREAR SESIÓN (sync → async)
    session, error = await sync_to_async(_get_or_create_session)(session_id, request.user)
    if error:
        return error

    # Extraer ID primitivo ANTES del generador (evita SynchronousOnlyOperation)
    safe_session_id = session.id

    # 3. GUARDAR MENSAJE DEL USUARIO + AUTO-NAMING + TOUCH updated_at
    await sync_to_async(Message.objects.create)(
        session_id=safe_session_id, role="user", content=user_text
    )

    # Auto-naming: si es el primer mensaje, usar el texto como título
    def _auto_name_and_touch(sid, text):
        s = ChatSession.objects.get(id=sid)
        msg_count = s.messages.filter(role='user').count()
        if msg_count == 1 and s.title == 'Nueva conversación':
            s.title = text[:50]
        s.updated_at = timezone.now()
        s.save(update_fields=['title', 'updated_at'])
        return s.title

    session_title = await sync_to_async(_auto_name_and_touch)(safe_session_id, user_text)

    # 4. LEER CONFIGURACIÓN DEL SISTEMA
    config = await sync_to_async(SystemConfig.get)()
    do_input_mod = config.moderation_mode in ('both', 'input')
    do_output_mod = config.moderation_mode in ('both', 'output')
    llm_model = config.llm_model
    mod_model = config.moderation_model

    # ── DEBUG: Encabezado del flujo ──
    if settings.DEBUG:
        mod_mode_label = {'both': 'Input + Output', 'input': 'Solo Input', 'output': 'Solo Output', 'none': 'Desactivada'}
        print("\n" + "═"*60)
        print(f"📨 NUEVA PETICIÓN — Sesión #{safe_session_id}")
        print("─"*60)
        print(f"   LLM: {llm_model}  |  Moderación: {mod_mode_label.get(config.moderation_mode, '?')} ({mod_model})")
        print(f"   Prompt: \"{user_text[:80]}{'...' if len(user_text) > 80 else ''}\"")
        if code_context:
            lines = code_context.strip().split('\n')
            print(f"   Código: {len(lines)} líneas ({language})")
        print("─"*60)

    # 5. MODERACIÓN DEL INPUT
    if do_input_mod:
        if settings.DEBUG:  # pragma: no cover
            print(f"\n① INPUT MOD ({mod_model})")

        is_safe = await sync_to_async(moderate_input)(user_text, code_context, mod_model)

        if not is_safe:
            if settings.DEBUG:  # pragma: no cover
                print(f"   └─ 🚫 Flujo cortado. Respuesta: moderada.")
                print("═"*60 + "\n")

            await sync_to_async(_mark_user_message_moderated)(safe_session_id)

            async def moderated_stream():
                payload = json.dumps({
                    'response': MODERATED_RESPONSE,
                    'session_id': safe_session_id,
                })
                yield f"data: {payload}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingHttpResponse(
                moderated_stream(),
                content_type='text/event-stream',
            )
    elif settings.DEBUG:
        print(f"\n① INPUT MOD — desactivado")

    # 6. CONSTRUIR PAYLOAD DE MENSAJES (sync → async)
    messages_payload = await sync_to_async(_build_messages_payload)(
        session, code_context, last_output, language
    )

    if settings.DEBUG:
        print(f"\n② LLM PRINCIPAL ({llm_model}) — streaming...")

    # 7. STREAMING DEL LLM PRINCIPAL (async, token a token, con moderación paralela)
    async def event_stream():
        global _output_mod_counter
        _output_mod_counter = 0  # Reset counter per request

        full_response = ""
        mod_buffer = ""
        moderation_tasks: list[asyncio.Task] = []
        flagged = False
        word_window = config.mod_word_window

        if settings.DEBUG and do_output_mod:  # pragma: no cover
            print(f"\n③ OUTPUT MOD ({mod_model}) — cada {word_window} palabras")

        client = ollama.AsyncClient()

        try:
            async for chunk in await client.chat(
                model=llm_model,
                messages=messages_payload,
                stream=True,
            ):
                # ── Comprobar tareas de moderación completadas ──
                if do_output_mod:
                    for task in moderation_tasks:
                        if task.done() and not task.result():
                            flagged = True
                            break

                if flagged:
                    break  # Cortar generación del LLM

                token = chunk['message']['content']
                full_response += token

                # Enviar token al usuario inmediatamente
                yield f"data: {json.dumps({'token': token})}\n\n"

                # Dar al event loop oportunidad de completar tasks de moderación
                await asyncio.sleep(0)

                # ── Cada ~word_window palabras, lanzar moderación async ──
                if do_output_mod:
                    mod_buffer += token
                    if len(mod_buffer.split()) >= word_window:
                        # Enviar TODO lo generado hasta ahora (contexto acumulativo)
                        task = asyncio.create_task(
                            moderate_output_async(full_response, mod_model)
                        )
                        moderation_tasks.append(task)
                        mod_buffer = ""

        except Exception as e:
            yield f"data: {json.dumps({'error': f'Error en motor IA: {str(e)}', 'details': None})}\n\n"

        # ── Moderar buffer restante + esperar tareas pendientes ──
        if do_output_mod and not flagged:
            if mod_buffer.strip():
                task = asyncio.create_task(moderate_output_async(full_response, mod_model))
                moderation_tasks.append(task)

            if moderation_tasks:
                results = await asyncio.gather(*moderation_tasks)
                if not all(results):
                    flagged = True

        # ── Moderado → reemplazar con mensaje predeterminado ──
        if flagged:
            yield f"data: {json.dumps({'moderated': True, 'response': MODERATED_RESPONSE})}\n\n"
            yield "data: [DONE]\n\n"

            if settings.DEBUG:  # pragma: no cover
                print(f"\n──────────────────────────────")
                print(f"🚫 OUTPUT MODERADO")
                print(f"   Texto generado antes del bloqueo:")
                import textwrap
                print(f"   ┌{'─'*56}┐")
                for line in full_response.splitlines():
                    wrapped_lines = textwrap.wrap(line, width=54)
                    if not wrapped_lines:
                        print(f"   │ {' '*54} │")
                    else:
                        for wrapped in wrapped_lines:
                            print(f"   │ {wrapped:<54} │")
                print(f"   └{'─'*56}┘")
                print("═"*60 + "\n")

            if full_response:
                await sync_to_async(Message.objects.create)(
                    session_id=safe_session_id,
                    role="assistant",
                    content=MODERATED_RESPONSE,
                    moderated=True,
                )
            return

        # ── Happy path: stream completado sin moderación ──
        yield f"data: {json.dumps({'session_id': safe_session_id, 'session_title': session_title})}\n\n"
        yield "data: [DONE]\n\n"

        if settings.DEBUG:  # pragma: no cover
            print(f"\n──────────────────────────────")
            print(f"✅ RESPUESTA COMPLETA ({len(full_response.split())} palabras)")
            print(f"   \"{full_response[:200]}{'...' if len(full_response) > 200 else ''}\"")
            print("═"*60 + "\n")

        if full_response:
            await sync_to_async(Message.objects.create)(
                session_id=safe_session_id, role="assistant", content=full_response
            )

    return StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream',
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """Lista las sesiones de chat del usuario autenticado."""
    sessions = ChatSession.objects.filter(user=request.user).order_by('-updated_at')
    paginator = SessionPagination()
    result_page = paginator.paginate_queryset(sessions, request)
    serializer = ChatSessionSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    """Crea una nueva sesión de chat vacía para el usuario autenticado."""
    session = ChatSession.objects.create(user=request.user)
    return Response(ChatSessionSerializer(session).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_detail(request, session_id):
    """Devuelve el detalle resumen de una sesión."""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    serializer = ChatSessionDetailSerializer(session)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_session_messages(request, session_id):
    """Devuelve los mensajes paginados de una sesión específica."""
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    messages = session.messages.order_by('-created_at')
    paginator = MessagePagination()
    result_page = paginator.paginate_queryset(messages, request)
    serializer = MessageSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


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
        return Response({"error": "El campo 'title' es obligatorio.", "details": None}, status=400)
    session.title = title.strip()[:200]
    session.save(update_fields=['title'])
    return Response(ChatSessionSerializer(session).data)
