// ponytail: shared token-issuance helper for register + login + refresh handlers
import { Injectable, Inject } from '@nestjs/common';
import { DomainException, AUTH_REFRESH_INVALID } from '@money-manager/shared-kernel';
import { User } from '../domain/aggregates/user.aggregate';
import { RefreshToken } from '../domain/aggregates/refresh-token.aggregate';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../domain/repositories/refresh-token.repository.port';
import { UserRepository, USER_REPOSITORY } from '../domain/repositories/user.repository.port';
import { TokenService, TOKEN_SERVICE } from '../domain/services/token-service.port';

export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface IssuedTokenPair {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class TokenIssuer {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshRepo: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async issueFor(user: User): Promise<IssuedTokenPair> {
    const access = this.tokenService.issue({ sub: user.id, email: user.email.value });
    const { token, plaintext } = RefreshToken.create({
      userId: user.id,
      ttlSeconds: REFRESH_TTL_SECONDS,
    });
    await this.refreshRepo.save(token);

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: plaintext,
      refreshTokenExpiresAt: token.expiresAt,
    };
  }

  async rotate(refreshPlaintext: string): Promise<IssuedTokenPair> {
    const existing = await this.refreshRepo.findByPlaintext(refreshPlaintext);
    if (!existing || !existing.isUsable()) {
      throw DomainException.fromError(AUTH_REFRESH_INVALID);
    }
    const user = await this.userRepo.findById(existing.userId);
    if (!user) {
      throw DomainException.fromError(AUTH_REFRESH_INVALID);
    }

    existing.revoke();
    await this.refreshRepo.save(existing);

    return this.issueFor(user);
  }
}