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
  async get(): Promise<{ data: DashboardData }> {
    const res = await httpClient.get('/dashboard')
    const raw = res.data
    // ponytail: gateway aggregates from downstream services that each wrap in ApiResponse
    // so summary is {success, data: {totalIncome, ...}}, budgets is {success, data: [...]}
    const summaryData = raw.summary?.data ?? raw.summary
    return {
      data: {
        summary: {
          totalIncome: summaryData?.totalIncome ?? 0,
          totalExpense: summaryData?.totalExpense ?? 0,
          netAmount: summaryData?.net ?? 0,
        },
        budgetHealth: raw.budgets?.data ?? raw.budgets ?? [],
        recentTransactions: [],
      },
    }
  },
}
