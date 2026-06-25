import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi, type DashboardData } from '@/api/dashboard.api'
import type { BudgetStatus } from '@/api/budget.api'
import type { Transaction } from '@/api/transaction.api'

export const useDashboardStore = defineStore('dashboard', () => {
  const summary = ref<DashboardData['summary'] | null>(null)
  const budgetHealth = ref<BudgetStatus[]>([])
  const recentTransactions = ref<Transaction[]>([])
  const loading = ref(false)

  async function fetchDashboard() {
    loading.value = true
    try {
      const res = await dashboardApi.get()
      summary.value = res.data.summary
      budgetHealth.value = res.data.budgetHealth
      recentTransactions.value = res.data.recentTransactions
    } catch {
      // Dashboard may 503 if services aren't ready
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await fetchDashboard()
  }

  return { summary, budgetHealth, recentTransactions, loading, fetchDashboard, refresh }
})
