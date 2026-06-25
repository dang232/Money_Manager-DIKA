// ponytail: Category repository port — persistence contract
import { RepositoryPort, TransactionType } from '@money-manager/shared-kernel';
import { Category } from '../aggregates/category.aggregate';

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export interface CategoryRepository extends RepositoryPort<Category> {
  findByUserId(userId: string): Promise<Category[]>;
  findByName(userId: string, name: string, type: TransactionType): Promise<Category | null>;
}
