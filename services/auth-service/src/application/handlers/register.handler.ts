// ponytail: handler for RegisterCommand — creates user, returns access + refresh tokens
import { Injectable, Inject } from '@nestjs/common';
import { DomainException } from '@money-manager/shared-kernel';
import { RegisterCommand } from '../commands/register.command';
import { User } from '../../domain/aggregates/user.aggregate';
import { Email } from '../../domain/value-objects/email';
import { PasswordHash } from '../../domain/value-objects/password-hash';
import { UserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.port';
import { PasswordHasher, PASSWORD_HASHER } from '../../domain/services/password-hasher.port';
import { TokenIssuer, IssuedTokenPair } from '../token-issuer';

export interface RegisterResult {
  user: User;
  tokens: IssuedTokenPair;
}

@Injectable()
export class RegisterHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const email = Email.create(command.email);

    const existing = await this.userRepo.findByEmail(email.value);
    if (existing) {
      throw new DomainException('A user with this email already exists', 'USER_EMAIL_TAKEN');
    }

    if (command.password.length < 8) {
      throw new DomainException('Password must be at least 8 characters', 'PASSWORD_TOO_WEAK');
    }

    const hash = await this.hasher.hash(command.password);
    const user = User.create({
      email,
      passwordHash: PasswordHash.fromHash(hash),
      displayName: command.displayName,
    });

    const saved = await this.userRepo.save(user);
    const tokens = await this.issuer.issueFor(saved);

    return { user: saved, tokens };
  }
}