// ponytail: handler for LoginCommand — verifies password, issues token pair
import { Injectable, Inject } from '@nestjs/common';
import { DomainException } from '@money-manager/shared-kernel';
import { LoginCommand } from '../commands/login.command';
import { User } from '../../domain/aggregates/user.aggregate';
import { Email } from '../../domain/value-objects/email';
import { UserRepository, USER_REPOSITORY } from '../../domain/repositories/user.repository.port';
import { PasswordHasher, PASSWORD_HASHER } from '../../domain/services/password-hasher.port';
import { TokenIssuer, IssuedTokenPair } from '../token-issuer';

// ponytail: cost-10 placeholder hash so verify() runs ~same work as a real check
// bcrypt hash = $2b$10$ (7 chars) + 22-char salt + 31-char digest = 60 total
const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export interface LoginResult {
  user: User;
  tokens: IssuedTokenPair;
}

@Injectable()
export class LoginHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const email = Email.create(command.email);
    const user = await this.userRepo.findByEmail(email.value);

    // ponytail: same error for missing user vs wrong password — no enumeration
    const genericFail = () => new DomainException('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');

    if (!user) {
      // ponytail: run a dummy bcrypt verify so timing doesn't leak whether the email exists
      await this.hasher.verify(command.password, DUMMY_BCRYPT_HASH);
      throw genericFail();
    }

    const ok = await this.hasher.verify(command.password, user.currentHash().value);
    if (!ok) {
      throw genericFail();
    }

    const tokens = await this.issuer.issueFor(user);
    return { user, tokens };
  }
}