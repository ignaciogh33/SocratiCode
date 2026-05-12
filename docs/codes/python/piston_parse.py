stdout = run_data.get("stdout", "")
stderr = compile_data.get("stderr", "") + run_data.get("stderr", "")
exit_code = run_data.get("code")
status = run_data.get("status")
