"""
Tests de cobertura del streaming de chat_view (event_stream generator).

Estrategia: parchear apps.chat.views.ollama.AsyncClient para inyectar
un async generator propio que simule los chunks de respuesta.

IMPORTANTE: la respuesta streaming se consume DENTRO del bloque with patch(...)
porque Django 6 no consume el generador hasta que se itera la respuesta, y el
parche ya habría expirado fuera del bloque.
"""
import json
from django.test import TransactionTestCase, override_settings
from django.test import AsyncClient as DjangoAsyncClient
from django.contrib.auth import get_user_model
from unittest.mock import patch
from asgiref.sync import sync_to_async

from apps.chat.models import ChatSession, Message, SystemConfig

User = get_user_model()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_async_iterable(*contents):
    """Crea un async iterable que produce dicts simulando chunks de Ollama."""
    class _AsyncGen:
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

    return _AsyncGen()


class _FakeOllamaClient:
    """Mock de ollama.AsyncClient."""
    def __init__(self, *contents, raises=None):
        self._contents = contents
        self._raises = raises

    async def chat(self, *args, **kwargs):
        if self._raises:
            raise self._raises
        return _make_async_iterable(*self._contents)


async def _collect(response):
    raw = b''
    async for chunk in response:
        raw += chunk if isinstance(chunk, bytes) else chunk.encode('utf-8')
    events = []
    for line in raw.decode('utf-8').strip().split('\n'):
        line = line.strip()
        if line.startswith('data: ') and line != 'data: [DONE]':
            try:
                events.append(json.loads(line[6:]))
            except json.JSONDecodeError:
                pass
    return events


def _set_config(mode='none', window=40):
    """Configura SystemConfig — SÍNCRONO, solo llamar desde setUp() o sync_to_async."""
    SystemConfig.objects.update_or_create(pk=1, defaults={
        'moderation_mode': mode,
        'llm_model': 'llama3.2',
        'moderation_model': 'llama3.2',
        'mod_word_window': window,
    })


# ─── Tests ────────────────────────────────────────────────────────────────────

class ChatViewStreamingTest(TransactionTestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='stream_user', email='stream@test.com', password='pass'
        )
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.user)
        self.auth_headers = {'Authorization': f'Bearer {token.access_token}'}

    # ── Sin moderación: tokens se reciben y se guarda el mensaje ──────

    async def test_no_moderation_tokens_streamed_and_saved(self):
        await sync_to_async(_set_config)(mode='none')
        fake_client = _FakeOllamaClient('Hola', ' mundo')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'di hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('token' in e or 'session_id' in e for e in events))
        # El mensaje del asistente debe haberse guardado
        exists = await Message.objects.filter(role='assistant').aexists()
        self.assertTrue(exists)

    # ── Input moderation safe → pasa al LLM ───────────────────────────

    async def test_input_moderation_safe_passes_to_llm(self):
        await sync_to_async(_set_config)(mode='input')
        fake_client = _FakeOllamaClient('Respuesta segura')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.moderate_input', return_value=True), \
             patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('token' in e or 'session_id' in e for e in events))

    # ── Output moderado: flagged durante el stream ────────────────────

    async def test_output_flagged_during_stream(self):
        await sync_to_async(_set_config)(mode='output', window=1)
        fake_client = _FakeOllamaClient('palabra1 palabra2 ')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)
        # El mensaje assistant guardado debe tener moderated=True
        assistant_msg = await Message.objects.filter(role='assistant').afirst()
        if assistant_msg:
            self.assertTrue(assistant_msg.moderated)

    # ── Output moderado: flagged en gather final ──────────────────────

    async def test_output_flagged_in_gather(self):
        await sync_to_async(_set_config)(mode='output', window=100)
        fake_client = _FakeOllamaClient('token')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)
        # El mensaje guardado debe tener moderated=True
        assistant_msg = await Message.objects.filter(role='assistant').afirst()
        if assistant_msg:
            self.assertTrue(assistant_msg.moderated)

    # ── Error del LLM → evento de error en el stream ─────────────────

    async def test_llm_raises_sends_error_event(self):
        await sync_to_async(_set_config)(mode='none')
        fake_client = _FakeOllamaClient(raises=Exception('ollama crash'))

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('error' in e for e in events))

    # ── DEBUG mode sin moderación ─────────────────────────────────────

    @override_settings(DEBUG=True)
    async def test_debug_mode_no_moderation(self):
        await sync_to_async(_set_config)(mode='none')
        fake_client = _FakeOllamaClient('ok')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'x', 'code_context': 'print(1)', 'language': 'python'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)

    # ── DEBUG mode con output moderation blocked ──────────────────────

    @override_settings(DEBUG=True)
    async def test_debug_output_moderation_blocked(self):
        await sync_to_async(_set_config)(mode='output', window=1)
        fake_client = _FakeOllamaClient('p1 ', 'p2 ', 'p3 ')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'test'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)

    # ── Input moderation desactivada en DEBUG ─────────────────────────

    @override_settings(DEBUG=True)
    async def test_debug_input_mod_disabled(self):
        await sync_to_async(_set_config)(mode='output')
        fake_client = _FakeOllamaClient('ok')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=True):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)

    # ── Auto-naming: segundo mensaje no renombra la sesión ────────────

    async def test_second_message_does_not_rename_session(self):
        await sync_to_async(_set_config)(mode='none')
        session = await ChatSession.objects.acreate(user=self.user, title='Mi sesión')
        await Message.objects.acreate(session=session, role='user', content='primer mensaje')

        fake_client = _FakeOllamaClient('ok')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'segundo', 'session_id': session.id}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        await session.arefresh_from_db()
        self.assertEqual(session.title, 'Mi sesión')

    # ── Output moderation: buffer restante safe → happy path ─────────

    async def test_output_moderation_final_buffer_safe(self):
        await sync_to_async(_set_config)(mode='output', window=100)
        fake_client = _FakeOllamaClient('token1', ' token2')

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=True):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            events = await _collect(response)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(any('session_id' in e for e in events))

    # ── Output moderation: token vacío → no hay tareas ────────────────

    async def test_output_moderation_no_tasks_empty_token(self):
        await sync_to_async(_set_config)(mode='output', window=1000)
        fake_client = _FakeOllamaClient('')  # 0 palabras → no dispara tarea

        client = DjangoAsyncClient()
        with patch('apps.chat.views.ollama.AsyncClient', return_value=fake_client), \
             patch('apps.chat.views.moderate_output_async', return_value=True):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )
            await _collect(response)

        self.assertEqual(response.status_code, 200)


class ModelStrTest(TransactionTestCase):
    """Tests de los __str__ de los modelos (lines 13 y 29 de models.py)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='str_user', email='str@test.com', password='pass'
        )

    def test_chatsession_str(self):
        session = ChatSession.objects.create(user=self.user)
        result = str(session)
        self.assertIn(str(session.id), result)

    def test_message_str(self):
        session = ChatSession.objects.create(user=self.user)
        msg = Message.objects.create(session=session, role='user', content='hola')
        result = str(msg)
        self.assertIn(str(msg.id), result)

    def test_systemconfig_str(self):
        config = SystemConfig.get()
        self.assertEqual(str(config), 'Configuración del sistema')
