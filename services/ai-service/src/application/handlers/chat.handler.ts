// ponytail: handles ChatCommand — conversational AI chat
import { Injectable, Inject } from '@nestjs/common';
import { AiProviderPort, AI_PROVIDER, ChatMessage, ChatResponse } from '../../domain/interfaces/ai-provider.port';

@Injectable()
export class ChatHandler {
  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProviderPort,
  ) {}

  async execute(messages: ChatMessage[]): Promise<ChatResponse> {
    return this.aiProvider.chat(messages);
  }
}
