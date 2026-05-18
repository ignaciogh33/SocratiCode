onToken: (token) => {
  this.streamBuffer += token
  const msg = this.messages.find((m) => m.id === assistantMessage.id)
  if (msg) msg.content = this.streamBuffer
},
