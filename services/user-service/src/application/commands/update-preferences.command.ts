// ponytail: command to update notification preferences
export class UpdatePreferencesCommand {
  constructor(
    public readonly userId: string,
    public readonly prefs: Record<string, unknown>,
  ) {}
}