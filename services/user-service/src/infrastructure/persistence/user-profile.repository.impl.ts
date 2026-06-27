// ponytail: MikroORM implementation of UserProfileRepository
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository.port';
import { UserProfileEntity } from './user-profile.entity';
import { UserProfileMapper } from './user-profile.mapper';

@Injectable()
export class UserProfileRepositoryImpl implements UserProfileRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<UserProfile | null> {
    const entity = await this.em.findOne(UserProfileEntity, { id });
    return entity ? UserProfileMapper.toDomain(entity) : null;
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    const entity = UserProfileMapper.toEntity(profile);
    const saved = await this.em.upsert(UserProfileEntity, entity);
    await this.em.flush();
    return UserProfileMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(UserProfileEntity, { id });
  }
}