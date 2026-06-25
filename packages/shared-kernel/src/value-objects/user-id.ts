// ponytail: UserId value object — wraps user identifier, provides DEFAULT for single-user v1
export class UserId {
  static readonly DEFAULT = new UserId('00000000-0000-4000-a000-000000000001');

  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    this.value = value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
