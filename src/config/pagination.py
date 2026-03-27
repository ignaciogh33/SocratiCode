from rest_framework.pagination import PageNumberPagination

class SessionPagination(PageNumberPagination):
    """
    Paginación para el listado de sesiones del usuario.
    """
    page_size = 15
    page_query_param = 'page'

class MessagePagination(PageNumberPagination):
    """
    Paginación para los mensajes dentro de una sesión.
    Se permite al cliente especificar el tamaño de página (ej. ?size=100)
    """
    page_size = 50
    page_query_param = 'page'
    page_size_query_param = 'size'
    max_page_size = 100
