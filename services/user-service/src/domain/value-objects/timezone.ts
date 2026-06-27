// ponytail: Timezone value object — validates against Node's Intl IANA set + UTC
const IANA_ZONES: Set<string> = new Set(Intl.supportedValuesOf('timeZone'));
IANA_ZONES.add('UTC'); // ponytail: Intl omits UTC but it's valid

export class Timezone {
  readonly value: string;

  private constructor(v: string) { this.value = v; }

  static create(raw: string): Timezone {
    const v = raw?.trim();
    if (!v || !IANA_ZONES.has(v)) {
      throw new Error(`Invalid timezone: ${raw}. Must be IANA (e.g. Asia/Ho_Chi_Minh)`);
    }
    return new Timezone(v);
  }

  toString(): string { return this.value; }
}