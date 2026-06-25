// ponytail: command to trigger AI category suggestion
import { CategoryInfo } from '../../domain/interfaces/ai-provider.port';

export class SuggestCategoryCommand {
  constructor(
    public readonly transactionId: string,
    public readonly description: string,
    public readonly userId: string,
    public readonly categories: CategoryInfo[],
  ) {}
}
