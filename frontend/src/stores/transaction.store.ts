import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionApi, type Transaction, type CreateTransactionDto, type TransactionFilters } from '@/api/transaction.api'
import { useAsync } from '@/composables/use-async'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const pagination = ref({ page: 1, limit: 20, total: 0 })
  const { loading, error, run } = useAsync()

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
    await run(async () => {
      const res = await transactionApi.getAll({
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters,
      })
      transactions.value = res.data.data
      pagination.value.total = res.data.total
    })
  }

  async function mutateAndRefresh<T>(op: () => Promise<T>) {
    await run(async () => {
      await op()
      await fetchAll()
    })
  }

  const create = (dto: CreateTransactionDto) => mutateAndRefresh(() => transactionApi.create(dto))
  const update = (id: string, dto: Partial<CreateTransactionDto>) => mutateAndRefresh(() => transactionApi.update(id, dto))
  const remove = (id: string) => mutateAndRefresh(() => transactionApi.delete(id))

  return { transactions, loading, error, pagination, byDate, byCategory, fetchAll, create, update, remove }
})