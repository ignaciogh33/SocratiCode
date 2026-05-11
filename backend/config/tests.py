"""
Tests de cobertura para los módulos de config:
- custom_exception_handler: ramas de dict con valor string y de lista de strings
- asgi / wsgi: importación cubre las líneas de nivel de módulo
"""
from unittest.mock import MagicMock, patch
from django.test import TestCase

from config.exceptions import custom_exception_handler


class CustomExceptionHandlerTest(TestCase):
    """Tests de config/exceptions.py."""

    def test_dict_with_string_value_uses_it_as_error(self):
        """response.data es dict con valor string → líneas 31-33."""
        mock_response = MagicMock()
        mock_response.data = {'custom_field': 'mensaje de error personalizado'}

        with patch('config.exceptions.exception_handler', return_value=mock_response):
            result = custom_exception_handler(Exception('test'), {})

        self.assertEqual(result.data['error'], 'mensaje de error personalizado')

    def test_list_data_uses_first_string_as_error(self):
        """response.data es lista de strings → líneas 34-35."""
        mock_response = MagicMock()
        mock_response.data = ['primer error de la lista']

        with patch('config.exceptions.exception_handler', return_value=mock_response):
            result = custom_exception_handler(Exception('test'), {})

        self.assertEqual(result.data['error'], 'primer error de la lista')

    def test_returns_none_when_handler_returns_none(self):
        """Si exception_handler devuelve None, retorna None sin modificar."""
        with patch('config.exceptions.exception_handler', return_value=None):
            result = custom_exception_handler(Exception('test'), {})
        self.assertIsNone(result)


class AsgiWsgiImportTest(TestCase):
    """Importar asgi.py y wsgi.py cubre sus líneas de módulo."""

    def test_asgi_importable(self):
        import config.asgi  # noqa: F401
        self.assertTrue(hasattr(config.asgi, 'application'))

    def test_wsgi_importable(self):
        import config.wsgi  # noqa: F401
        self.assertTrue(hasattr(config.wsgi, 'application'))
