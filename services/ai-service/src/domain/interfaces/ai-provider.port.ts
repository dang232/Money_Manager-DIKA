// ponytail: AI provider port — abstraction for LLM-based category suggestion
import { TransactionType } from '@money-manager/shared-kernel';

export interface CategoryInfo {
  id: string;
  name: string;
  type: TransactionType;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export interface Insight {
  title: string;
  body: string;
  type: string;
}

export interface AiProviderPort {
  suggestCategory(description: string, categories: CategoryInfo[]): Promise<CategorySuggestion>;
  chat(messages: ChatMessage[]): Promise<ChatResponse>;
  getInsights(userId: string): Promise<Insight[]>;
  generateInsights(userId: string): Promise<Insight[]>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
