// ponytail: PasswordHasher port — bcrypt-backed, swap for argon2 later if needed
export const PASSWORD_HASHER = 'PASSWORD_HASHER';

export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, hash: string): Promise<boolean>;
}