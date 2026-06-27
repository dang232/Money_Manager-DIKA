// ponytail: command to update user profile fields
export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly displayName?: string | null,
    public readonly avatarUrl?: string | null,
    public readonly locale?: string,
    public readonly timezone?: string,
    public readonly defaultCurrency?: string,
    public readonly budgetAnchorDay?: number,
  ) {}
}