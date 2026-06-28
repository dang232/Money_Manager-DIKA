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
  largestExpense: { amount: number; description: string; categoryId: string }
  mostActiveDay: { dayOfWeek: string; count: number }
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
    return httpClient.get<CategoryBreakdown[]>('/transactions/analytics/category-breakdown', { params: { year, month } })
  },
  getMonthlyTrend(months: number) {
    return httpClient.get<MonthlyTrend[]>('/transactions/analytics/monthly-trend', { params: { months } })
  },
  getStats(dateFrom: string, dateTo: string) {
    return httpClient.get<PeriodStats>('/transactions/analytics/stats', { params: { dateFrom, dateTo } })
  },
}
