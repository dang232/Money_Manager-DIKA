// ponytail: mock AI adapter — deterministic fallback for testing/dev without API key
import { AiProviderPort, CategoryInfo, CategorySuggestion, ChatMessage, ChatResponse, Insight } from '../../domain/interfaces/ai-provider.port';

export class MockAiAdapter implements AiProviderPort {
  async suggestCategory(_description: string, categories: CategoryInfo[]): Promise<CategorySuggestion> {
    return {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      confidence: 0.5,
      reasoning: 'mock suggestion',
    };
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const lastMessage = messages[messages.length - 1]?.content ?? '';
    return {
      reply: `[Mock AI] You said: "${lastMessage}". This is a mock response for development.`,
    };
  }

  async getInsights(_userId: string): Promise<Insight[]> {
    return [
      { title: 'Mock Insight 1', body: 'This is a mock insight for development.', type: 'tip' },
      { title: 'Mock Insight 2', body: 'Configure AI_API_KEY for real insights.', type: 'tip' },
    ];
  }

  async generateInsights(_userId: string): Promise<Insight[]> {
    return this.getInsights(_userId);
  }
}
