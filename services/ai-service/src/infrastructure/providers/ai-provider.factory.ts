// ponytail: factory provider — selects Groq or Mock based on env
import { Provider } from '@nestjs/common';
import { AI_PROVIDER } from '../../domain/interfaces/ai-provider.port';
import { GroqAdapter } from './groq.adapter';
import { MockAiAdapter } from './mock-ai.adapter';

export const aiProviderFactory: Provider = {
  provide: AI_PROVIDER,
  useFactory: () => {
    if (process.env['GROQ_API_KEY']) {
      return new GroqAdapter();
    }
    return new MockAiAdapter();
  },
};
