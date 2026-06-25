import httpClient from './http-client'
import type { BudgetStatus } from './budget.api'
import type { Transaction } from './transaction.api'

export interface DashboardData {
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
  }
  budgetHealth: BudgetStatus[]
  recentTransactions: Transaction[]
}

export const dashboardApi = {
  get() {
    return httpClient.get<DashboardData>('/dashboard')
  },
}
