// ponytail: Locale value object — BCP-47 loose check (xx or xx-YY)
const BCP47 = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;

export class Locale {
  readonly value: string;

  private constructor(v: string) { this.value = v; }

  static create(raw: string): Locale {
    const v = raw?.trim();
    if (!v || !BCP47.test(v)) {
      throw new Error(`Invalid locale: ${raw}. Expected BCP-47 format (e.g. en-US)`);
    }
    return new Locale(v);
  }

  toString(): string { return this.value; }
}