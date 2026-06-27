// ponytail: unit tests for RefreshToken aggregate
import { RefreshToken } from './refresh-token.aggregate';

describe('RefreshToken', () => {
  it('matches returns true for the same plaintext it was created from', () => {
    const { token, plaintext } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    expect(token.matches(plaintext)).toBe(true);
  });

  it('matches returns false for a different plaintext', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    expect(token.matches('nope')).toBe(false);
  });

  it('isUsable is true when not revoked and not expired', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    expect(token.isUsable()).toBe(true);
  });

  it('revoke flips isUsable to false', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    token.revoke();
    expect(token.isUsable()).toBe(false);
  });

  it('revoke is idempotent', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    token.revoke();
    const at = token.revokedAt;
    token.revoke();
    expect(token.revokedAt).toBe(at);
  });

  it('expiresAt is in the past for negative ttl', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: -1 });
    expect(token.isUsable()).toBe(false);
  });

  it('hashForPersistence returns the stored hash', () => {
    const { token } = RefreshToken.create({ userId: 'u1', ttlSeconds: 60 });
    expect(token.hashForPersistence()).toMatch(/^[0-9a-f]{64}$/);
  });
});