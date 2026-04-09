from django.contrib import admin
from .models import ChatSession, Message


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
