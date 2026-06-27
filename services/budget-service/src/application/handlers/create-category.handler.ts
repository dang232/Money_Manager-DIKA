// ponytail: handler for CreateCategoryCommand
import { Injectable, Inject } from '@nestjs/common';
import { UserId, DomainException, EventBusPort } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT } from '@money-manager/shared-kernel';
import { CreateCategoryCommand } from '../commands/create-category.command';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.port';
import { CategoryCreatedEvent } from '../../domain/events/category-created.event';

@Injectable()
export class CreateCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: CategoryRepository,
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<Category> {
    const existing = await this.categoryRepo.findByName(command.userId, command.name, command.type);
    if (existing) {
      throw new DomainException('Category with this name and type already exists', 'CATEGORY_DUPLICATE');
    }

    const category = Category.create({
      userId: new UserId(command.userId),
      name: command.name,
      type: command.type,
      icon: command.icon,
      color: command.color,
    });

    const saved = await this.categoryRepo.save(category);
    await this.eventBus.publish('budget.events', new CategoryCreatedEvent(saved.id, command.userId, saved.name, saved.type));
    return saved;
  }
}
