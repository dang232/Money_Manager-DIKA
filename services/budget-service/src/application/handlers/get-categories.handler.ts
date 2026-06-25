// ponytail: handler for GetCategoriesQuery
import { Injectable, Inject } from '@nestjs/common';
import { GetCategoriesQuery } from '../queries/get-categories.query';
import { Category } from '../../domain/aggregates/category.aggregate';
import { CategoryRepository, CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.port';

@Injectable()
export class GetCategoriesHandler {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categoryRepo: CategoryRepository,
  ) {}

  async execute(query: GetCategoriesQuery): Promise<Category[]> {
    return this.categoryRepo.findByUserId(query.userId);
  }
}
