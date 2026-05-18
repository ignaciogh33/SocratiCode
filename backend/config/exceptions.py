from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    """
    Standardizes DRF exception responses to always return:
    {
        "error": "Main human-readable generic error message.",
        "details": { "field": ["errors"] } // or None if no specifics
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "error": "Ha ocurrido un error en la validación.",
            "details": response.data
        }
        
        if isinstance(response.data, dict):
            # If it's a generic APIException with a 'detail' string (like NotFound or PermissionDenied)
            if 'detail' in response.data:
                custom_data["error"] = response.data['detail']
                custom_data["details"] = None
            else:
                # Iterate for ValidationErrors looking for the first useful message
                for key, value in response.data.items():
                    if isinstance(value, list) and len(value) > 0 and isinstance(value[0], str):
                        custom_data["error"] = f"{key}: {value[0]}"
                        break
                    elif isinstance(value, str):
                        custom_data["error"] = value
                        break
        elif isinstance(response.data, list) and len(response.data) > 0 and isinstance(response.data[0], str):
            custom_data["error"] = response.data[0]
            
        response.data = custom_data

    return response
