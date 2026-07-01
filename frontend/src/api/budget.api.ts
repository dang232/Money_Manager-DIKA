import httpClient from './http-client'

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

export const budgetApi = {
  getStatus(year: number, month: number) {
    return httpClient.get<BudgetStatus[]>(`/budgets`, { params: { year, month } })
  },
  setBudget(dto: SetBudgetDto) {
    return httpClient.post('/budgets', dto)
  },
  deleteBudget(categoryId: string, year: number, month: number) {
    return httpClient.delete('/budgets', { params: { categoryId, year, month } })
  },
  getProjections(year: number, month: number) {
    return httpClient.get<BudgetProjection[]>(`/budgets/projections`, { params: { year, month } })
  },
}
