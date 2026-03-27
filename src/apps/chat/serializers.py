from rest_framework import serializers
from .models import ChatSession, Message


class ChatInputSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(
        help_text="ID de la sesión de chat activa (opcional u 0 para crear una nueva)",
        required=False,
        allow_null=True
    )
    prompt = serializers.CharField(
        max_length=2000, 
        error_messages={'max_length': 'El mensaje es demasiado largo (máx 2000 caracteres).'}
    )
    code_context = serializers.CharField(
        required=False, allow_blank=True, default="",
        help_text="Código actual en el editor del alumno (enviado automáticamente por el frontend)",
    )
    last_output = serializers.CharField(
        required=False, allow_blank=True, default="",
        help_text="Última salida de ejecución (stdout/stderr)",
    )
    language = serializers.CharField(
        required=False, allow_blank=True, default="python",
        help_text="Lenguaje del editor (python, c, javascript, etc.)",
    )


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    session_id = serializers.IntegerField()


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'created_at', 'moderated']


class ChatSessionSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'last_message']

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        return msg.content[:100] if msg else None


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at']
