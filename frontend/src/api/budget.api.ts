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
  amount: number
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
    return httpClient.get<BudgetStatus[]>(`/budgets/status/${year}/${month}`)
  },
  setBudget(dto: SetBudgetDto) {
    return httpClient.post('/budgets', dto)
  },
  getProjections(year: number, month: number) {
    return httpClient.get<BudgetProjection[]>(`/budgets/projections/${year}/${month}`)
  },
}
