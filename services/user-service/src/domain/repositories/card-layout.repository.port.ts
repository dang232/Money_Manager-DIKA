// ponytail: CardLayout repository port
import { CardLayout } from '../aggregates/card-layout.aggregate';

export interface CardLayoutRepository {
  findByUserId(userId: string): Promise<CardLayout | null>;
  save(layout: CardLayout): Promise<CardLayout>;
}