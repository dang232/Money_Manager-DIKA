import httpClient from './http-client'

export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  categoryName?: string
  description: string
  date: string
  createdAt: string
}

export interface CreateTransactionDto {
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  description: string
  date: string
}

export interface TransactionFilters {
  page?: number
  limit?: number
  type?: 'income' | 'expense'
  categoryId?: string
  startDate?: string
  endDate?: string
}

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

export const transactionApi = {
  getAll(params?: TransactionFilters) {
    return httpClient.get<{ data: Transaction[]; total: number }>('/transactions', { params })
  },
  getById(id: string) {
    return httpClient.get<Transaction>(`/transactions/${id}`)
  },
  create(dto: CreateTransactionDto) {
    return httpClient.post<Transaction>('/transactions', dto)
  },
  update(id: string, dto: Partial<CreateTransactionDto>) {
    return httpClient.put<Transaction>(`/transactions/${id}`, dto)
  },
  delete(id: string) {
    return httpClient.delete(`/transactions/${id}`)
  },
  getMonthlySummary(year: number, month: number) {
    return httpClient.get(`/transactions/summary`, { params: { year, month } })
  },
  getCategoryBreakdown(year: number, month: number) {
    return httpClient.get<CategoryBreakdown[]>('/transactions/category-breakdown', { params: { year, month } })
  },
  getMonthlyTrend(months: number, signal?: AbortSignal) {
    return httpClient.get<MonthlyTrend[]>('/transactions/monthly-trend', { params: { months }, signal })
  },
  getStats(dateFrom: string, dateTo: string, signal?: AbortSignal) {
    return httpClient.get<PeriodStats>('/transactions/stats', { params: { dateFrom, dateTo }, signal })
  },
}
