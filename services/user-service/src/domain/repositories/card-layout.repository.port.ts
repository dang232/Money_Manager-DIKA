// ponytail: CardLayout repository port
import { CardLayout } from '../aggregates/card-layout.aggregate';

export const CARD_LAYOUT_REPOSITORY = 'CARD_LAYOUT_REPOSITORY';

export interface CardLayoutRepository {
  findByUserId(userId: string): Promise<CardLayout | null>;
  save(layout: CardLayout): Promise<CardLayout>;
}