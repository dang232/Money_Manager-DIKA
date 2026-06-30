// ponytail: handler for UpdateCardLayoutCommand — last-write-wins by timestamp
import { Injectable, Inject } from '@nestjs/common';
import { UpdateCardLayoutCommand } from '../commands/update-card-layout.command';
import { CardLayout } from '../../domain/aggregates/card-layout.aggregate';
import { CardLayoutRepository, CARD_LAYOUT_REPOSITORY } from '../../domain/repositories/card-layout.repository.port';

@Injectable()
export class UpdateCardLayoutHandler {
  constructor(
    @Inject(CARD_LAYOUT_REPOSITORY) private readonly repo: CardLayoutRepository,
  ) {}

  async execute(command: UpdateCardLayoutCommand): Promise<CardLayout> {
    let current = await this.repo.findByUserId(command.userId);

    // ponytail: auto-create if doesn't exist
    if (!current) {
      current = CardLayout.create(command.userId);
    }

    // ponytail: conflict resolution — last-write-wins by timestamp
    if (command.clientTimestamp <= current.updatedAt.getTime()) {
      // Server version is newer, return it
      return current;
    }

    // Update layout
    current.updateLayout(command.layout);
    return this.repo.save(current);
  }
}