import { defineStore } from 'pinia'
import { ref } from 'vue'
import { aiApi, type ChatMessage, type Insight } from '@/api/ai.api'

export const useAiStore = defineStore('ai', () => {
  const insights = ref<Insight[]>([])
  const chatMessages = ref<ChatMessage[]>([])
  const loading = ref(false)

  async function fetchInsights() {
    loading.value = true
    try {
      const { data } = await aiApi.getInsights()
      insights.value = data.data.insights
    } finally {
      loading.value = false
    }
  }

  async function generateInsights() {
    loading.value = true
    try {
      const { data } = await aiApi.generateInsights()
      insights.value = data.data.insights
    } finally {
      loading.value = false
    }
  }

  async function sendChat(message: string) {
    chatMessages.value.push({ role: 'user', content: message })
    loading.value = true
    try {
      const { data } = await aiApi.chat(chatMessages.value)
      chatMessages.value.push({ role: 'assistant', content: data.reply })
    } finally {
      loading.value = false
    }
  }

  function clearChat() {
    chatMessages.value = []
  }

  return { insights, chatMessages, loading, fetchInsights, generateInsights, sendChat, clearChat }
})
