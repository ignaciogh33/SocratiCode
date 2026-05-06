from djoser.email import PasswordResetEmail as BasePasswordResetEmail
from django.conf import settings


class PasswordResetEmail(BasePasswordResetEmail):
    """
    Extiende el email de Djoser para imprimir la URL de reset
    de forma limpia en la consola durante el desarrollo.
    """

    def send(self, to, *args, **kwargs):
        if settings.DEBUG:
            context = self.get_context_data()
            url = f"{context['protocol']}://{context['domain']}/{context['url']}"
            print("\n" + "─" * 60)
            print("📧 EMAIL DE RESET DE CONTRASEÑA")
            print(f"   Para: {', '.join(to)}")
            print(f"   URL:  {url}")
            print("─" * 60 + "\n")

        super().send(to, *args, **kwargs)
