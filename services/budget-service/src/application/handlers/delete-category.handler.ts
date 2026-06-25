// ponytail: handler for DeleteCategoryCommand
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@money-manager/shared-kernel';
import { DeleteCategoryCommand } from '../commands/delete-category.command';
import { CategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.port';

@Injectable()
export class DeleteCategoryHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(command: DeleteCategoryCommand): Promise<void> {
    const category = await this.categoryRepo.findById(command.id);
    if (!category) {
      throw new NotFoundException('Category', command.id);
    }
    await this.categoryRepo.delete(command.id);
  }
}
