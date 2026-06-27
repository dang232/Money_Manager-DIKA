// ponytail: handler for GetPublicProfileQuery — returns limited public fields
import { Injectable, Inject } from '@nestjs/common';
import { NotFoundException } from '@money-manager/shared-kernel';
import { GetPublicProfileQuery } from '../queries/get-public-profile.query';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { UserProfileRepository, USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.port';

@Injectable()
export class GetPublicProfileHandler {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly repo: UserProfileRepository,
  ) {}

  async execute(query: GetPublicProfileQuery): Promise<{ id: string; displayName: string | null; avatarUrl: string | null }> {
    const profile = await this.repo.findById(query.userId);
    if (!profile) throw new NotFoundException('UserProfile', query.userId);
    return { id: profile.id, displayName: profile.displayName, avatarUrl: profile.avatarUrl };
  }
}