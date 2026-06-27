// ponytail: RefreshToken aggregate — opaque token persisted as sha-256 hash
import { generateUuid } from '@money-manager/shared-kernel';
import { createHash, randomBytes } from 'crypto';

export interface CreateRefreshTokenProps {
  userId: string;
  ttlSeconds: number;
}

export class RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: Date;
  revokedAt: Date | null;
  readonly createdAt: Date;

  // ponytail: hash is private — the persistence mapper calls hashForPersistence() instead of touching fields
  private readonly tokenHash: string;

  private constructor(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    revokedAt: Date | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.revokedAt = revokedAt;
    this.createdAt = createdAt;
  }

  static create(props: CreateRefreshTokenProps): { token: RefreshToken; plaintext: string } {
    const plaintext = randomBytes(48).toString('base64url');
    const token = new RefreshToken(
      generateUuid(),
      props.userId,
      hashToken(plaintext),
      new Date(Date.now() + props.ttlSeconds * 1000),
      null,
      new Date(),
    );
    return { token, plaintext };
  }

  static reconstitute(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    revokedAt: Date | null,
    createdAt: Date,
  ): RefreshToken {
    return new RefreshToken(id, userId, tokenHash, expiresAt, revokedAt, createdAt);
  }

  // ponytail: hashing is the only domain operation on the hash — matches() is the consumer
  matches(plaintext: string): boolean {
    return this.tokenHash === hashToken(plaintext);
  }

  isUsable(): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > Date.now();
  }

  revoke(): void {
    if (this.revokedAt) return;
    this.revokedAt = new Date();
  }

  // exposed for the persistence mapper so it can store the aggregate without reflection
  hashForPersistence(): string {
    return this.tokenHash;
  }
}

function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}