// ponytail: /users REST controller
import { Controller, Get, Put, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiResponse, CurrentUser, UserId } from '@money-manager/shared-kernel';
import { GetMyProfileHandler } from '../../application/handlers/get-my-profile.handler';
import { GetPublicProfileHandler } from '../../application/handlers/get-public-profile.handler';
import { UpdateProfileHandler } from '../../application/handlers/update-profile.handler';
import { UpdatePreferencesHandler } from '../../application/handlers/update-preferences.handler';
import { GetMyProfileQuery } from '../../application/queries/get-my-profile.query';
import { GetPublicProfileQuery } from '../../application/queries/get-public-profile.query';
import { UpdateProfileCommand } from '../../application/commands/update-profile.command';
import { UpdatePreferencesCommand } from '../../application/commands/update-preferences.command';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UpdatePreferencesDto } from '../dtos/update-preferences.dto';
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getMyHandler: GetMyProfileHandler,
    private readonly getPublicHandler: GetPublicProfileHandler,
    private readonly updateHandler: UpdateProfileHandler,
    private readonly prefsHandler: UpdatePreferencesHandler,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() userId: UserId) {
    const profile = await this.getMyHandler.execute(new GetMyProfileQuery(userId.value));
    return ApiResponse.ok(this.toFullResponse(profile));
  }

  @Put('me')
  async updateMe(@CurrentUser() userId: UserId, @Body() dto: UpdateProfileDto) {
    const profile = await this.updateHandler.execute(new UpdateProfileCommand(
      userId.value, dto.displayName, dto.avatarUrl, dto.locale,
      dto.timezone, dto.defaultCurrency, dto.budgetAnchorDay,
    ));
    return ApiResponse.ok(this.toFullResponse(profile));
  }

  @Put('me/preferences')
  async updatePreferences(@CurrentUser() userId: UserId, @Body() dto: UpdatePreferencesDto) {
    const profile = await this.prefsHandler.execute(
      new UpdatePreferencesCommand(userId.value, dto as Record<string, unknown>),
    );
    return ApiResponse.ok(this.toFullResponse(profile));
  }

  @Get(':id')
  async getPublic(@Param('id', ParseUUIDPipe) id: string) {
    const pub = await this.getPublicHandler.execute(new GetPublicProfileQuery(id));
    return ApiResponse.ok(pub);
  }

  private toFullResponse(p: UserProfile) {
    return {
      id: p.id,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      locale: p.locale.value,
      timezone: p.timezone.value,
      defaultCurrency: p.defaultCurrency.value,
      budgetAnchorDay: p.budgetAnchorDay,
      notificationPrefs: p.notificationPrefs.toJSON(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}