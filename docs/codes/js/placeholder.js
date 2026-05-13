const assistantMessage = {
  id: 'temp-assistant-' + Date.now(),
  role: 'assistant',
  content: '',
  created_at: new Date().toISOString(),
  _isStreaming: true,
}
this.messages.push(assistantMessage)
