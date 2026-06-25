import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionApi, type Transaction, type CreateTransactionDto, type TransactionFilters } from '@/api/transaction.api'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({ page: 1, limit: 20, total: 0 })

  const byDate = computed(() => {
    const grouped: Record<string, Transaction[]> = {}
    for (const t of transactions.value) {
      const date = t.date.split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(t)
    }
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  })

  const byCategory = computed(() => {
    const grouped: Record<string, Transaction[]> = {}
    for (const t of transactions.value) {
      const key = t.categoryName || t.categoryId
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(t)
    }
    return grouped
  })

  async function fetchAll(filters?: TransactionFilters) {
    loading.value = true
    error.value = null
    try {
      const res = await transactionApi.getAll({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters,
      })
      transactions.value = res.data.data
      pagination.value.total = res.data.total
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch transactions'
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateTransactionDto) {
    loading.value = true
    try {
      await transactionApi.create(dto)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, dto: Partial<CreateTransactionDto>) {
    loading.value = true
    try {
      await transactionApi.update(id, dto)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    loading.value = true
    try {
      await transactionApi.delete(id)
      await fetchAll()
    } finally {
      loading.value = false
    }
  }

  return { transactions, loading, error, pagination, byDate, byCategory, fetchAll, create, update, remove }
})
