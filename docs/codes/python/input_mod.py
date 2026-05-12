is_safe = await sync_to_async(moderate_input)(
    user_text, code_context, mod_model
)

if not is_safe:
    await sync_to_async(_mark_user_message_moderated)(safe_session_id)
    async def moderated_stream():
        payload = json.dumps({'response': MODERATED_RESPONSE,
                              'session_id': safe_session_id})
        yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingHttpResponse(moderated_stream(),
                                 content_type='text/event-stream')
