// ponytail: Money value object — immutable, non-negative amount + currency
export const DEFAULT_CURRENCY = 'VND'

export class Money {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency = DEFAULT_CURRENCY) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    this.amount = amount;
    this.currency = currency.toUpperCase();
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
