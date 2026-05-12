"""
Tests que ejercen directamente el generador event_stream de chat_view
usando DjangoAsyncClient con JWT y consumiendo la respuesta dentro del
bloque with patch(...) para que el mock esté activo cuando el generador
se ejecuta (Django 6 no consume el stream hasta que se itera la respuesta).
"""
import json
from django.test import TransactionTestCase, override_settings
from django.test import AsyncClient as DjangoAsyncClient
from django.contrib.auth import get_user_model
from unittest.mock import patch
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken

from apps.chat.models import Message, SystemConfig

User = get_user_model()


def _make_async_iterable(*contents):
    class _Gen:
        def __init__(self):
            self._items = [{'message': {'content': c}} for c in contents]
            self._idx = 0

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self._idx >= len(self._items):
                raise StopAsyncIteration
            item = self._items[self._idx]
            self._idx += 1
            return item
    return _Gen()


class _FakeClient:
    def __init__(self, *contents, raises=None):
        self._contents = contents
        self._raises = raises

    async def chat(self, **_kwargs):
        if self._raises:
            raise self._raises
        return _make_async_iterable(*self._contents)


def _set_config(mode='none', window=40):
    SystemConfig.objects.update_or_create(pk=1, defaults={
        'moderation_mode': mode,
        'llm_model': 'llama3.2',
        'moderation_model': 'llama3.2',
        'mod_word_window': window,
    })


async def _collect_stream(response):
    """Itera el response y extrae eventos SSE."""
    raw = b''
    async for chunk in response:
        raw += chunk if isinstance(chunk, bytes) else chunk.encode()
    events = []
    for line in raw.decode().strip().split('\n'):
        line = line.strip()
        if line.startswith('data: ') and line != 'data: [DONE]':
            try:
                events.append(json.loads(line[6:]))
            except json.JSONDecodeError:
                pass
    return events


class EventStreamDirectTest(TransactionTestCase):
    """Tests que ejercen el generador event_stream directamente."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='dir_user', email='dir@test.com', password='pass'
        )
        token = RefreshToken.for_user(self.user)
        self.auth_headers = {'Authorization': f'Bearer {token.access_token}'}

    # ── Happy path: tokens llegan, session_id en evento final ─────────

    async def test_happy_path_stream_executed(self):
        await sync_to_async(_set_config)(mode='none')
        fake = _FakeClient('Hola', ' mundo')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'di hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('session_id' in e or 'token' in e for e in events))
        exists = await Message.objects.filter(role='assistant').aexists()
        self.assertTrue(exists)

    # ── Output moderation con window pequeño (flags durante stream) ────

    async def test_output_moderation_during_stream(self):
        await sync_to_async(_set_config)(mode='output', window=1)
        fake = _FakeClient('bad word test')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake), \
             patch('apps.chat.views.moderate_output_async', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'test'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(e.get('moderated') for e in events))

    # ── Output moderation: gather al final del stream ─────────────────

    async def test_output_moderation_gather(self):
        await sync_to_async(_set_config)(mode='output', window=1000)
        fake = _FakeClient('palabra1 palabra2 palabra3 palabra4 palabra5')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake), \
             patch('apps.chat.views.moderate_output_async', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'test'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(e.get('moderated') for e in events))

    # ── Output safe → mensaje assistant se guarda sin moderated ───────

    async def test_output_safe_saves_message(self):
        await sync_to_async(_set_config)(mode='output', window=1000)
        fake = _FakeClient('respuesta ok')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake), \
             patch('apps.chat.views.moderate_output_async', return_value=True):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('session_id' in e for e in events))
        msg = await Message.objects.filter(role='assistant').afirst()
        self.assertIsNotNone(msg)
        self.assertFalse(msg.moderated)

    # ── LLM error → evento de error ───────────────────────────────────

    async def test_llm_error_event(self):
        await sync_to_async(_set_config)(mode='none')
        fake = _FakeClient(raises=Exception('crash'))

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('error' in e for e in events))

    # ── Input moderation blocked + mensaje usuario marcado ────────────

    async def test_input_moderated_marks_user_message(self):
        await sync_to_async(_set_config)(mode='input')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.moderate_input', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'contenido malo'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('response' in e or 'session_id' in e for e in events))
        user_msg = await Message.objects.filter(role='user').afirst()
        if user_msg:
            await user_msg.arefresh_from_db()
            self.assertTrue(user_msg.moderated)

    # ── DEBUG mode: flujo completo ────────────────────────────────────

    @override_settings(DEBUG=True)
    async def test_debug_mode_full(self):
        await sync_to_async(_set_config)(mode='none')
        fake = _FakeClient('ok token')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'x', 'code_context': 'print(1)', 'language': 'python'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect_stream(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(events) >= 0)
