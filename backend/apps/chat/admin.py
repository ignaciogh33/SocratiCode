from django.contrib import admin
from .models import ChatSession, Message, SystemConfig


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

    fieldsets = (
        ('Moderación de contenido', {
            'fields': ('moderation_mode',),
            'description': 'Controla qué moderación se aplica a los mensajes del chat.',
        }),
        ('Modelos LLM (Ollama)', {
            'fields': ('llm_model', 'moderation_model'),
            'description': 'Nombres de los modelos instalados en Ollama.',
        }),
    )

    def has_add_permission(self, request):
        # No permitir crear más de una fila
        return not SystemConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        # Redirigir siempre al formulario de edición de la única fila
        obj = SystemConfig.get()
        from django.shortcuts import redirect
        return redirect(f'{obj.pk}/change/')
