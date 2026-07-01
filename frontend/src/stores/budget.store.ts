import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { budgetApi, type BudgetStatus, type BudgetProjection, type SetBudgetDto } from '@/api/budget.api'
import { useAsync } from '@/composables/use-async'
import { useSocket } from '@/composables/useSocket'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<BudgetStatus[]>([])
  const projections = ref<BudgetProjection[]>([])
  const { loading, error, run } = useAsync()
  const { connected, on } = useSocket()

  const exceededBudgets = computed(() => budgets.value.filter((b: BudgetStatus) => b.usagePercentage > 100))
  const warningBudgets = computed(() => budgets.value.filter((b: BudgetStatus) => b.usagePercentage > 70 && b.usagePercentage <= 100))

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

  async function deleteBudget(categoryId: string, year?: number, month?: number) {
    const { y, m } = currentYearMonth(year, month)
    await run(async () => {
      await budgetApi.deleteBudget(categoryId, y, m)
      budgets.value = budgets.value.filter(b => b.categoryId !== categoryId)
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

  function onBudgetUpdated(event?: { period?: string; budgetId?: string; userId?: string; runningTotal?: number }) {
    // Extract period from event or use current period
    let year: number, month: number

    if (event?.period) {
      // Parse "2026-07" format from BudgetUpdatedEvent
      const [y, m] = event.period.split('-').map(Number)
      year = y
      month = m
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth() + 1
    }

    fetchStatus(year, month)
  }

  // ponytail: subscribe to budget.updated when socket connects (null-safe via connected ref)
  watch(connected, (isConnected) => {
    if (isConnected) {
      on('budget.updated', (data) => onBudgetUpdated(data as { period?: string }))
    }
  })

  return { budgets, projections, loading, error, exceededBudgets, warningBudgets, fetchStatus, setBudget, deleteBudget, fetchProjections, onBudgetUpdated }
})