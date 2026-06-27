// ponytail: command to log out — revokes the presented refresh token
export class LogoutCommand {
  constructor(public readonly refreshToken: string) {}
}