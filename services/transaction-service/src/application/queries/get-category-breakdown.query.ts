// ponytail: query to get expense breakdown by category for a month
export class GetCategoryBreakdownQuery {
  constructor(
    public readonly userId: string,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
