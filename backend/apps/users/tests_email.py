"""
Tests de cobertura para apps/users/email.py.

Cubre:
- PasswordResetEmail.send en DEBUG=True (imprime en consola + llama a super)
- PasswordResetEmail.send en DEBUG=False (llama a super directamente)
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model

User = get_user_model()


class PasswordResetEmailTest(TestCase):
    """Tests de PasswordResetEmail.send."""

    def _make_email_instance(self):
        from apps.users.email import PasswordResetEmail
        instance = PasswordResetEmail.__new__(PasswordResetEmail)
        # Simular get_context_data para que devuelva un contexto mínimo
        instance.get_context_data = MagicMock(return_value={
            'protocol': 'http',
            'domain': 'localhost:5173',
            'url': 'reset-password/uid123/token456',
        })
        return instance

    @override_settings(DEBUG=True)
    def test_send_in_debug_prints_and_calls_super(self):
        instance = self._make_email_instance()
        with patch('apps.users.email.BasePasswordResetEmail.send') as mock_super_send:
            instance.send(['user@example.com'])
        mock_super_send.assert_called_once_with(['user@example.com'])

    @override_settings(DEBUG=False)
    def test_send_not_in_debug_calls_super_directly(self):
        instance = self._make_email_instance()
        with patch('apps.users.email.BasePasswordResetEmail.send') as mock_super_send:
            instance.send(['user@example.com'])
        # No se llama a get_context_data cuando DEBUG=False
        instance.get_context_data.assert_not_called()
        mock_super_send.assert_called_once_with(['user@example.com'])
