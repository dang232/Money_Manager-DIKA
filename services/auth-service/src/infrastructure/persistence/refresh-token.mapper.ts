// ponytail: mapper between RefreshToken aggregate and RefreshTokenEntity
import { RefreshToken } from '../../domain/aggregates/refresh-token.aggregate';
import { RefreshTokenEntity } from './refresh-token.entity';

export class RefreshTokenMapper {
  static toDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.reconstitute(
      entity.id,
      entity.userId,
      entity.tokenHash,
      entity.expiresAt,
      entity.revokedAt,
      entity.createdAt,
    );
  }

  static toEntity(domain: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();
    entity.id = domain.id;
    entity.userId = domain.userId;
    entity.tokenHash = domain.hashForPersistence();
    entity.expiresAt = domain.expiresAt;
    entity.revokedAt = domain.revokedAt;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}