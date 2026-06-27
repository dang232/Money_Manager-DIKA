// ponytail: MikroORM entity for refresh_tokens — stores sha-256 of opaque token
import { Entity, Property, Index } from '@mikro-orm/core';
import { BaseEntity } from '@money-manager/infrastructure';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshTokenEntity extends BaseEntity {
  @Index()
  @Property({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @Property({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash!: string;

  @Property({ name: 'expires_at', type: 'Date' })
  expiresAt!: Date;

  @Property({ name: 'revoked_at', type: 'Date', nullable: true })
  revokedAt!: Date | null;
}