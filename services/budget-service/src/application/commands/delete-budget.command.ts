// ponytail: command to delete a budget by categoryId and period
export class DeleteBudgetCommand {
  constructor(
    public readonly categoryId: string,
    public readonly userId: string,
    public readonly year?: number,
    public readonly month?: number,
  ) {}
}
