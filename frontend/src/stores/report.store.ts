import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionApi, type MonthlyTrend, type PeriodStats } from '@/api/transaction.api'

export const useReportStore = defineStore('report', () => {
  const trend = ref<MonthlyTrend[]>([])
  const stats = ref<PeriodStats | null>(null)
  const pendingCount = ref(0)
  const loading = computed(() => pendingCount.value > 0)
  const activePeriod = ref('Month')

  async function fetchTrend(months: number, signal?: AbortSignal) {
    pendingCount.value++
    try {
      const res = await transactionApi.getMonthlyTrend(months, signal)
      trend.value = res.data
    } catch {
      // Analytics endpoint may not be available yet
    } finally {
      pendingCount.value--
    }
  }

  async function fetchStats(dateFrom: string, dateTo: string, signal?: AbortSignal) {
    pendingCount.value++
    try {
      const res = await transactionApi.getStats(dateFrom, dateTo, signal)
      stats.value = res.data
    } catch {
      // Analytics endpoint may not be available yet
    } finally {
      pendingCount.value--
    }
  }

  return { trend, stats, loading, activePeriod, fetchTrend, fetchStats }
})
