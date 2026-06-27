// ponytail: handler for LogoutCommand — revokes the presented refresh token
import { Injectable, Inject } from '@nestjs/common';
import { LogoutCommand } from '../commands/logout.command';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY } from '../../domain/repositories/refresh-token.repository.port';

@Injectable()
export class LogoutHandler {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshRepo: RefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const existing = await this.refreshRepo.findByPlaintext(command.refreshToken);
    if (!existing) return;
    existing.revoke();
    await this.refreshRepo.save(existing);
  }
}