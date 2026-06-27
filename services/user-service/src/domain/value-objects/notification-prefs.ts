// ponytail: NotificationPrefs value object — JSON shape with channel mute flags
export interface NotificationPrefsData {
  email?: boolean;
  push?: boolean;
  budgetAlerts?: boolean;
}

const DEFAULTS: NotificationPrefsData = { email: true, push: true, budgetAlerts: true };

export class NotificationPrefs {
  readonly data: NotificationPrefsData;

  private constructor(data: NotificationPrefsData) { this.data = data; }

  static create(raw?: Record<string, unknown> | null): NotificationPrefs {
    if (!raw) return new NotificationPrefs({ ...DEFAULTS });
    return new NotificationPrefs({
      email: typeof raw['email'] === 'boolean' ? raw['email'] : DEFAULTS.email,
      push: typeof raw['push'] === 'boolean' ? raw['push'] : DEFAULTS.push,
      budgetAlerts: typeof raw['budgetAlerts'] === 'boolean' ? raw['budgetAlerts'] : DEFAULTS.budgetAlerts,
    });
  }

  toJSON(): NotificationPrefsData { return { ...this.data }; }
}