import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionApi, type Transaction, type CreateTransactionDto, type TransactionFilters } from '@/api/transaction.api'
import { TransactionSchema } from '@/lib/schemas'
import { useAsync } from '@/composables/use-async'
import { useSocket } from '@/composables/useSocket'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const pagination = ref({ page: 1, limit: 20, total: 0 })
  const { loading, error, run } = useAsync()
  const { on } = useSocket()

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
      // ponytail: interceptor unwraps ApiResponse — res.data is either the array or {data, total}
      const payload = res.data
      if (Array.isArray(payload)) {
        transactions.value = payload as Transaction[]
        pagination.value.total = payload.length
      } else if (payload && typeof payload === 'object' && 'data' in payload) {
        const p = payload as { data?: Transaction[]; total?: number }
        transactions.value = p.data ?? []
        pagination.value.total = p.total ?? 0
      } else {
        transactions.value = []
        pagination.value.total = 0
      }

      // Validate with Zod
      const parsed = TransactionSchema.array().safeParse(transactions.value)
      if (!parsed.success) {
        console.warn('Invalid transaction data:', parsed.error)
        transactions.value = []
      }
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

  function onTransactionCreated(data: Transaction) {
    transactions.value.unshift(data)
    pagination.value.total += 1
  }

  // Subscribe to real-time transaction events from the WebSocket
  on('transaction.created', (data) => onTransactionCreated(data as Transaction))

  return { transactions, loading, error, pagination, byDate, byCategory, fetchAll, create, update, remove, onTransactionCreated }
})