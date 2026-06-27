// ponytail: MikroORM implementation of RefreshTokenRepository
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'crypto';
import { RefreshToken } from '../../domain/aggregates/refresh-token.aggregate';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.port';
import { RefreshTokenEntity } from './refresh-token.entity';
import { RefreshTokenMapper } from './refresh-token.mapper';

@Injectable()
export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const entity = await this.em.findOne(RefreshTokenEntity, { id });
    return entity ? RefreshTokenMapper.toDomain(entity) : null;
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const entity = RefreshTokenMapper.toEntity(token);
    const saved = await this.em.upsert(RefreshTokenEntity, entity);
    await this.em.flush();
    return RefreshTokenMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(RefreshTokenEntity, { id });
  }

  async findByPlaintext(plaintext: string): Promise<RefreshToken | null> {
    // ponytail: lookup by hash — we never store the plaintext
    const hash = createHash('sha256').update(plaintext).digest('hex');
    const entity = await this.em.findOne(RefreshTokenEntity, { tokenHash: hash });
    return entity ? RefreshTokenMapper.toDomain(entity) : null;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.em.nativeUpdate(
      RefreshTokenEntity,
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }
}