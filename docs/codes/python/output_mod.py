if do_output_mod:
    mod_buffer += token
    if len(mod_buffer.split()) >= word_window:
        task = asyncio.create_task(
            moderate_output_async(full_response, mod_model)
        )
        moderation_tasks.append(task)
        mod_buffer = ""
