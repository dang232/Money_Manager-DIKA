import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TransactionType } from '@money-manager/shared-kernel';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryRepository } from '../../domain/repositories/category.repository.port';
import { CategoryEntity } from './category.entity';
import { CategoryMapper } from './category.mapper';

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Category | null> {
    const entity = await this.em.findOne(CategoryEntity, { id });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async save(category: Category): Promise<Category> {
    const entity = CategoryMapper.toEntity(category);
    const saved = await this.em.upsert(CategoryEntity, entity);
    await this.em.flush();
    return CategoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.em.nativeDelete(CategoryEntity, { id });
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const entities = await this.em.find(CategoryEntity, { userId });
    return entities.map(CategoryMapper.toDomain);
  }

  async findByName(userId: string, name: string, type: TransactionType): Promise<Category | null> {
    const entity = await this.em.findOne(CategoryEntity, { userId, name, type });
    return entity ? CategoryMapper.toDomain(entity) : null;
  }
}
