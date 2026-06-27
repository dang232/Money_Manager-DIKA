// ponytail: Currency value object — ISO-4217 allowlist
const ISO_4217 = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'VND', 'AUD', 'CAD', 'SGD',
  'CNY', 'KRW', 'THB', 'INR', 'IDR', 'MYR', 'PHP', 'TWD',
]);

export class Currency {
  readonly value: string;

  private constructor(v: string) { this.value = v; }

  static create(raw: string): Currency {
    const v = raw?.trim().toUpperCase();
    if (!v || !ISO_4217.has(v)) {
      throw new Error(`Unsupported currency: ${raw}`);
    }
    return new Currency(v);
  }

  toString(): string { return this.value; }
}