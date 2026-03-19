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
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'messages']
