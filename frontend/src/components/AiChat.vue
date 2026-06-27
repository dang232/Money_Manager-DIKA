<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useAiStore } from '@/stores/ai.store'

const ai = useAiStore()

const open = ref(false)
const input = ref('')
const messagesEl = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

async function send() {
  const text = input.value.trim()
  if (!text || ai.loading) return
  input.value = ''
  await ai.sendChat(text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

// Scroll to bottom whenever messages change
watch(
  () => ai.chatMessages.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  },
)
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
    <!-- Chat panel -->
    <div
      v-if="open"
      class="w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
      style="height: 28rem"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <div class="flex items-center gap-2">
          <span class="text-lg" aria-hidden="true">🤖</span>
          <span class="text-sm font-semibold text-foreground">Financial Assistant</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="text-xs text-muted-foreground hover:text-foreground transition-colors"
            @click="ai.clearChat()"
          >
            Clear
          </button>
          <button
            class="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close chat"
            @click="toggle"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div
        ref="messagesEl"
        class="flex-1 overflow-y-auto p-4 space-y-3"
      >
        <div
          v-if="ai.chatMessages.length === 0"
          class="text-sm text-muted-foreground text-center py-6"
        >
          Ask me anything about your finances.
        </div>
        <div
          v-for="(msg, idx) in ai.chatMessages"
          :key="idx"
          class="flex"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
            :class="
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-muted text-foreground rounded-bl-sm'
            "
          >
            {{ msg.content }}
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="ai.loading" class="flex justify-start">
          <div class="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-muted-foreground">
            <span class="animate-pulse">Thinking...</span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="px-3 py-3 border-t border-border flex gap-2">
        <input
          v-model="input"
          type="text"
          placeholder="Ask about your spending..."
          class="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          :disabled="ai.loading"
          @keydown="onKeydown"
        />
        <button
          class="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          :disabled="ai.loading || !input.trim()"
          @click="send"
        >
          Send
        </button>
      </div>
    </div>

    <!-- Toggle button -->
    <button
      class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center text-2xl hover:opacity-90 transition-opacity"
      aria-label="Toggle AI chat"
      @click="toggle"
    >
      {{ open ? '✕' : '🤖' }}
    </button>
  </div>
</template>
