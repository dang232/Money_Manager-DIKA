// ponytail: query to get budget status for a given month
export class GetBudgetStatusQuery {
  constructor(
    public readonly userId: string,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
