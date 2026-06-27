// ponytail: command to rotate a refresh token
export class RefreshTokenCommand {
  constructor(public readonly refreshToken: string) {}
}