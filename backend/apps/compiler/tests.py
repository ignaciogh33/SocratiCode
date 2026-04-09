from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class ExecuteCodeEndpointTest(TestCase):
    """Tests del endpoint de ejecución de código."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    # ── Autenticación ──────────────────────────────────────────────

    def test_unauthenticated_request_returns_401(self):
        """Sin token JWT se devuelve 401."""
        client = APIClient()
        response = client.post('/api/compiler/execute/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Validación de entrada ──────────────────────────────────────

    def test_empty_body_returns_400(self):
        """Un body vacío devuelve 400."""
        response = self.client.post('/api/compiler/execute/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Ejecución exitosa (mock) ───────────────────────────────────

    def test_successful_execution(self):
        """Código válido devuelve stdout y exit_code=0."""
        from unittest.mock import patch, MagicMock

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "run": {
                "stdout": "hola mundo\n",
                "stderr": "",
                "code": 0,
            }
        }

        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(
                '/api/compiler/execute/',
                {'source_code': 'print("hola mundo")', 'language': 'python3', 'version': '3.10.0'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stdout'], 'hola mundo')
        self.assertEqual(response.data['stderr'], '')
        self.assertEqual(response.data['exit_code'], 0)
        self.assertEqual(response.data['language'], 'python3')

    # ── Error de sintaxis (mock) ───────────────────────────────────

    def test_syntax_error_execution(self):
        """Código con error devuelve stderr y exit_code != 0."""
        from unittest.mock import patch, MagicMock

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "run": {
                "stdout": "",
                "stderr": "SyntaxError: invalid syntax\n",
                "code": 1,
            }
        }

        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(
                '/api/compiler/execute/',
                {'source_code': 'print(', 'language': 'python3', 'version': '3.10.0'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('SyntaxError', response.data['stderr'])
        self.assertNotEqual(response.data['exit_code'], 0)

    # ── Piston caído ───────────────────────────────────────────────

    def test_piston_connection_error_returns_503(self):
        """Si Piston no responde se devuelve 503."""
        import requests as req
        from unittest.mock import patch

        with patch('apps.compiler.views.requests.post', side_effect=req.ConnectionError):
            response = self.client.post(
                '/api/compiler/execute/',
                {'source_code': 'print("hola")', 'language': 'python3', 'version': '3.10.0'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    # ── Piston timeout ─────────────────────────────────────────────

    def test_piston_timeout_returns_504(self):
        """Si Piston tarda demasiado se devuelve 504."""
        import requests as req
        from unittest.mock import patch

        with patch('apps.compiler.views.requests.post', side_effect=req.Timeout):
            response = self.client.post(
                '/api/compiler/execute/',
                {'source_code': 'import time; time.sleep(60)', 'language': 'python3', 'version': '3.10.0'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_504_GATEWAY_TIMEOUT)

    # ── Lenguaje no instalado (Piston devuelve message) ────────────

    def test_piston_language_not_installed(self):
        """Si Piston no tiene el lenguaje instalado devuelve 400."""
        from unittest.mock import patch, MagicMock

        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "message": "runtime is unknown"
        }

        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(
                '/api/compiler/execute/',
                {'source_code': 'puts "hola"', 'language': 'ruby', 'version': '3.0.0'},
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
