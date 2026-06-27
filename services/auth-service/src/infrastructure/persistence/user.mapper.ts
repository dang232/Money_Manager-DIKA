// ponytail: mapper between User domain aggregate and UserEntity
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { User } from '../../domain/aggregates/user.aggregate';
import { UserEntity } from './user.entity';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    return User.reconstitute(
      entity.id,
      Email.create(entity.email),
      PasswordHash.fromHash(entity.passwordHash),
      entity.displayName,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id;
    entity.email = domain.email.value;
    entity.passwordHash = domain.currentHash().value;
    entity.displayName = domain.displayName;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}