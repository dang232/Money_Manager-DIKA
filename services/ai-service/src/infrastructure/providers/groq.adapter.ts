// ponytail: Groq adapter — calls Groq API for category suggestion, chat, and insights
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AiProviderPort, CategoryInfo, CategorySuggestion, ChatMessage, ChatResponse, Insight } from '../../domain/interfaces/ai-provider.port';
import { aiConfig } from '../../config/ai.config';

@Injectable()
export class GroqAdapter implements AiProviderPort {
  constructor(
    @Inject(aiConfig.KEY) private readonly config: ConfigType<typeof aiConfig>,
  ) {}

  async suggestCategory(description: string, categories: CategoryInfo[]): Promise<CategorySuggestion> {
    const categoryList = categories.map(c => `{id:"${c.id}", name:"${c.name}", type:"${c.type}"}`).join(', ');
    const prompt = `Given transaction description '${description}', pick the best category from: [${categoryList}]. Reply JSON only: {"categoryId": "...", "categoryName": "...", "confidence": 0-1, "reasoning": "..."}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: this.config.maxTokens,
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

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const systemPrompt = 'You are a helpful personal finance assistant. Keep responses concise and actionable. Never provide financial advice that could be considered investment advice.';
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const res = await fetch(`${this.config.apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: allMessages,
          temperature: 0.7,
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return { reply: 'Sorry, I encountered an error. Please try again.' };
      }

      const data = await res.json() as any;
      const reply = data.choices?.[0]?.message?.content ?? 'I could not generate a response.';
      return { reply };
    } catch {
      clearTimeout(timeout);
      return { reply: 'Sorry, I encountered an error. Please try again.' };
    }
  }

  async getInsights(userId: string): Promise<Insight[]> {
    // ponytail: placeholder - real implementation would query transaction history
    return this.mockInsights();
  }

  async generateInsights(userId: string): Promise<Insight[]> {
    // ponytail: placeholder - real implementation would analyze spending patterns
    return this.mockInsights();
  }

  private mockInsights(): Insight[] {
    return [
      {
        title: 'Track Your Spending',
        body: 'Regular tracking helps identify spending patterns.',
        type: 'tip',
      },
      {
        title: 'Set Budget Goals',
        body: 'Create monthly budgets for each category.',
        type: 'tip',
      },
      {
        title: 'Review Weekly',
        body: 'Check your finances weekly to stay on track.',
        type: 'tip',
      },
    ];
  }
}
