<template>
  <div class="skeleton" :style="{ width, height, borderRadius }"></div>
</template>

<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' },
  borderRadius: { type: String, default: 'var(--radius-sm)' },
})
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-input) 25%,
    var(--color-border) 50%,
    var(--color-surface-input) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite ease-in-out;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
