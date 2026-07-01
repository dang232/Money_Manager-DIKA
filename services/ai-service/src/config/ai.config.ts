// ponytail: AI service configuration — env validation with ConfigModule pattern
import { registerAs } from '@nestjs/config';

export const AI_CONFIG_KEY = 'AI_CONFIG';

export type AiProviderType = 'anthropic' | 'groq' | 'custom' | 'mock';

export interface AiConfig {
  providerType: AiProviderType;
  apiKey: string;
  apiBaseUrl: string;
  modelName: string;
  maxTokens: number;
  timeoutMs: number;
  confidenceThreshold: number;
  budgetServiceUrl: string;
}

export const aiConfig = registerAs(AI_CONFIG_KEY, (): AiConfig => {
  const providerType = (process.env['AI_PROVIDER_TYPE'] ?? 'mock') as AiProviderType;
  const isProd = process.env['NODE_ENV'] === 'production';

  // Validate required fields based on provider
  if (providerType !== 'mock') {
    if (isProd && !process.env['AI_API_KEY']) {
      throw new Error('AI_API_KEY is required in production');
    }
    if (isProd && !process.env['AI_API_BASE_URL']) {
      throw new Error('AI_API_BASE_URL is required in production');
    }
  }

  return {
    providerType,
    apiKey: process.env['AI_API_KEY'] ?? '',
    apiBaseUrl: process.env['AI_API_BASE_URL'] ?? 'https://api.anthropic.com/api/claude/web',
    modelName: process.env['AI_MODEL_NAME'] ?? 'claude-sonnet-4-20250514',
    maxTokens: Number(process.env['AI_MAX_TOKENS'] ?? 200),
    timeoutMs: Number(process.env['AI_TIMEOUT_MS'] ?? 5000),
    confidenceThreshold: Number(process.env['AI_CONFIDENCE_THRESHOLD'] ?? 0.7),
    budgetServiceUrl: process.env['BUDGET_SERVICE_URL'] ?? 'http://localhost:3002',
  };
});
