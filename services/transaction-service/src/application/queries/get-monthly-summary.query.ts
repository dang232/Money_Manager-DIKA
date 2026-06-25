// ponytail: query to get monthly income/expense summary
export class GetMonthlySummaryQuery {
  constructor(
    public readonly userId: string,
    public readonly year: number,
    public readonly month: number,
  ) {}
}
