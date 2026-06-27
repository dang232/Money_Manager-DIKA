// ponytail: UserProfile aggregate — user preferences and settings
import { UserId, DomainException } from '@money-manager/shared-kernel';
import { Locale } from '../value-objects/locale';
import { Timezone } from '../value-objects/timezone';
import { Currency } from '../value-objects/currency';
import { NotificationPrefs } from '../value-objects/notification-prefs';

export interface CreateUserProfileProps {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
  defaultCurrency?: string;
  budgetAnchorDay?: number;
  notificationPrefs?: Record<string, unknown>;
}

export interface UpdateProfilePatch {
  displayName?: string | null;
  avatarUrl?: string | null;
  locale?: string;
  timezone?: string;
  defaultCurrency?: string;
  budgetAnchorDay?: number;
}

export class UserProfile {
  readonly id: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: Locale;
  timezone: Timezone;
  defaultCurrency: Currency;
  budgetAnchorDay: number;
  notificationPrefs: NotificationPrefs;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(
    id: string, displayName: string | null, avatarUrl: string | null,
    locale: Locale, timezone: Timezone, defaultCurrency: Currency,
    budgetAnchorDay: number, notificationPrefs: NotificationPrefs,
    createdAt: Date, updatedAt: Date,
  ) {
    this.id = id;
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
    this.locale = locale;
    this.timezone = timezone;
    this.defaultCurrency = defaultCurrency;
    this.budgetAnchorDay = budgetAnchorDay;
    this.notificationPrefs = notificationPrefs;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create(props: CreateUserProfileProps): UserProfile {
    const now = new Date();
    return new UserProfile(
      props.userId,
      props.displayName ?? null,
      props.avatarUrl ?? null,
      Locale.create(props.locale ?? 'en-US'),
      Timezone.create(props.timezone ?? 'UTC'),
      Currency.create(props.defaultCurrency ?? 'VND'),
      UserProfile.validateAnchorDay(props.budgetAnchorDay ?? 1),
      NotificationPrefs.create(props.notificationPrefs),
      now, now,
    );
  }

  static reconstitute(
    id: string, displayName: string | null, avatarUrl: string | null,
    locale: Locale, timezone: Timezone, defaultCurrency: Currency,
    budgetAnchorDay: number, notificationPrefs: NotificationPrefs,
    createdAt: Date, updatedAt: Date,
  ): UserProfile {
    return new UserProfile(id, displayName, avatarUrl, locale, timezone,
      defaultCurrency, budgetAnchorDay, notificationPrefs, createdAt, updatedAt);
  }

  applyPatch(patch: UpdateProfilePatch): void {
    if (patch.displayName !== undefined) this.displayName = patch.displayName;
    if (patch.avatarUrl !== undefined) this.avatarUrl = patch.avatarUrl;
    if (patch.locale !== undefined) this.locale = Locale.create(patch.locale);
    if (patch.timezone !== undefined) this.timezone = Timezone.create(patch.timezone);
    if (patch.defaultCurrency !== undefined) this.defaultCurrency = Currency.create(patch.defaultCurrency);
    if (patch.budgetAnchorDay !== undefined) this.budgetAnchorDay = UserProfile.validateAnchorDay(patch.budgetAnchorDay);
    this.updatedAt = new Date();
  }

  applyPreferences(prefs: Record<string, unknown>): void {
    this.notificationPrefs = NotificationPrefs.create(prefs);
    this.updatedAt = new Date();
  }

  private static validateAnchorDay(day: number): number {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new DomainException('budgetAnchorDay must be an integer between 1 and 31', 'INVALID_ANCHOR_DAY');
    }
    return day;
  }
}