import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetApi, type BudgetStatus, type BudgetProjection, type SetBudgetDto } from '@/api/budget.api'
import { useAsync } from '@/composables/use-async'
import { useSocket } from '@/composables/useSocket'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<BudgetStatus[]>([])
  const projections = ref<BudgetProjection[]>([])
  const { loading, error, run } = useAsync()
  const { on } = useSocket()

  const exceededBudgets = computed(() => budgets.value.filter((b) => b.usagePercentage > 100))
  const warningBudgets = computed(() => budgets.value.filter((b) => b.usagePercentage > 70 && b.usagePercentage <= 100))

  function currentYearMonth(year?: number, month?: number) {
    const now = new Date()
    return { y: year ?? now.getFullYear(), m: month ?? now.getMonth() + 1 }
  }

  async function fetchStatus(year?: number, month?: number) {
    const { y, m } = currentYearMonth(year, month)
    await run(async () => {
      const res = await budgetApi.getStatus(y, m)
      budgets.value = res.data
    })
  }

  async function setBudget(dto: SetBudgetDto) {
    await run(async () => {
      await budgetApi.setBudget(dto)
      const res = await budgetApi.getStatus(dto.year, dto.month)
      budgets.value = res.data
    })
  }

  async function fetchProjections(year?: number, month?: number) {
    const { y, m } = currentYearMonth(year, month)
    await run(async () => {
      try {
        const res = await budgetApi.getProjections(y, m)
        projections.value = res.data
      } catch {
        projections.value = []
      }
    })
  }

  function onBudgetUpdated() {
    // Re-fetch budget status for the current period
    fetchStatus()
  }

  // Subscribe to real-time budget events from the WebSocket
  on('budget.updated', () => onBudgetUpdated())

  return { budgets, projections, loading, error, exceededBudgets, warningBudgets, fetchStatus, setBudget, fetchProjections, onBudgetUpdated }
})