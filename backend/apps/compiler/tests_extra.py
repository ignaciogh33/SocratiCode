"""
Tests de cobertura adicionales para apps/compiler/views.py.

Cubre las ramas no ejercidas:
- Bloques DEBUG (print antes y después de llamar a Piston)
- exit_code None → -1
- Status messages: CE, RE, SG, TO, OL, EL, XX
- Excepción genérica → 500
- compile stderr se concatena con run stderr
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

EXECUTE_URL = '/api/compiler/execute/'
VALID_PAYLOAD = {'source_code': 'print("ok")', 'language': 'python3', 'version': '3.10.0'}


class ExecuteCodeDebugTest(TestCase):
    """Rama DEBUG=True de execute_code."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='debug_user', email='debug@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @override_settings(DEBUG=True)
    def test_debug_prints_do_not_affect_response(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'run': {'stdout': 'ok\n', 'stderr': '', 'code': 0}
        }
        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(EXECUTE_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stdout'], 'ok')


class ExecuteCodeExitCodeNoneTest(TestCase):
    """exit_code None → se convierte en -1."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ec_user', email='ec@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_exit_code_none_becomes_minus_one(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'run': {'stdout': '', 'stderr': '', 'code': None, 'signal': None, 'status': None}
        }
        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(EXECUTE_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['exit_code'], -1)


class ExecuteCodeStatusMessagesTest(TestCase):
    """Status messages de Piston (CE, RE, SG, TO, OL, EL, XX)."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='sm_user', email='sm@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _run_with_status(self, piston_status, signal=None):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'run': {
                'stdout': '',
                'stderr': '',
                'code': 1,
                'signal': signal,
                'status': piston_status,
            }
        }
        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            return self.client.post(EXECUTE_URL, VALID_PAYLOAD, format='json')

    def test_status_ce_appends_message(self):
        response = self._run_with_status('CE')
        self.assertIn('compilación', response.data['stderr'])

    def test_status_re_appends_message(self):
        response = self._run_with_status('RE')
        self.assertIn('ejecución', response.data['stderr'])

    def test_status_sg_appends_message_with_signal(self):
        response = self._run_with_status('SG', signal='SIGSEGV')
        self.assertIn('SIGSEGV', response.data['stderr'])

    def test_status_sg_with_no_signal_uses_desconocida(self):
        response = self._run_with_status('SG', signal=None)
        self.assertIn('desconocida', response.data['stderr'])

    def test_status_to_appends_message(self):
        response = self._run_with_status('TO')
        self.assertIn('bucle infinito', response.data['stderr'])

    def test_status_ol_appends_message(self):
        response = self._run_with_status('OL')
        self.assertIn('stdout', response.data['stderr'])

    def test_status_el_appends_message(self):
        response = self._run_with_status('EL')
        self.assertIn('stderr', response.data['stderr'])

    def test_status_xx_appends_message(self):
        response = self._run_with_status('XX')
        self.assertIn('infraestructura', response.data['stderr'])

    def test_unknown_status_does_not_crash(self):
        """Status desconocido no añade nada pero tampoco falla."""
        response = self._run_with_status('ZZ')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ExecuteCodeCompileStderrTest(TestCase):
    """stderr de compilación se concatena con stderr de ejecución."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='cc_user', email='cc@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_compile_stderr_concatenated(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'compile': {'stderr': 'warning: foo\n'},
            'run': {'stdout': '', 'stderr': 'runtime error\n', 'code': 1, 'signal': None, 'status': None},
        }
        with patch('apps.compiler.views.requests.post', return_value=mock_response):
            response = self.client.post(EXECUTE_URL, VALID_PAYLOAD, format='json')
        self.assertIn('warning: foo', response.data['stderr'])
        self.assertIn('runtime error', response.data['stderr'])


class ExecuteCodeUnexpectedExceptionTest(TestCase):
    """Excepción genérica → 500."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ex_user', email='ex@test.com', password='pass'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_generic_exception_returns_500(self):
        with patch('apps.compiler.views.requests.post', side_effect=ValueError('boom')):
            response = self.client.post(EXECUTE_URL, VALID_PAYLOAD, format='json')
        self.assertEqual(response.status_code, 500)
        self.assertIn('boom', response.data['error'])
