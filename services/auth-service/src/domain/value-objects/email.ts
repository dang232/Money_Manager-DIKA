// ponytail: Email value object — RFC 5322-lite check, stored lowercased
export class Email {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Email {
    if (!raw) {
      throw new Error('Email cannot be empty');
    }
    const normalized = raw.trim().toLowerCase();
    // ponytail: pragmatic regex — full RFC 5322 is unreadable; this catches the obvious misses
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email is not valid');
    }
    if (normalized.length > 254) {
      throw new Error('Email is too long');
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}