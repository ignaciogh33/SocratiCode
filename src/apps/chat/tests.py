from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import ChatSession, Message

User = get_user_model()


class ChatSessionModelTest(TestCase):
    """Tests del modelo ChatSession."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')

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
    """Tests de los endpoints de sesiones."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')
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
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Mi chat')


    def test_session_detail_returns_messages(self):
        """GET /sessions/<id>/ devuelve la sesión con sus mensajes."""
        session = ChatSession.objects.create(user=self.user)
        Message.objects.create(session=session, role='user', content='¿Qué es Python?')
        Message.objects.create(session=session, role='assistant', content='Es un lenguaje...')

        response = self.client.get(f'/api/chat/sessions/{session.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['messages']), 2)
        self.assertEqual(response.data['messages'][0]['content'], '¿Qué es Python?')

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
