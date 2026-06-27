// ponytail: unit tests for User aggregate
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';
import { User } from './user.aggregate';

describe('User', () => {
  const validEmail = Email.create('Alice@example.com');
  const validHash = PasswordHash.fromHash('$2b$10$CwTycUXWue0Thq9StjUM0uJ8hZxQjFK3Y5jGfM8F8wQGf3k8iS1dK');

  it('normalizes email to lowercase and trims', () => {
    const u = User.create({ email: validEmail, passwordHash: validHash });
    expect(u.email.value).toBe('alice@example.com');
  });

  it('defaults displayName from local part of email', () => {
    const u = User.create({ email: validEmail, passwordHash: validHash });
    expect(u.displayName).toBe('alice');
  });

  it('changePassword updates hash and bumps updatedAt', async () => {
    const u = User.create({ email: validEmail, passwordHash: validHash });
    const before = u.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const newHash = PasswordHash.fromHash('$2b$10$XYZgF8wQGf3k8iS1dKCwTycUXWue0Thq9StjUM0uJ8hZxQjFK3Y5j');
    u.changePassword(newHash);
    expect(u.currentHash().value).toBe(newHash.value);
    expect(u.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('userId returns a UserId wrapping the user id', () => {
    const u = User.create({ email: validEmail, passwordHash: validHash });
    expect(u.userId().value).toBe(u.id);
  });
});