// ponytail: User aggregate — registered identity, owns password hash
import { UserId, generateUuid } from '@money-manager/shared-kernel';
import { Email } from '../value-objects/email';
import { PasswordHash } from '../value-objects/password-hash';

export interface CreateUserProps {
  email: Email;
  passwordHash: PasswordHash;
  displayName?: string;
}

export class User {
  readonly id: string;
  readonly email: Email;
  private passwordHash: PasswordHash;
  displayName: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(
    id: string,
    email: Email,
    passwordHash: PasswordHash,
    displayName: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.displayName = displayName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create(props: CreateUserProps): User {
    const now = new Date();
    return new User(
      generateUuid(),
      props.email,
      props.passwordHash,
      props.displayName?.trim() || props.email.value.split('@')[0],
      now,
      now,
    );
  }

  static reconstitute(
    id: string,
    email: Email,
    passwordHash: PasswordHash,
    displayName: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(id, email, passwordHash, displayName, createdAt, updatedAt);
  }

  // ponytail: domain doesn't verify passwords itself — it just hands the hash back to the hasher port
  currentHash(): PasswordHash {
    return this.passwordHash;
  }

  changePassword(nextHash: PasswordHash): void {
    this.passwordHash = nextHash;
    this.updatedAt = new Date();
  }

  userId(): UserId {
    return new UserId(this.id);
  }
}