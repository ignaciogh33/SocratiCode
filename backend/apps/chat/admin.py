from django.contrib import admin, messages
from django import forms
from .models import ChatSession, Message, SystemConfig

import ollama


def _get_ollama_choices():
    """Consulta a Ollama los modelos instalados y devuelve choices para un select.
    
    Returns:
        list of tuples si hay conexión, None si Ollama no está disponible.
    """
    try:
        response = ollama.list()
        names = sorted(m.model for m in response.models)
        return [(n, n) for n in names]
    except Exception:
        return None


class SystemConfigForm(forms.ModelForm):
    """Formulario con selectores dinámicos de modelos de Ollama."""

    class Meta:
        model = SystemConfig
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        choices = _get_ollama_choices()
        self.ollama_available = choices is not None

        if choices:
            for field_name in ('llm_model', 'moderation_model'):
                current = self.initial.get(field_name) or self.fields[field_name].initial
                field_choices = list(choices)
                if current and current not in [c[0] for c in field_choices]:
                    field_choices = [(current, f'{current}  ⚠ no disponible')] + field_choices
                self.fields[field_name] = forms.ChoiceField(
                    choices=field_choices,
                    initial=current,
                    label=self.fields[field_name].label,
                    help_text=self.fields[field_name].help_text,
                )
        else:
            no_conn_note = ' (Ollama sin conexión — introduce el nombre manualmente.)'
            for field_name in ('llm_model', 'moderation_model'):
                original_help = self.fields[field_name].help_text or ''
                self.fields[field_name].help_text = original_help + no_conn_note


class MessageInline(admin.TabularInline):
    """Muestra los mensajes dentro de la página de una sesión."""
    model = Message
    extra = 0  # No mostrar filas vacías para añadir
    readonly_fields = ('role', 'content', 'created_at', 'moderated')
    ordering = ('created_at',)


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'created_at', 'message_count')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'user__username')
    readonly_fields = ('created_at',)
    inlines = [MessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Nº Mensajes'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'role', 'short_content', 'created_at', 'moderated')
    list_filter = ('role', 'created_at', 'moderated')
    search_fields = ('content',)
    readonly_fields = ('created_at',)

    def short_content(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    short_content.short_description = 'Contenido'


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    """Panel de configuración del sistema (singleton — una sola fila)."""

    form = SystemConfigForm

    fieldsets = (
        ('Moderación de contenido', {
            'fields': ('moderation_mode', 'mod_word_window'),
            'description': 'Controla qué moderación se aplica a los mensajes del chat.',
        }),
        ('Modelos LLM (Ollama)', {
            'fields': ('llm_model', 'moderation_model'),
            'description': 'Nombres de los modelos instalados en Ollama.',
        }),
    )

    def has_add_permission(self, request):
        return not SystemConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Redirigir siempre al formulario de edición de la única fila
        obj = SystemConfig.get()
        from django.shortcuts import redirect
        return redirect(f'{obj.pk}/change/')

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        # Mostrar aviso solo en GET para evitar que aparezca duplicado tras guardar
        if request.method == 'GET' and not _get_ollama_choices():
            messages.warning(
                request,
                'No hay conexión con Ollama en este momento. '
                'Puedes introducir el nombre del modelo manualmente en los campos de abajo. '
                'Los cambios se guardarán igualmente y se aplicarán cuando Ollama vuelva a estar disponible.',
            )
        return super().changeform_view(request, object_id, form_url, extra_context)
