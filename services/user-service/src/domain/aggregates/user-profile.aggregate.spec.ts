// ponytail: unit tests for UserProfile aggregate
import { UserProfile } from './user-profile.aggregate';

describe('UserProfile', () => {
  it('creates with sensible defaults', () => {
    const p = UserProfile.create({ userId: 'u1' });
    expect(p.id).toBe('u1');
    expect(p.locale.value).toBe('en-US');
    expect(p.timezone.value).toBe('UTC');
    expect(p.defaultCurrency.value).toBe('VND');
    expect(p.budgetAnchorDay).toBe(1);
    expect(p.notificationPrefs.data.email).toBe(true);
  });

  it('applyPatch updates only provided fields', () => {
    const p = UserProfile.create({ userId: 'u1' });
    p.applyPatch({ displayName: 'Alice', defaultCurrency: 'USD' });
    expect(p.displayName).toBe('Alice');
    expect(p.defaultCurrency.value).toBe('USD');
    expect(p.locale.value).toBe('en-US'); // unchanged
  });

  it('applyPatch rejects invalid currency', () => {
    const p = UserProfile.create({ userId: 'u1' });
    expect(() => p.applyPatch({ defaultCurrency: 'XXX' })).toThrow('Unsupported currency');
  });

  it('applyPatch rejects invalid timezone', () => {
    const p = UserProfile.create({ userId: 'u1' });
    expect(() => p.applyPatch({ timezone: 'Not/Real' })).toThrow('Invalid timezone');
  });

  it('validates budgetAnchorDay bounds', () => {
    expect(() => UserProfile.create({ userId: 'u1', budgetAnchorDay: 0 })).toThrow();
    expect(() => UserProfile.create({ userId: 'u1', budgetAnchorDay: 32 })).toThrow();
    const p = UserProfile.create({ userId: 'u1', budgetAnchorDay: 28 });
    expect(p.budgetAnchorDay).toBe(28);
  });

  it('applyPreferences overwrites notification prefs', () => {
    const p = UserProfile.create({ userId: 'u1' });
    p.applyPreferences({ email: false, push: true, budgetAlerts: false });
    expect(p.notificationPrefs.data.email).toBe(false);
    expect(p.notificationPrefs.data.budgetAlerts).toBe(false);
  });
});