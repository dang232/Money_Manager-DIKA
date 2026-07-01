// ponytail: Anthropic adapter — calls Anthropic Messages API via proxy
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AiProviderPort, CategoryInfo, CategorySuggestion, AI_PROVIDER } from '../../domain/interfaces/ai-provider.port';
import { aiConfig } from '../../config/ai.config';

@Injectable()
export class AnthropicAdapter implements AiProviderPort {
  constructor(
    @Inject(aiConfig.KEY) private readonly config: ConfigType<typeof aiConfig>,
  ) {}

  async suggestCategory(description: string, categories: CategoryInfo[]): Promise<CategorySuggestion> {
    const prompt = this.buildPrompt(description, categories);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return this.fallback(categories);
      }

      const data = await res.json() as { content?: Array<{ text?: string }> };
      const content = data.content?.[0]?.text ?? '';
      return this.parseResponse(content, categories);
    } catch {
      clearTimeout(timeout);
      return this.fallback(categories);
    }
  }

  private buildPrompt(description: string, categories: CategoryInfo[]): string {
    const categoryList = categories
      .map(c => `{id:"${c.id}", name:"${c.name}", type:"${c.type}"}`)
      .join(', ');

    return `You are a financial categorization assistant for the Money Manager app.
Your task is to categorize transaction descriptions into one of the available categories.

Available categories:
[${categoryList}]

Rules:
1. Analyze the transaction description for keywords and patterns
2. Match to the most appropriate category based on meaning, not just word matching
3. Common patterns:
   - "coffee", "restaurant", "lunch", "dinner", "food" → Food & Dining
   - "uber", "lyft", "bus", "train", "gas", "fuel" → Transportation
   - "netflix", "spotify", "subscription" → Entertainment
   - "salary", "paycheck", "deposit" → Income
   - "electric", "water", "internet", "phone bill" → Bills & Utilities
4. If uncertain, choose the closest match with lower confidence
5. NEVER invent categories not in the list

Respond with JSON only:
{"categoryId": "...", "categoryName": "...", "confidence": 0.0-1.0, "reasoning": "..."}

Transaction description: "${description}"
Categorize this transaction.`;
  }

  private parseResponse(content: string, categories: CategoryInfo[]): CategorySuggestion {
    try {
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
