// ponytail: command to register a new user
export class RegisterCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName?: string,
  ) {}
}