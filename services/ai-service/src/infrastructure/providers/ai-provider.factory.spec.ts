import { FactoryProvider } from '@nestjs/common';
import { aiProviderFactory } from './ai-provider.factory';
import { AnthropicAdapter } from './anthropic.adapter';
import { GroqAdapter } from './groq.adapter';
import { MockAiAdapter } from './mock-ai.adapter';

describe('aiProviderFactory', () => {
  const mockAnthropicConfig = { providerType: 'anthropic', apiKey: 'key' } as any;
  const mockGroqConfig = { providerType: 'groq', apiKey: 'key' } as any;
  const mockMockConfig = { providerType: 'mock' } as any;

  const factory = aiProviderFactory as FactoryProvider;

  it('should return AnthropicAdapter for anthropic provider type', () => {
    const adapter = factory.useFactory!(mockAnthropicConfig);
    expect(adapter).toBeInstanceOf(AnthropicAdapter);
  });

  it('should return GroqAdapter for groq provider type', () => {
    const adapter = factory.useFactory!(mockGroqConfig);
    expect(adapter).toBeInstanceOf(GroqAdapter);
  });

  it('should return MockAiAdapter for mock provider type', () => {
    const adapter = factory.useFactory!(mockMockConfig);
    expect(adapter).toBeInstanceOf(MockAiAdapter);
  });

  it('should return MockAiAdapter as default', () => {
    const adapter = factory.useFactory!(mockMockConfig);
    expect(adapter).toBeInstanceOf(MockAiAdapter);
  });
});
