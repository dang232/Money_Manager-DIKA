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

export interface AiProviderPort {
  suggestCategory(description: string, categories: CategoryInfo[]): Promise<CategorySuggestion>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
