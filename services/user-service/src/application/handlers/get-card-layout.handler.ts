// ponytail: handler for GetCardLayoutQuery — auto-creates layout on first hit
import { Injectable, Inject } from '@nestjs/common';
import { GetCardLayoutQuery } from '../queries/get-card-layout.query';
import { CardLayout } from '../../domain/aggregates/card-layout.aggregate';
import { CardLayoutRepository, CARD_LAYOUT_REPOSITORY } from '../../domain/repositories/card-layout.repository.port';

@Injectable()
export class GetCardLayoutHandler {
  constructor(
    @Inject(CARD_LAYOUT_REPOSITORY) private readonly repo: CardLayoutRepository,
  ) {}

  async execute(query: GetCardLayoutQuery): Promise<CardLayout> {
    const existing = await this.repo.findByUserId(query.userId);
    if (existing) return existing;

    // ponytail: auto-create on first hit — id = userId, race-safe via upsert on PK
    const layout = CardLayout.create(query.userId);
    return this.repo.save(layout);
  }
}