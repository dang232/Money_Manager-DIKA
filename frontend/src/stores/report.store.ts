import { defineStore } from 'pinia'
import { ref } from 'vue'
import { transactionApi, type MonthlyTrend, type PeriodStats } from '@/api/transaction.api'

export const useReportStore = defineStore('report', () => {
  const trend = ref<MonthlyTrend[]>([])
  const stats = ref<PeriodStats | null>(null)
  const loading = ref(false)
  const activePeriod = ref('Month')

  async function fetchTrend(months: number) {
    loading.value = true
    try {
      const res = await transactionApi.getMonthlyTrend(months)
      trend.value = res.data
    } catch {
      // Analytics endpoint may not be available yet
    } finally {
      loading.value = false
    }
  }

  async function fetchStats(dateFrom: string, dateTo: string) {
    loading.value = true
    try {
      const res = await transactionApi.getStats(dateFrom, dateTo)
      stats.value = res.data
    } catch {
      // Analytics endpoint may not be available yet
    } finally {
      loading.value = false
    }
  }

  return { trend, stats, loading, activePeriod, fetchTrend, fetchStats }
})
