// ponytail: handler for RefreshTokenCommand — delegates rotation to TokenIssuer
import { Injectable } from '@nestjs/common';
import { RefreshTokenCommand } from '../commands/refresh-token.command';
import { TokenIssuer, IssuedTokenPair } from '../token-issuer';

@Injectable()
export class RefreshTokenHandler {
  constructor(private readonly issuer: TokenIssuer) {}

  execute(command: RefreshTokenCommand): Promise<IssuedTokenPair> {
    return this.issuer.rotate(command.refreshToken);
  }
}