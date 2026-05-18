async for chunk in await client.chat(
    model=llm_model,
    messages=messages_payload,
    stream=True,
):
    token = chunk['message']['content']
    full_response += token
    yield f"data: {json.dumps({'token': token})}\n\n"
    await asyncio.sleep(0)
