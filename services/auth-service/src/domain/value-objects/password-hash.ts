// ponytail: PasswordHash value object — wraps a bcrypt hash string
export class PasswordHash {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static fromHash(hash: string): PasswordHash {
    if (!hash || hash.length === 0) {
      throw new Error('PasswordHash cannot be empty');
    }
    // bcrypt hashes start with $2a$ / $2b$ / $2y$ and are 60 chars
    if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(hash)) {
      throw new Error('PasswordHash is not a valid bcrypt hash');
    }
    return new PasswordHash(hash);
  }
}