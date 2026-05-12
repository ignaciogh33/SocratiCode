"""
Tests de cobertura adicionales para apps/chat/views.py.

Cubre las rutas no ejercidas por los tests existentes:
- moderate_input: ramas DEBUG y non-DEBUG, path OK y BLOCKED, y excepción
- moderate_output_async: OK, blocked y excepción (fail-open)
- _get_or_create_session: sesión existente, sesión no encontrada, creación nueva
- _build_messages_payload: con y sin código/last_output
- _mark_user_message_moderated: con y sin mensaje
- session_detail endpoint
- chat_view: sesión no encontrada, happy path sin moderación de input
"""
import json
from django.test import TestCase, TransactionTestCase
from django.test import AsyncClient as DjangoAsyncClient
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from unittest.mock import patch, MagicMock, AsyncMock
from django.test import override_settings
from asgiref.sync import sync_to_async

from apps.chat.models import ChatSession, Message, SystemConfig
from apps.chat.views import (
    moderate_input,
    moderate_output_async,
    _get_or_create_session,
    _build_messages_payload,
    _mark_user_message_moderated,
)

User = get_user_model()


class ModerateInputTest(TestCase):
    """Tests de moderate_input (función síncrona)."""

    def _make_ollama_response(self, verdict: str):
        msg = MagicMock()
        msg.__getitem__ = lambda self, key: {'content': verdict}[key]
        result = MagicMock()
        result.__getitem__ = lambda self, key: {'message': msg}[key]
        return result

    def test_returns_true_when_verdict_is_ok(self):
        mock_result = {'message': {'content': 'OK, el texto es seguro'}}
        with patch('apps.chat.views.ollama.chat', return_value=mock_result):
            self.assertTrue(moderate_input('hola mundo'))

    def test_returns_false_when_verdict_is_not_ok(self):
        mock_result = {'message': {'content': 'BLOCKED: contenido inapropiado'}}
        with patch('apps.chat.views.ollama.chat', return_value=mock_result):
            self.assertFalse(moderate_input('texto malo'))

    def test_returns_false_on_exception(self):
        with patch('apps.chat.views.ollama.chat', side_effect=Exception('conn error')):
            self.assertFalse(moderate_input('algo'))

    @override_settings(DEBUG=True)
    def test_debug_mode_prints_safe(self):
        mock_result = {'message': {'content': 'OK'}}
        with patch('apps.chat.views.ollama.chat', return_value=mock_result):
            result = moderate_input('hola')
        self.assertTrue(result)

    @override_settings(DEBUG=True)
    def test_debug_mode_prints_blocked(self):
        mock_result = {'message': {'content': 'BLOCKED'}}
        with patch('apps.chat.views.ollama.chat', return_value=mock_result):
            result = moderate_input('malo')
        self.assertFalse(result)

    @override_settings(DEBUG=True)
    def test_debug_mode_exception_path(self):
        with patch('apps.chat.views.ollama.chat', side_effect=Exception):
            result = moderate_input('algo')
        self.assertFalse(result)

    def test_with_code_context(self):
        mock_result = {'message': {'content': 'OK'}}
        with patch('apps.chat.views.ollama.chat', return_value=mock_result) as mocked:
            moderate_input('mi prompt', '# codigo', 'phi4')
        # Verifica que el payload incluye el código
        call_args = mocked.call_args
        messages_arg = call_args[1]['messages'] if call_args[1] else call_args[0][1]
        user_content = messages_arg[1]['content']
        self.assertIn('codigo', user_content)


class ModerateOutputAsyncTest(TransactionTestCase):
    """Tests de moderate_output_async."""

    async def test_returns_true_when_ok(self):
        mock_result = {'message': {'content': 'OK'}}
        mock_client = AsyncMock()
        mock_client.chat = AsyncMock(return_value=mock_result)
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            result = await moderate_output_async('texto seguro')
        self.assertTrue(result)

    async def test_returns_false_when_blocked(self):
        mock_result = {'message': {'content': 'BLOCKED'}}
        mock_client = AsyncMock()
        mock_client.chat = AsyncMock(return_value=mock_result)
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            result = await moderate_output_async('texto malo')
        self.assertFalse(result)

    async def test_returns_true_on_exception_fail_open(self):
        mock_client = AsyncMock()
        mock_client.chat = AsyncMock(side_effect=Exception('error'))
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            result = await moderate_output_async('texto')
        self.assertTrue(result)  # fail-open

    @override_settings(DEBUG=True)
    async def test_debug_mode_ok(self):
        mock_result = {'message': {'content': 'OK texto seguro'}}
        mock_client = AsyncMock()
        mock_client.chat = AsyncMock(return_value=mock_result)
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            result = await moderate_output_async('texto seguro')
        self.assertTrue(result)

    @override_settings(DEBUG=True)
    async def test_debug_mode_blocked(self):
        mock_result = {'message': {'content': 'BLOCKED'}}
        mock_client = AsyncMock()
        mock_client.chat = AsyncMock(return_value=mock_result)
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            result = await moderate_output_async('texto malo')
        self.assertFalse(result)


