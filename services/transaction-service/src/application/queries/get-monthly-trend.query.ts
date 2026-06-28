// ponytail: query to get income/expense trend over last N months
export class GetMonthlyTrendQuery {
  constructor(
    public readonly userId: string,
    public readonly months: number,
  ) {}
}
