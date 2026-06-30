// ponytail: single source of truth for all shared types across frontend and backend

// ============ Transaction Types ============

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const
export type TransactionType = typeof TRANSACTION_TYPES[number]

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  categoryId: string
  categoryName?: string
  description: string
  date: string
  createdAt: string
  updatedAt?: string
  currency?: string
}

export interface CreateTransactionDto {
  amount: number
  type: TransactionType | Lowercase<TransactionType>  // backend normalizes
  categoryId: string
  description: string
  date: string
}

export interface TransactionFilters {
  page?: number
  limit?: number
  type?: TransactionType
  categoryId?: string
  startDate?: string
  endDate?: string
}

// ============ Category Types ============

export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon?: string
  color?: string
  createdAt?: string
}

export interface CreateCategoryDto {
  name: string
  type: CategoryType
  icon?: string
  color?: string
}

// ============ Budget Types ============

export interface BudgetStatus {
  budgetId: string
  categoryId: string
  monthlyLimit: number
  currency: string
  runningTotal: number
  usagePercentage: number
  isExceeded: boolean
}

export interface SetBudgetDto {
  categoryId: string
  monthlyLimit: number
  currency: string
  year: number
  month: number
}

export interface BudgetProjection {
  categoryId: string
  categoryName?: string
  projectedAmount: number
  budgetAmount: number
  overageDate?: string
}

// ============ Analytics Types ============

export interface CategoryBreakdown {
  categoryId: string
  total: number
  count: number
}

export interface MonthlyTrend {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
}

export interface PeriodStats {
  avgDailySpend: number
  largestExpense: { amount: number; description: string; categoryId: string } | null
  mostActiveDay: { dayOfWeek: number; count: number } | null
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { message: string; code?: string }
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}