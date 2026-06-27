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
    return httpClient.post<{ data: CategorizeResponse }>('/ai/categorize', dto)
  },
  getInsights() {
    return httpClient.get<{ data: { insights: Insight[] } }>('/ai/insights')
  },
  generateInsights() {
    return httpClient.post<{ data: { insights: Insight[] } }>('/ai/insights')
  },
  chat(messages: ChatMessage[]) {
    return httpClient.post<{ data: { reply: string } }>('/ai/chat', { messages })
  },
}
