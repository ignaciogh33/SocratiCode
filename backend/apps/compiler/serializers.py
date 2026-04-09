from rest_framework import serializers


class ExecuteInputSerializer(serializers.Serializer):
    source_code = serializers.CharField(
        help_text="Código fuente a ejecutar",
    )
    language = serializers.CharField(
        default="python3",
        help_text="Lenguaje de programación (ej: python3, c, javascript)",
    )
    version = serializers.CharField(
        default="3.10.0",
        help_text="Versión del lenguaje (ej: 3.10.0)",
    )


class ExecuteOutputSerializer(serializers.Serializer):
    stdout = serializers.CharField(allow_blank=True)
    stderr = serializers.CharField(allow_blank=True)
    exit_code = serializers.IntegerField()
    language = serializers.CharField()
