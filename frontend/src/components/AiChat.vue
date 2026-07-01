<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { Bot, X, MessageCircle, MessageSquare, Send } from '@lucide/vue'
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
  <div class="fixed bottom-20 md:bottom-24 right-4 z-40 flex flex-col items-end gap-3">
    <!-- Chat panel -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="open"
        class="w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
        style="height: 28rem"
        role="dialog"
        aria-label="Financial Assistant chat"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div class="flex items-center gap-2">
            <!-- Bot icon -->
            <div class="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0" aria-hidden="true">
              <Bot :size="16" class="text-primary-foreground" />
            </div>
            <span class="text-sm font-semibold text-foreground">Financial Assistant</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear chat history"
              @click="ai.clearChat()"
            >
              Clear
            </button>
            <button
              class="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close chat"
              @click="toggle"
            >
              <X :size="16" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          ref="messagesEl"
          class="flex-1 overflow-y-auto p-4 space-y-3"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <!-- Empty state -->
          <div
            v-if="ai.chatMessages.length === 0 && !ai.loading"
            class="h-full flex flex-col items-center justify-center gap-3 text-center"
          >
            <div class="rounded-full bg-muted p-3">
              <MessageSquare :size="24" class="text-muted-foreground" aria-hidden="true" />
            </div>
            <p class="text-sm text-muted-foreground">Ask me about your spending patterns</p>
          </div>

          <!-- Message bubbles -->
          <div
            v-for="(msg, idx) in ai.chatMessages"
            :key="idx"
            class="flex"
            :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed"
              :class="
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              "
            >
              {{ msg.content }}
            </div>
          </div>

          <!-- Typing indicator: 3 animated dots -->
          <div v-if="ai.loading" class="flex justify-start" aria-label="Assistant is typing">
            <div class="bg-muted rounded-lg rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <span
                class="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style="animation-delay: 0ms"
              />
              <span
                class="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style="animation-delay: 150ms"
              />
              <span
                class="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                style="animation-delay: 300ms"
              />
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="px-3 py-3 border-t border-border flex gap-2">
          <input
            v-model="input"
            type="text"
            placeholder="Ask about your spending..."
            class="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground disabled:opacity-50"
            :disabled="ai.loading"
            aria-label="Chat message input"
            @keydown="onKeydown"
          />
          <button
            class="h-10 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            :disabled="ai.loading || !input.trim()"
            aria-label="Send message"
            @click="send"
          >
            <Send :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Floating toggle button -->
    <button
      class="rounded-full shadow-lg bg-primary text-primary-foreground w-12 h-12 flex items-center justify-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Toggle AI chat"
      @click="toggle"
    >
      <!-- Close icon when open -->
      <X v-if="open" :size="20" aria-hidden="true" />
      <!-- Chat bubble icon when closed -->
      <MessageCircle v-else :size="20" aria-hidden="true" />
    </button>
  </div>
</template>
