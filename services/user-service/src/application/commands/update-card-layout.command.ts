// ponytail: command to update user's card layout
import { CardLayoutData } from '../../domain/aggregates/card-layout.aggregate';

export class UpdateCardLayoutCommand {
  constructor(
    public readonly userId: string,
    public readonly layout: CardLayoutData,
    public readonly clientVersion: number,
    public readonly clientTimestamp: number,
  ) {}
}