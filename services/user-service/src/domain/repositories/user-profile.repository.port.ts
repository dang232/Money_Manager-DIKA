// ponytail: UserProfile repository port — persistence contract
import { RepositoryPort } from '@money-manager/shared-kernel';
import { UserProfile } from '../aggregates/user-profile.aggregate';

export const USER_PROFILE_REPOSITORY = 'USER_PROFILE_REPOSITORY';

export interface UserProfileRepository extends RepositoryPort<UserProfile> {
  findById(id: string): Promise<UserProfile | null>;
}