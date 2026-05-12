return StreamingHttpResponse(
    event_stream(),
    content_type='text/event-stream',
)
