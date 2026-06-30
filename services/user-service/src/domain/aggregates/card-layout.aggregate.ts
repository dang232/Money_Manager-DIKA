// ponytail: CardLayout aggregate — persisted card layout for dashboard
export interface CardLayoutData {
  categories: string[];
  budgets: string[];
}

export class CardLayout {
  constructor(
    public readonly userId: string,
    public layout: CardLayoutData,
    public version: number,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(userId: string): CardLayout {
    const now = new Date();
    return new CardLayout(userId, { categories: [], budgets: [] }, 1, now, now);
  }

  updateLayout(newLayout: CardLayoutData): void {
    this.layout = newLayout;
    this.version += 1;
    this.updatedAt = new Date();
  }
}