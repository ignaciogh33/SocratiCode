"""
Tests de cobertura para apps/chat/admin.py.

Cubre:
- _get_ollama_choices() con Ollama disponible y no disponible
- SystemConfigForm.__init__ con choices y sin choices (+ modelo no disponible en lista)
- ChatSessionAdmin.message_count
- MessageAdmin.short_content (texto corto y texto largo)
- SystemConfigAdmin.has_add_permission (con y sin fila existente)
- SystemConfigAdmin.has_delete_permission
- SystemConfigAdmin.changelist_view → redirect
- SystemConfigAdmin.changeform_view con Ollama caído (GET) y Ollama vivo (GET), y POST
"""
from unittest.mock import patch, MagicMock

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.test import TestCase, RequestFactory
from django.contrib.messages.storage.fallback import FallbackStorage

from apps.chat.admin import (
    _get_ollama_choices,
    SystemConfigForm,
    ChatSessionAdmin,
    MessageAdmin,
    SystemConfigAdmin,
)
from apps.chat.models import ChatSession, Message, SystemConfig

User = get_user_model()


def _request_with_messages(factory_request):
    """Añade soporte de messages framework a una RequestFactory request."""
    setattr(factory_request, 'session', 'session')
    messages = FallbackStorage(factory_request)
    setattr(factory_request, '_messages', messages)
    return factory_request


class GetOllamaChoicesTest(TestCase):
    """Tests de _get_ollama_choices."""

    def test_returns_sorted_list_when_ollama_available(self):
        mock_model_b = MagicMock()
        mock_model_b.model = 'llama3.2'
        mock_model_a = MagicMock()
        mock_model_a.model = 'codellama'
        mock_response = MagicMock()
        mock_response.models = [mock_model_b, mock_model_a]

        with patch('apps.chat.admin.ollama.list', return_value=mock_response):
            result = _get_ollama_choices()

        self.assertEqual(result, [('codellama', 'codellama'), ('llama3.2', 'llama3.2')])

    def test_returns_none_when_ollama_unavailable(self):
        with patch('apps.chat.admin.ollama.list', side_effect=Exception('connection refused')):
            result = _get_ollama_choices()

        self.assertIsNone(result)


class SystemConfigFormTest(TestCase):
    """Tests del formulario dinámico de modelos."""

    def test_fields_become_choicefields_when_ollama_available(self):
        mock_model = MagicMock()
        mock_model.model = 'llama3.2'
        mock_response = MagicMock()
        mock_response.models = [mock_model]

        with patch('apps.chat.admin.ollama.list', return_value=mock_response):
            form = SystemConfigForm()

        from django import forms as dj_forms
        self.assertIsInstance(form.fields['llm_model'], dj_forms.ChoiceField)
        self.assertIsInstance(form.fields['moderation_model'], dj_forms.ChoiceField)
        self.assertTrue(form.ollama_available)

    def test_unavailable_model_prepended_with_warning(self):
        """Si el modelo guardado no está en la lista de Ollama, aparece con ⚠."""
        mock_model = MagicMock()
        mock_model.model = 'llama3.2'
        mock_response = MagicMock()
        mock_response.models = [mock_model]

        config = SystemConfig.get()
        config.llm_model = 'modelo-antiguo'
        config.save()

        with patch('apps.chat.admin.ollama.list', return_value=mock_response):
            form = SystemConfigForm(instance=config, initial={'llm_model': 'modelo-antiguo'})

        choices = [c[0] for c in form.fields['llm_model'].choices]
        self.assertIn('modelo-antiguo', choices)
        labels = [c[1] for c in form.fields['llm_model'].choices]
        self.assertTrue(any('⚠' in label for label in labels))

    def test_help_text_updated_when_ollama_unavailable(self):
        with patch('apps.chat.admin.ollama.list', side_effect=Exception):
            form = SystemConfigForm()

        self.assertFalse(form.ollama_available)
        self.assertIn('Ollama sin conexión', form.fields['llm_model'].help_text)
        self.assertIn('Ollama sin conexión', form.fields['moderation_model'].help_text)


class ChatSessionAdminTest(TestCase):
    """Tests de ChatSessionAdmin.message_count."""

    def setUp(self):
        self.site = AdminSite()
        self.admin = ChatSessionAdmin(ChatSession, self.site)
        self.user = User.objects.create_user(
            username='admin', email='admin@test.com', password='pass'
        )

    def test_message_count_returns_correct_count(self):
        session = ChatSession.objects.create(user=self.user)
        Message.objects.create(session=session, role='user', content='hola')
        Message.objects.create(session=session, role='assistant', content='mundo')

        self.assertEqual(self.admin.message_count(session), 2)

    def test_message_count_zero_for_empty_session(self):
        session = ChatSession.objects.create(user=self.user)
        self.assertEqual(self.admin.message_count(session), 0)


