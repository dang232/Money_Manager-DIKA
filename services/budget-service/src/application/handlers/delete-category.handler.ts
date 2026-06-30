// FIXED: handler for DeleteCategoryCommand - validates userId ownership
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
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
    // FIXED: Verify the category belongs to the requesting user
    if (category.userId.value !== command.userId) {
      throw new ForbiddenException('You do not have access to this category');
    }
    await this.categoryRepo.delete(command.id);
  }
}
