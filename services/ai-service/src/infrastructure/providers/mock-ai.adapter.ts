// ponytail: mock AI adapter — deterministic fallback for testing/dev without API key
import { AiProviderPort, CategoryInfo, CategorySuggestion } from '../../domain/interfaces/ai-provider.port';

export class MockAiAdapter implements AiProviderPort {
  async suggestCategory(_description: string, categories: CategoryInfo[]): Promise<CategorySuggestion> {
    return {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      confidence: 0.5,
      reasoning: 'mock suggestion',
    };
  }
}
