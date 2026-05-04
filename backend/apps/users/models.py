from django.db import models

from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Opciones de tema según el brief
    THEME_CHOICES = (
        ('light', 'Light Theme'),
        ('dark', 'Dark Theme'),
    )

    email = models.EmailField(unique=True, blank=False, null=False)

    bio = models.TextField(blank=True, null=True)
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='dark')

    class Meta:
        swappable = 'AUTH_USER_MODEL'