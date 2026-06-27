// ponytail: User repository port — persistence contract
import { RepositoryPort } from '@money-manager/shared-kernel';
import { User } from '../aggregates/user.aggregate';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface UserRepository extends RepositoryPort<User> {
  findByEmail(email: string): Promise<User | null>;
}