class GetOrCreateSessionTest(TestCase):
    """Tests de _get_or_create_session."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='u1', email='u1@test.com', password='pass'
        )

    def test_returns_existing_session(self):
        session = ChatSession.objects.create(user=self.user)
        result, error = _get_or_create_session(session.id, self.user)
        self.assertIsNone(error)
        self.assertEqual(result.id, session.id)

    def test_returns_error_for_nonexistent_session(self):
        result, error = _get_or_create_session(99999, self.user)
        self.assertIsNone(result)
        self.assertEqual(error.status_code, 404)

    def test_creates_new_session_when_no_id(self):
        result, error = _get_or_create_session(None, self.user)
        self.assertIsNone(error)
        self.assertIsNotNone(result.id)
        self.assertTrue(ChatSession.objects.filter(id=result.id).exists())


class BuildMessagesPayloadTest(TestCase):
    """Tests de _build_messages_payload."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='u2', email='u2@test.com', password='pass'
        )
        self.session = ChatSession.objects.create(user=self.user)

    def test_payload_without_code_context(self):
        Message.objects.create(session=self.session, role='user', content='hola')
        payload = _build_messages_payload(self.session, '', '', 'python')
        roles = [m['role'] for m in payload]
        self.assertIn('system', roles)
        self.assertIn('user', roles)

    def test_payload_with_code_context(self):
        payload = _build_messages_payload(self.session, 'print(1)', '', 'python')
        # El segundo mensaje debe ser el contexto de código (role=system)
        self.assertEqual(payload[1]['role'], 'system')
        self.assertIn('print(1)', payload[1]['content'])

    def test_payload_with_code_context_and_last_output(self):
        payload = _build_messages_payload(self.session, 'print(1)', 'hola\n', 'python')
        combined = payload[1]['content']
        self.assertIn('print(1)', combined)
        self.assertIn('hola', combined)


class MarkUserMessageModeratedTest(TestCase):
    """Tests de _mark_user_message_moderated."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='u3', email='u3@test.com', password='pass'
        )
        self.session = ChatSession.objects.create(user=self.user)

    def test_marks_last_user_message(self):
        msg = Message.objects.create(session=self.session, role='user', content='hola')
        _mark_user_message_moderated(self.session.id)
        msg.refresh_from_db()
        self.assertTrue(msg.moderated)

    def test_does_nothing_when_no_user_message(self):
        # No debe lanzar excepción aunque no haya mensajes
        _mark_user_message_moderated(self.session.id)  # no error


class SessionDetailEndpointTest(TestCase):
    """Tests del endpoint session_detail."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='u4', email='u4@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_session_detail_returns_200(self):
        session = ChatSession.objects.create(user=self.user, title='Mi sesión')
        response = self.client.get(f'/api/chat/sessions/{session.id}/')
        self.assertEqual(response.status_code, 200)

    def test_session_detail_other_user_returns_404(self):
        other = User.objects.create_user(
            username='other', email='other@test.com', password='pass'
        )
        session = ChatSession.objects.create(user=other)
        response = self.client.get(f'/api/chat/sessions/{session.id}/')
        self.assertEqual(response.status_code, 404)


class ChatViewAdditionalTest(TransactionTestCase):
    """Tests adicionales del endpoint chat_view."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='cv_user', email='cv@test.com', password='pass'
        )
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.user)
        self.auth_headers = {'Authorization': f'Bearer {token.access_token}'}

    async def _collect_sse(self, response):
        raw = b''
        async for chunk in response:
            raw += chunk if isinstance(chunk, bytes) else chunk.encode('utf-8')
        events = []
        for line in raw.decode('utf-8').strip().split('\n'):
            line = line.strip()
            if line.startswith('data: ') and line != 'data: [DONE]':
                events.append(json.loads(line[6:]))
        return events

    async def test_session_not_found_returns_404_event(self):
        """Sesión_id que no existe → evento con error 404."""
        client = DjangoAsyncClient()
        with patch('apps.chat.views.moderate_input', return_value=True):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola', 'session_id': 99999}),
                content_type='application/json',
                headers=self.auth_headers,
            )
        self.assertEqual(response.status_code, 404)

    async def test_happy_path_no_moderation(self):
        """Sin moderación de input ni output, el LLM responde y se guarda el mensaje."""
        await sync_to_async(SystemConfig.objects.update_or_create)(pk=1, defaults={
            'moderation_mode': 'none',
            'llm_model': 'llama3.2',
            'moderation_model': 'llama3.2',
            'mod_word_window': 40,
        })

        mock_chunk = MagicMock()
        mock_chunk.__getitem__ = lambda self, key: {
            'message': {'content': 'token'}
        }[key]

        async def fake_stream(*_args, **_kwargs):
            yield mock_chunk

        mock_client = MagicMock()
        mock_client.chat = AsyncMock(return_value=fake_stream())

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=mock_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'explica Python'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await self._collect_sse(response)

        self.assertEqual(response.status_code, 200)
        # Debe haber al menos un token y el evento final con session_id
        self.assertTrue(any('token' in e or 'session_id' in e for e in events))
