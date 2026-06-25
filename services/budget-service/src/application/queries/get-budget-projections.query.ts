// ponytail: query to get budget projections for a given month
export class GetBudgetProjectionsQuery {
  constructor(
    public readonly userId: string,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
