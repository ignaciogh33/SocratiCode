from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=200, default='Nueva conversación')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Sesión {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'Usuario'),
        ('assistant', 'Asistente'),
        ('system', 'Sistema'),
    ]
    
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    moderated = models.BooleanField(default=False)

    def __str__(self):
        return f"Mensaje {self.id} ({self.role}) en Sesión {self.session_id}"


class SystemConfig(models.Model):
    """Configuración global del sistema. Solo puede existir una fila (singleton)."""

    MODERATION_CHOICES = [
        ('both', 'Input + Output'),
        ('input', 'Solo Input'),
        ('output', 'Solo Output'),
        ('none', 'Desactivada'),
    ]

    moderation_mode = models.CharField(
        max_length=10,
        choices=MODERATION_CHOICES,
        default='both',
        verbose_name='Modo de moderación',
        help_text='Qué moderación aplicar a los mensajes del chat.',
    )
    llm_model = models.CharField(
        max_length=100,
        default='llama3.2',
        verbose_name='Modelo LLM principal',
        help_text='Nombre del modelo de Ollama para el tutor (ej: llama3.2, phi4-mini-reasoning).',
    )
    moderation_model = models.CharField(
        max_length=100,
        default='llama3.2',
        verbose_name='Modelo LLM de moderación',
        help_text='Nombre del modelo de Ollama para la moderación de contenido.',
    )
    mod_word_window = models.PositiveIntegerField(
        default=40,
        verbose_name='Ventana de moderación (palabras)',
        help_text='Cada cuántas palabras del output se lanza un check de moderación.',
    )

    class Meta:
        verbose_name = 'Configuración del sistema'
        verbose_name_plural = 'Configuración del sistema'

    def __str__(self):
        return 'Configuración del sistema'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        """Obtiene la configuración (la crea con defaults si no existe)."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj