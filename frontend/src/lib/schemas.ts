import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string(),
  categoryName: z.string().optional(),
  description: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionDtoSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  categoryId: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionDtoSchema>;

export const TransactionFiltersSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;
