<template>
  <div class="message-list" ref="listRef">
    <div v-if="chatStore.isLoadingMessages" class="message-list__loading">
      <SkeletonLoader width="60%" height="60px" />
      <SkeletonLoader width="45%" height="40px" />
      <SkeletonLoader width="70%" height="80px" />
    </div>

    <MessageBubble
      v-for="msg in chatStore.sortedMessages"
      :key="msg.id"
      :message="msg"
    />

    <TypingIndicator v-if="chatStore.isStreaming && !lastMessageIsStreaming" />

    <!-- Scroll anchor -->
    <div ref="scrollAnchor"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '../../stores/chat'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import SkeletonLoader from '../ui/SkeletonLoader.vue'

const chatStore = useChatStore()
const listRef = ref(null)
const scrollAnchor = ref(null)

const lastMessageIsStreaming = computed(() => {
  const msgs = chatStore.sortedMessages
  return msgs.length > 0 && msgs[msgs.length - 1]._isStreaming
})

watch(
  () => [chatStore.messages.length, chatStore.streamBuffer],
  () => {
    nextTick(() => {
      scrollAnchor.value?.scrollIntoView({ behavior: 'smooth' })
    })
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => {
    scrollAnchor.value?.scrollIntoView()
  })
})

watch(
  () => chatStore.activeSessionId,
  () => {
    nextTick(() => {
      scrollAnchor.value?.scrollIntoView()
    })
  }
)
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-list__loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}
</style>
