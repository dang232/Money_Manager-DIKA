// ponytail: handler for UpdateCategoryCommand
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@money-manager/shared-kernel';
import { UpdateCategoryCommand } from '../commands/update-category.command';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.port';

@Injectable()
export class UpdateCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<Category> {
    const category = await this.categoryRepo.findById(command.id);
    if (!category) {
      throw new NotFoundException('Category', command.id);
    }

    category.update({
      name: command.name,
      icon: command.icon,
      color: command.color,
    });

    return this.categoryRepo.save(category);
  }
}
