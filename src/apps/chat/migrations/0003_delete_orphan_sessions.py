from django.db import migrations


def delete_orphan_sessions(apps, schema_editor):
    """Borra las ChatSession que no tienen usuario asignado."""
    ChatSession = apps.get_model('chat', 'ChatSession')
    ChatSession.objects.filter(user__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_add_user_nullable'),
    ]

    operations = [
        migrations.RunPython(delete_orphan_sessions, migrations.RunPython.noop),
    ]
