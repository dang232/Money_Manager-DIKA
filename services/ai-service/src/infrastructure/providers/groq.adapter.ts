// ponytail: Groq adapter — calls Groq API for category suggestion via llama-3.1-8b-instant
import { AiProviderPort, CategoryInfo, CategorySuggestion } from '../../domain/interfaces/ai-provider.port';

export class GroqAdapter implements AiProviderPort {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.1-8b-instant';

  constructor() {
    this.apiKey = process.env['GROQ_API_KEY'] ?? '';
  }

  async suggestCategory(description: string, categories: CategoryInfo[]): Promise<CategorySuggestion> {
    const categoryList = categories.map(c => `{id:"${c.id}", name:"${c.name}", type:"${c.type}"}`).join(', ');
    const prompt = `Given transaction description '${description}', pick the best category from: [${categoryList}]. Reply JSON only: {"categoryId": "...", "categoryName": "...", "confidence": 0-1, "reasoning": "..."}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return this.fallback(categories);
      }

      const data = await res.json() as any;
      const content = data.choices?.[0]?.message?.content ?? '';
      return this.parseResponse(content, categories);
    } catch {
      clearTimeout(timeout);
      return this.fallback(categories);
    }
  }

  private parseResponse(content: string, categories: CategoryInfo[]): CategorySuggestion {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.fallback(categories);

      const parsed = JSON.parse(jsonMatch[0]);
      if (
        typeof parsed.categoryId === 'string' &&
        typeof parsed.categoryName === 'string' &&
        typeof parsed.confidence === 'number' &&
        typeof parsed.reasoning === 'string'
      ) {
        return parsed as CategorySuggestion;
      }
      return this.fallback(categories);
    } catch {
      return this.fallback(categories);
    }
  }

  private fallback(categories: CategoryInfo[]): CategorySuggestion {
    return {
      categoryId: categories[0].id,
      categoryName: categories[0].name,
      confidence: 0.3,
      reasoning: 'fallback',
    };
  }
}
