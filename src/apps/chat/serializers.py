from rest_framework import serializers

class ChatInputSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(help_text="ID de la sesión de chat activa")
    prompt = serializers.CharField(
        max_length=2000, 
        error_messages={'max_length': 'El mensaje es demasiado largo (máx 2000 caracteres).'}
    )

class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    session_id = serializers.IntegerField()
