// ponytail: handles GetInsightsCommand and GenerateInsightsCommand
import { Injectable, Inject } from '@nestjs/common';
import { AiProviderPort, AI_PROVIDER, Insight } from '../../domain/interfaces/ai-provider.port';

@Injectable()
export class InsightsHandler {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProviderPort,
  ) {}

  async getInsights(userId: string): Promise<Insight[]> {
    return this.aiProvider.getInsights(userId);
  }

  async generateInsights(userId: string): Promise<Insight[]> {
    return this.aiProvider.generateInsights(userId);
  }
}
