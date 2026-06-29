import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi, type DashboardData } from '@/api/dashboard.api'
import { transactionApi, type CategoryBreakdown, type MonthlyTrend } from '@/api/transaction.api'
import type { BudgetStatus } from '@/api/budget.api'
import type { Transaction } from '@/api/transaction.api'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardData['summary'] | null>(null)
  const budgetHealth = ref<BudgetStatus[]>([])
  const recentTransactions = ref<Transaction[]>([])
  const categoryBreakdown = ref<CategoryBreakdown[]>([])
  const monthlyTrend = ref<MonthlyTrend[]>([])
  const loading = ref(false)

  async function fetchCategoryBreakdown() {
    try {
      const now = new Date()
      const res = await transactionApi.getCategoryBreakdown(now.getFullYear(), now.getMonth() + 1)
      categoryBreakdown.value = res.data ?? []
    } catch {
      // Analytics endpoint may not be available yet
    }
  }

  async function fetchMonthlyTrend() {
    try {
      const res = await transactionApi.getMonthlyTrend(6)
      monthlyTrend.value = res.data ?? []
    } catch {
      // Analytics endpoint may not be available yet
    }
  }

  async function fetchDashboard() {
    loading.value = true
    try {
      const [dashRes] = await Promise.all([
        dashboardApi.get(),
        fetchCategoryBreakdown(),
        fetchMonthlyTrend(),
      ])
      summary.value = dashRes.data.summary
      budgetHealth.value = dashRes.data.budgetHealth
      recentTransactions.value = dashRes.data.recentTransactions
    } catch {
      // Dashboard may 503 if services aren't ready
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchDashboard()
  }

  return {
    summary, budgetHealth, recentTransactions, categoryBreakdown, monthlyTrend,
    loading, fetchDashboard, fetchCategoryBreakdown, fetchMonthlyTrend, refresh,
  }
})
