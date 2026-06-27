// ponytail: handler for UpdateProfileCommand — patch fields on the aggregate
import { Injectable, Inject } from '@nestjs/common';
import { UpdateProfileCommand } from '../commands/update-profile.command';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { UserProfileRepository, USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.port';

@Injectable()
export class UpdateProfileHandler {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly repo: UserProfileRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<UserProfile> {
    let profile = await this.repo.findById(command.userId);
    if (!profile) {
      profile = UserProfile.create({ userId: command.userId });
    }

    profile.applyPatch({
      displayName: command.displayName,
      avatarUrl: command.avatarUrl,
      locale: command.locale,
      timezone: command.timezone,
      defaultCurrency: command.defaultCurrency,
      budgetAnchorDay: command.budgetAnchorDay,
    });

    return this.repo.save(profile);
  }
}