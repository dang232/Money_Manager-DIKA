// ponytail: factory provider — selects provider based on AI_PROVIDER_TYPE config
import { Provider } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AI_PROVIDER } from '../../domain/interfaces/ai-provider.port';
import { aiConfig } from '../../config/ai.config';
import { AnthropicAdapter } from './anthropic.adapter';
import { GroqAdapter } from './groq.adapter';
import { MockAiAdapter } from './mock-ai.adapter';

export const aiProviderFactory: Provider = {
  provide: AI_PROVIDER,
  inject: [aiConfig.KEY], // CONFIGURATION(AI_CONFIG)
  useFactory: (config: ConfigType<typeof aiConfig>) => {
    switch (config.providerType) {
      case 'anthropic':
        return new AnthropicAdapter(config);
      case 'groq':
        return new GroqAdapter(config);
      case 'mock':
      default:
        return new MockAiAdapter();
    }
  },
};
