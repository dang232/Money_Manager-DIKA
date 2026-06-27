// ponytail: command to log in with email + password
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}