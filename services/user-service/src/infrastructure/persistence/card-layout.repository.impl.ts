// ponytail: MikroORM implementation of CardLayoutRepository with Redis cache
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CardLayout } from '../../domain/aggregates/card-layout.aggregate';
import { CardLayoutRepository } from '../../domain/repositories/card-layout.repository.port';
import { CardLayoutEntity } from './card-layout.entity';
import { CardLayoutCacheService } from '../cache/card-layout-cache.service';

@Injectable()
export class CardLayoutRepositoryImpl implements CardLayoutRepository {
  constructor(
    private readonly em: EntityManager,
    private readonly cache: CardLayoutCacheService,
  ) {}

  async findByUserId(userId: string): Promise<CardLayout | null> {
    // Check cache first
    const cached = await this.cache.get(userId);
    if (cached) {
      return new CardLayout(
        userId,
        cached.layout,
        cached.version,
        new Date(),
        new Date(),
      );
    }

    // Query database
    const entity = await this.em.findOne(CardLayoutEntity, { userId });
    if (!entity) return null;

    const layout = new CardLayout(
      entity.userId,
      entity.layout,
      entity.version,
      entity.createdAt,
      entity.updatedAt,
    );

    // Cache for next request
    await this.cache.set(userId, entity.layout, entity.version);
    return layout;
  }

  async save(layout: CardLayout): Promise<CardLayout> {
    const entity = {
      userId: layout.userId,
      layout: layout.layout,
      version: layout.version,
    };
    await this.em.upsert(CardLayoutEntity, entity);
    await this.em.flush();
    // Invalidate cache
    await this.cache.invalidate(layout.userId);
    return layout;
  }
}