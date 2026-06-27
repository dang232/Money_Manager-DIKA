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
  <div class="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
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
              <svg class="h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 7.5h-9v9h9v-9z" />
                <path fill-rule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clip-rule="evenodd" />
              </svg>
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
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
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
              <svg class="h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
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
            <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
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
      <svg v-if="open" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
      <!-- Chat bubble icon when closed -->
      <svg v-else class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a40.493 40.493 0 004.723-.464c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.102 41.102 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM7 9a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>
</template>