class MessageAdminTest(TestCase):
    """Tests de MessageAdmin.short_content."""

    def setUp(self):
        self.site = AdminSite()
        self.admin = MessageAdmin(Message, self.site)
        self.user = User.objects.create_user(
            username='admin2', email='admin2@test.com', password='pass'
        )
        self.session = ChatSession.objects.create(user=self.user)

    def test_short_content_truncates_long_text(self):
        long_text = 'a' * 100
        msg = Message.objects.create(session=self.session, role='user', content=long_text)
        result = self.admin.short_content(msg)
        self.assertTrue(result.endswith('...'))
        self.assertLessEqual(len(result), 84)  # 80 + len('...')

    def test_short_content_returns_full_short_text(self):
        msg = Message.objects.create(session=self.session, role='user', content='Hola')
        result = self.admin.short_content(msg)
        self.assertEqual(result, 'Hola')


class SystemConfigAdminTest(TestCase):
    """Tests de SystemConfigAdmin."""

    def setUp(self):
        self.site = AdminSite()
        self.admin_instance = SystemConfigAdmin(SystemConfig, self.site)
        self.factory = RequestFactory()
        self.superuser = User.objects.create_superuser(
            username='superuser', email='superuser@test.com', password='pass'
        )

    # ── has_add_permission ────────────────────────────────────────────

    def test_has_add_permission_false_when_config_exists(self):
        SystemConfig.get()  # Crea la fila singleton
        request = self.factory.get('/')
        request.user = self.superuser
        self.assertFalse(self.admin_instance.has_add_permission(request))

    def test_has_add_permission_true_when_no_config(self):
        SystemConfig.objects.all().delete()
        request = self.factory.get('/')
        request.user = self.superuser
        self.assertTrue(self.admin_instance.has_add_permission(request))

    # ── has_delete_permission ─────────────────────────────────────────

    def test_has_delete_permission_always_false(self):
        request = self.factory.get('/')
        request.user = self.superuser
        self.assertFalse(self.admin_instance.has_delete_permission(request))
        config = SystemConfig.get()
        self.assertFalse(self.admin_instance.has_delete_permission(request, config))

    # ── changelist_view ───────────────────────────────────────────────

    def test_changelist_view_redirects_to_change_page(self):
        config = SystemConfig.get()
        request = self.factory.get('/admin/chat/systemconfig/')
        request.user = self.superuser
        _request_with_messages(request)

        response = self.admin_instance.changelist_view(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn(str(config.pk), response['Location'])

    # ── changeform_view ───────────────────────────────────────────────

    def test_changeform_view_get_shows_warning_when_ollama_down(self):
        config = SystemConfig.get()
        request = self.factory.get(f'/admin/chat/systemconfig/{config.pk}/change/')
        request.user = self.superuser
        _request_with_messages(request)

        with patch('apps.chat.admin._get_ollama_choices', return_value=None), \
             patch('apps.chat.admin.ollama.list', side_effect=Exception):
            response = self.admin_instance.changeform_view(
                request, object_id=str(config.pk)
            )

        self.assertEqual(response.status_code, 200)
        storage = list(request._messages)
        self.assertEqual(len(storage), 1)
        self.assertIn('No hay conexión con Ollama', storage[0].message)

    def test_changeform_view_get_no_warning_when_ollama_up(self):
        config = SystemConfig.get()
        request = self.factory.get(f'/admin/chat/systemconfig/{config.pk}/change/')
        request.user = self.superuser
        _request_with_messages(request)

        mock_model = MagicMock()
        mock_model.model = 'llama3.2'
        mock_response = MagicMock()
        mock_response.models = [mock_model]

        with patch('apps.chat.admin._get_ollama_choices', return_value=[('llama3.2', 'llama3.2')]):
            response = self.admin_instance.changeform_view(
                request, object_id=str(config.pk)
            )

        self.assertEqual(response.status_code, 200)
        storage = list(request._messages)
        self.assertEqual(len(storage), 0)

    def test_changeform_view_post_does_not_add_warning(self):
        """En POST (guardar) no se añade el aviso aunque Ollama esté caído."""
        config = SystemConfig.get()
        request = self.factory.post(
            f'/admin/chat/systemconfig/{config.pk}/change/',
            data={
                'moderation_mode': 'both',
                'llm_model': 'llama3.2',
                'moderation_model': 'llama3.2',
                'mod_word_window': 40,
                '_save': 'Guardar',
            }
        )
        request.user = self.superuser
        _request_with_messages(request)

        with patch('apps.chat.admin._get_ollama_choices', return_value=None):
            self.admin_instance.changeform_view(request, object_id=str(config.pk))

        storage = list(request._messages)
        self.assertEqual(len(storage), 0)
