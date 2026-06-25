// ponytail: command to set (create or update) a budget for a category
export class SetBudgetCommand {
  constructor(
    public readonly userId: string,
    public readonly categoryId: string,
    public readonly monthlyLimit: number,
    public readonly currency: string,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
