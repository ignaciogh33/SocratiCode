from django.db import models
from django.contrib.auth import get_user_model

# User = get_user_model() # Descomentar cuando se implemente la gestión de usuarios

class ChatSession(models.Model):
    # user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
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

    def __str__(self):
        return f"Mensaje {self.id} ({self.role}) en Sesión {self.session_id}"
