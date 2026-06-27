// ponytail: handler for GetMyProfileQuery — auto-creates profile on first hit
import { Injectable, Inject } from '@nestjs/common';
import { GetMyProfileQuery } from '../queries/get-my-profile.query';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { UserProfileRepository, USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.port';

@Injectable()
export class GetMyProfileHandler {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly repo: UserProfileRepository,
  ) {}

  async execute(query: GetMyProfileQuery): Promise<UserProfile> {
    const existing = await this.repo.findById(query.userId);
    if (existing) return existing;

    // ponytail: auto-create on first hit — id = userId, race-safe via upsert on PK
    const profile = UserProfile.create({ userId: query.userId });
    return this.repo.save(profile);
  }
}