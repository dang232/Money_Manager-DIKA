// ponytail: MikroORM implementation of UserRepository
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from '../../domain/aggregates/user.aggregate';
import { UserRepository } from '../../domain/repositories/user.repository.port';
import { UserEntity } from './user.entity';
import { UserMapper } from './user.mapper';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.em.findOne(UserEntity, { id });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const entity = UserMapper.toEntity(user);
    const saved = await this.em.upsert(UserEntity, entity);
    await this.em.flush();
    return UserMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(UserEntity, { id });
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.em.findOne(UserEntity, { email: email.toLowerCase() });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}