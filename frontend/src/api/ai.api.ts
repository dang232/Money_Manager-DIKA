import httpClient from './http-client'

export interface CategorizeRequest {
  transactionId: string
  description: string
  categories: { id: string; name: string }[]
}

export interface CategorizeResponse {
  categoryId: string
  confidence: number
}

export interface Insight {
  title: string
  body: string
  type: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const aiApi = {
  categorize(dto: CategorizeRequest) {
    // interceptor unwraps {data: CategorizeResponse} → CategorizeResponse
    return httpClient.post<CategorizeResponse>('/ai/categorize', dto)
  },
  getInsights() {
    // interceptor unwraps {data: {insights}} → {insights}
    return httpClient.get<{ insights: Insight[] }>('/ai/insights')
  },
  generateInsights() {
    // interceptor unwraps {data: {insights}} → {insights}
    return httpClient.post<{ insights: Insight[] }>('/ai/insights')
  },
  chat(messages: ChatMessage[]) {
    // interceptor unwraps {data: {reply}} → {reply}
    return httpClient.post<{ reply: string }>('/ai/chat', { messages })
  },
}
