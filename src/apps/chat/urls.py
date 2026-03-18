from django.urls import path
from .views import (
    chat_view, list_sessions, create_session,
    session_detail, delete_session, rename_session,
)

urlpatterns = [
    path('', chat_view, name='chat_view'),
    path('sessions/', list_sessions, name='list_sessions'),
    path('sessions/create/', create_session, name='create_session'),
    path('sessions/<int:session_id>/', session_detail, name='session_detail'),
    path('sessions/<int:session_id>/delete/', delete_session, name='delete_session'),
    path('sessions/<int:session_id>/rename/', rename_session, name='rename_session'),
]
