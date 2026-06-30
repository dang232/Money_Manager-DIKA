import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionApi, type Transaction, type CreateTransactionDto, type TransactionFilters } from '@/api/transaction.api'
import { TransactionSchema } from '@/lib/schemas'
import { useSocket } from '@/composables/useSocket'
import { useMutateRefresh } from '@/composables/useMutateRefresh'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const pagination = ref({ page: 1, limit: 20, total: 0 })
  const { on } = useSocket()
  const { loading, error, mutate } = useMutateRefresh(fetchAll)
  // ponytail: flag to prevent duplicate adds from WebSocket when we just created via API
  const _recentlyCreated = ref<string | null>(null)

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
      transactions.value = []
    }
  }

  // Normalize type to uppercase for backend (backend expects EXPENSE not expense)
  // ponytail: set flag to prevent WebSocket from adding duplicate after fetchAll completes
  const create = (dto: CreateTransactionDto) => {
    _recentlyCreated.value = null
    return mutate(async () => {
      const result = await transactionApi.create({ ...dto, type: dto.type.toUpperCase() as CreateTransactionDto['type'] })
      _recentlyCreated.value = result.data?.id ?? null
      return result
    })
  }
  const update = (id: string, dto: Partial<CreateTransactionDto>) => mutate(() =>
    transactionApi.update(id, dto.type ? { ...dto, type: dto.type.toUpperCase() as CreateTransactionDto['type'] } : dto)
  )
  const remove = (id: string) => mutate(() => transactionApi.delete(id))

  function onTransactionCreated(data: Transaction) {
    // ponytail: skip if we just created this (prevents duplicate from race with fetchAll)
    if (_recentlyCreated.value === data.id) {
      _recentlyCreated.value = null
      return
    }
    // ponytail: deduplicate by id to handle repeated broadcasts
    if (!transactions.value.find((t: Transaction) => t.id === data.id)) {
      transactions.value.unshift(data)
      pagination.value.total += 1
    }
  }

  // Subscribe to real-time transaction events from the WebSocket
  on('transaction.created', (data) => onTransactionCreated(data as Transaction))

  return { transactions, loading, error, pagination, byDate, byCategory, fetchAll, create, update, remove, onTransactionCreated }
})