from django.db import models

from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Aquí puedes añadir campos extra en el futuro sin miedo
    bio = models.TextField(blank=True, null=True)

    class Meta:
        # Esto ayuda a que el Admin de Django sepa qué modelo usar
        swappable = 'AUTH_USER_MODEL'