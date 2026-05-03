<template>
  <div class="typing-indicator">
    <div class="typing-indicator__avatar">
      <img src="../../assets/images/logo-circular.svg" alt="Sócrates" />
    </div>
    <div class="typing-indicator__dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  align-self: flex-start;
}

.typing-indicator__avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid var(--color-primary);
  opacity: 0.7;
}

.typing-indicator__dots {
  display: flex;
  gap: 4px;
  padding: 10px 16px;
  background-color: var(--color-surface-input);
  border-radius: var(--radius-lg);
}

.typing-indicator__dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-muted);
  animation: bounce 1.2s infinite ease-in-out;
}

.typing-indicator__dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator__dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
