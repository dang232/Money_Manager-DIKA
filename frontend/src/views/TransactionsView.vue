<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useCategoryStore } from '@/stores/category.store'
import TransactionForm from '@/components/TransactionForm.vue'
import { formatVND, formatDate } from '@/lib/utils'
import type { CreateTransactionDto, TransactionFilters, Transaction } from '@/api/transaction.api'

const txStore = useTransactionStore()
const categoryStore = useCategoryStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingInitial = ref<Partial<CreateTransactionDto> | undefined>()

const filters = ref<TransactionFilters>({
  type: undefined,
  categoryId: undefined,
  startDate: undefined,
  endDate: undefined,
})

onMounted(async () => {
  await Promise.all([txStore.fetchAll(), categoryStore.fetchAll()])
})

const groupedTransactions = computed(() => txStore.byDate)

function openCreate() {
  editingId.value = null
  editingInitial.value = undefined
  showForm.value = true
}

function openEdit(tx: Transaction) {
  editingId.value = tx.id
  editingInitial.value = { amount: tx.amount, type: tx.type, categoryId: tx.categoryId, description: tx.description, date: tx.date.split('T')[0] }
  showForm.value = true
}

async function handleSubmit(dto: CreateTransactionDto) {
  if (editingId.value) {
    await txStore.update(editingId.value, dto)
  } else {
    await txStore.create(dto)
  }
  showForm.value = false
}

async function handleDelete(id: string) {
  await txStore.remove(id)
}

async function applyFilters() {
  await txStore.fetchAll(filters.value)
}

function clearFilters() {
  filters.value = { type: undefined, categoryId: undefined, startDate: undefined, endDate: undefined }
  txStore.fetchAll()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">Transactions</h1>
      <button
        class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        @click="openCreate"
      >
        + Add
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-end">
      <select
        v-model="filters.type"
        class="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        @change="applyFilters"
      >
        <option :value="undefined">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <select
        v-model="filters.categoryId"
        class="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        @change="applyFilters"
      >
        <option :value="undefined">All categories</option>
        <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <input
        v-model="filters.startDate"
        type="date"
        class="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        @change="applyFilters"
      />
      <input
        v-model="filters.endDate"
        type="date"
        class="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        @change="applyFilters"
      />
      <button class="text-sm text-muted-foreground hover:text-foreground" @click="clearFilters">Clear</button>
    </div>

    <!-- Loading -->
    <div v-if="txStore.loading" class="text-center py-8 text-muted-foreground">Loading...</div>

    <!-- Transaction list grouped by date -->
    <div v-else class="space-y-4">
      <div v-for="[date, txs] in groupedTransactions" :key="date">
        <p class="text-xs font-medium text-muted-foreground uppercase mb-2">{{ formatDate(date) }}</p>
        <div class="rounded-xl border border-border bg-card divide-y divide-border">
          <div
            v-for="tx in txs"
            :key="tx.id"
            class="flex items-center justify-between p-4 group"
          >
            <div class="flex-1 cursor-pointer" @click="openEdit(tx)">
              <p class="text-sm font-medium text-foreground">{{ tx.description || tx.categoryName || 'Transaction' }}</p>
              <p class="text-xs text-muted-foreground">{{ tx.categoryName }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="text-sm font-semibold"
                :class="tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ tx.type === 'income' ? '+' : '-' }}{{ formatVND(tx.amount) }}
              </span>
              <button
                class="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-opacity"
                @click.stop="handleDelete(tx.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-if="groupedTransactions.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No transactions found
      </p>
    </div>

    <!-- Form Dialog -->
    <TransactionForm
      v-if="showForm"
      :initial="editingInitial"
      @submit="handleSubmit"
      @close="showForm = false"
    />
  </div>
</template>
