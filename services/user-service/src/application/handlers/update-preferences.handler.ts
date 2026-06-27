// ponytail: handler for UpdatePreferencesCommand
import { Injectable, Inject } from '@nestjs/common';
import { UpdatePreferencesCommand } from '../commands/update-preferences.command';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { UserProfileRepository, USER_PROFILE_REPOSITORY } from '../../domain/repositories/user-profile.repository.port';

@Injectable()
export class UpdatePreferencesHandler {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY) private readonly repo: UserProfileRepository,
  ) {}

  async execute(command: UpdatePreferencesCommand): Promise<UserProfile> {
    let profile = await this.repo.findById(command.userId);
    if (!profile) {
      profile = UserProfile.create({ userId: command.userId });
    }

    profile.applyPreferences(command.prefs);
    return this.repo.save(profile);
  }
}