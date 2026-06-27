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
}
