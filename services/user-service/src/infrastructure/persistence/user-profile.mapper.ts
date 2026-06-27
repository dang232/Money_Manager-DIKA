// ponytail: mapper between UserProfile aggregate and UserProfileEntity
import { UserProfile } from '../../domain/aggregates/user-profile.aggregate';
import { Locale } from '../../domain/value-objects/locale';
import { Timezone } from '../../domain/value-objects/timezone';
import { Currency } from '../../domain/value-objects/currency';
import { NotificationPrefs } from '../../domain/value-objects/notification-prefs';
import { UserProfileEntity } from './user-profile.entity';

export class UserProfileMapper {
  static toDomain(entity: UserProfileEntity): UserProfile {
    return UserProfile.reconstitute(
      entity.id,
      entity.displayName,
      entity.avatarUrl,
      Locale.create(entity.locale),
      Timezone.create(entity.timezone),
      Currency.create(entity.defaultCurrency),
      entity.budgetAnchorDay,
      NotificationPrefs.create(entity.notificationPrefs),
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(domain: UserProfile): UserProfileEntity {
    const entity = new UserProfileEntity();
    entity.id = domain.id;
    entity.displayName = domain.displayName;
    entity.avatarUrl = domain.avatarUrl;
    entity.locale = domain.locale.value;
    entity.timezone = domain.timezone.value;
    entity.defaultCurrency = domain.defaultCurrency.value;
    entity.budgetAnchorDay = domain.budgetAnchorDay;
    entity.notificationPrefs = domain.notificationPrefs.toJSON() as unknown as Record<string, unknown>;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}