// ponytail: BudgetPeriod value object — year+month pair for budget tracking
export class BudgetPeriod {
  readonly year: number;
  readonly month: number;

  constructor(year: number, month: number) {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (year < 2000 || year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }
    this.year = year;
    this.month = month;
  }

  toString(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}`;
  }

  equals(other: BudgetPeriod): boolean {
    return this.year === other.year && this.month === other.month;
  }

  static current(): BudgetPeriod {
    const now = new Date();
    return new BudgetPeriod(now.getFullYear(), now.getMonth() + 1);
  }
}
