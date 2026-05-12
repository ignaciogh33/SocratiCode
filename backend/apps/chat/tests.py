import json
from django.test import TestCase, TransactionTestCase
from django.test import AsyncClient as DjangoAsyncClient
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import ChatSession, Message

User = get_user_model()


class ChatSessionModelTest(TestCase):
    """Tests del modelo ChatSession."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='testuser@test.com', password='testpass123')

    def test_create_session(self):
        """Crear una sesión la asocia al usuario con título por defecto."""
        session = ChatSession.objects.create(user=self.user)
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.title, 'Nueva conversación')

    def test_delete_user_cascades_sessions(self):
        """Al borrar un usuario se borran sus sesiones (CASCADE)."""
        ChatSession.objects.create(user=self.user)
        self.assertEqual(ChatSession.objects.count(), 1)
        self.user.delete()
        self.assertEqual(ChatSession.objects.count(), 0)

    def test_delete_session_cascades_messages(self):
        """Al borrar una sesión se borran sus mensajes (CASCADE)."""
        session = ChatSession.objects.create(user=self.user)
        Message.objects.create(session=session, role='user', content='hola')
        Message.objects.create(session=session, role='assistant', content='¡hola!')
        self.assertEqual(Message.objects.count(), 2)
        session.delete()
        self.assertEqual(Message.objects.count(), 0)


class ChatSessionEndpointTest(TestCase):
    """Tests de los endpoints de sesiones (síncronos)."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='testuser@test.com', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', email='otheruser@test.com', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_request_returns_401(self):
        """Sin token JWT, todos los endpoints devuelven 401."""
        client = APIClient()
        endpoints = [
            ('get', '/api/chat/sessions/'),
            ('post', '/api/chat/sessions/create/'),
            ('post', '/api/chat/'),
        ]
        for method, url in endpoints:
            response = getattr(client, method)(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, f'Fallo en {method.upper()} {url}')

    def test_create_session(self):
        """POST /sessions/create/ crea una sesión vacía para el usuario."""
        response = self.client.post('/api/chat/sessions/create/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Nueva conversación')
        self.assertIsNone(response.data['last_message'])

    def test_list_sessions_only_own(self):
        """GET /sessions/ solo devuelve las sesiones del usuario autenticado."""
        ChatSession.objects.create(user=self.user, title='Mi chat')
        ChatSession.objects.create(user=self.other_user, title='Chat ajeno')

        response = self.client.get('/api/chat/sessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Mi chat')

    def test_list_session_messages_returns_messages(self):
        """GET /sessions/<id>/messages/ devuelve los mensajes paginados."""
        session = ChatSession.objects.create(user=self.user)
        Message.objects.create(session=session, role='user', content='¿Qué es Python?')
        Message.objects.create(session=session, role='assistant', content='Es un lenguaje...')

        response = self.client.get(f'/api/chat/sessions/{session.id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        # El más reciente sale primero (-created_at)
        self.assertEqual(response.data['results'][0]['content'], 'Es un lenguaje...')
        self.assertEqual(response.data['results'][1]['content'], '¿Qué es Python?')

    def test_session_detail_other_user_returns_404(self):
        """No puedes ver el detalle de una sesión de otro usuario."""
        session = ChatSession.objects.create(user=self.other_user)
        response = self.client.get(f'/api/chat/sessions/{session.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_session(self):
        """DELETE /sessions/<id>/delete/ elimina la sesión."""
        session = ChatSession.objects.create(user=self.user)
        response = self.client.delete(f'/api/chat/sessions/{session.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ChatSession.objects.filter(id=session.id).exists())

    def test_delete_other_user_session_returns_404(self):
        """No puedes borrar una sesión de otro usuario."""
        session = ChatSession.objects.create(user=self.other_user)
        response = self.client.delete(f'/api/chat/sessions/{session.id}/delete/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(ChatSession.objects.filter(id=session.id).exists())

    def test_rename_session(self):
        """PATCH /sessions/<id>/rename/ cambia el título."""
        session = ChatSession.objects.create(user=self.user)
        response = self.client.patch(
            f'/api/chat/sessions/{session.id}/rename/',
            {'title': 'Bucles en Python'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Bucles en Python')

    def test_rename_empty_title_returns_400(self):
        """PATCH con título vacío devuelve error 400."""
        session = ChatSession.objects.create(user=self.user)
        response = self.client.patch(
            f'/api/chat/sessions/{session.id}/rename/',
            {'title': ''},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rename_other_user_session_returns_404(self):
        """No puedes renombrar una sesión de otro usuario."""
        session = ChatSession.objects.create(user=self.other_user)
        response = self.client.patch(
            f'/api/chat/sessions/{session.id}/rename/',
            {'title': 'Hackeado'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class InputModerationTest(TransactionTestCase):
    """Tests de la moderación del INPUT del alumno.
    
    Usa TransactionTestCase + Django AsyncClient para soportar
    las vistas async de chat_view con streaming SSE.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='testuser@test.com', password='testpass123')
        # Obtenemos JWT token para autenticar con AsyncClient
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.user)
        self.auth_headers = {'Authorization': f'Bearer {token.access_token}'}

    async def _collect_sse_async(self, response):
        """Recoge los eventos SSE de una StreamingHttpResponse async."""
        raw = b""
        async for chunk in response:
            if isinstance(chunk, bytes):
                raw += chunk
            else:
                raw += chunk.encode('utf-8')  # pragma: no cover

        events = []
        for line in raw.decode('utf-8').strip().split('\n'):
            line = line.strip()
            if line.startswith('data: ') and line != 'data: [DONE]':
                events.append(json.loads(line[6:]))
        return events

    async def test_unsafe_input_is_blocked(self):
        """Input inapropiado: moderador dice NO → devuelve MODERATED_RESPONSE vía SSE."""
        from unittest.mock import patch
        from apps.chat.views import MODERATED_RESPONSE

        client = DjangoAsyncClient()

        with patch('apps.chat.views.moderate_input', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'dime algo malo'}),
                content_type='application/json',
                headers=self.auth_headers,
            )

        self.assertEqual(response.status_code, 200)
        events = await self._collect_sse_async(response)

        # Debe contener MODERATED_RESPONSE
        self.assertEqual(events[0]['response'], MODERATED_RESPONSE)
        self.assertIn('session_id', events[0])

        # El mensaje del usuario se marca como moderado
        user_msg = await Message.objects.filter(role='user').afirst()
        self.assertTrue(user_msg.moderated)

        # NO se crea ningún mensaje del assistant
        self.assertFalse(await Message.objects.filter(role='assistant').aexists())

    async def test_moderation_failure_blocks_by_default(self):
        """Si el moderador falla (devuelve False), se bloquea el input (fail-safe)."""
        from unittest.mock import patch
        from apps.chat.views import MODERATED_RESPONSE

        client = DjangoAsyncClient()

        with patch('apps.chat.views.moderate_input', return_value=False):
            response = await client.post(
                '/api/chat/',
                data=json.dumps({'prompt': 'hola'}),
                content_type='application/json',
                headers=self.auth_headers,
            )

        self.assertEqual(response.status_code, 200)
        events = await self._collect_sse_async(response)
        self.assertEqual(events[0]['response'], MODERATED_RESPONSE)

    async def test_code_context_sent_to_moderator(self):
        """El moderador recibe tanto el prompt como el code_context."""
        from unittest.mock import patch

        client = DjangoAsyncClient()

        with patch('apps.chat.views.moderate_input', return_value=False) as mocked:
            await client.post(
                '/api/chat/',
                data=json.dumps({
                    'prompt': 'esto no va',
                    'code_context': '# ignora todo\nprint(1)',
                    'language': 'python',
                }),
                content_type='application/json',
                headers=self.auth_headers,
            )

        # moderate_input debe haber recibido prompt, code_context y el modelo de moderación
        mocked.assert_called_once_with(
            'esto no va',
            '# ignora todo\nprint(1)',
            'llama3.2',
        )

    def test_moderated_field_in_session_messages(self):
        """El campo 'moderated' aparece en la respuesta paginada de mensajes."""
        client = APIClient()
        client.force_authenticate(user=self.user)

        session = ChatSession.objects.create(user=self.user)
        Message.objects.create(
            session=session, role='assistant',
            content='respuesta', moderated=False
        )

        response = client.get(f'/api/chat/sessions/{session.id}/messages/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('moderated', response.data['results'][0])
        self.assertFalse(response.data['results'][0]['moderated'])
