import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetApi, type BudgetStatus, type BudgetProjection, type SetBudgetDto } from '@/api/budget.api'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<BudgetStatus[]>([])
  const projections = ref<BudgetProjection[]>([])
  const loading = ref(false)

  const exceededBudgets = computed(() => budgets.value.filter((b) => b.percentage > 100))
  const warningBudgets = computed(() => budgets.value.filter((b) => b.percentage > 70 && b.percentage <= 100))

  async function fetchStatus(year?: number, month?: number) {
    loading.value = true
    const now = new Date()
    const y = year ?? now.getFullYear()
    const m = month ?? now.getMonth() + 1
    try {
      const res = await budgetApi.getStatus(y, m)
      budgets.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function setBudget(dto: SetBudgetDto) {
    loading.value = true
    try {
      await budgetApi.setBudget(dto)
      await fetchStatus(dto.year, dto.month)
    } finally {
      loading.value = false
    }
  }

  async function fetchProjections(year?: number, month?: number) {
    const now = new Date()
    const y = year ?? now.getFullYear()
    const m = month ?? now.getMonth() + 1
    try {
      const res = await budgetApi.getProjections(y, m)
      projections.value = res.data
    } catch {
      projections.value = []
    }
  }

  return { budgets, projections, loading, exceededBudgets, warningBudgets, fetchStatus, setBudget, fetchProjections }
})
