<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction.store'
import { useCategoryStore } from '@/stores/category.store'
import TransactionForm from '@/components/TransactionForm.vue'
import { formatVND, formatDate } from '@/lib/utils'
import type { CreateTransactionDto, TransactionFilters, Transaction } from '@/api/transaction.api'
import { Plus, TrendingUp, TrendingDown } from '@lucide/vue'

const route = useRoute()
const txStore = useTransactionStore()
const categoryStore = useCategoryStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingInitial = ref<Partial<CreateTransactionDto> | undefined>()
const activeFilter = ref<'all' | 'income' | 'expense'>('all')

const filters = ref<TransactionFilters>({
  type: undefined,
  categoryId: undefined,
})

onMounted(async () => {
  await Promise.all([txStore.fetchAll(), categoryStore.fetchAll()])
  if (route.query.add === '1') openCreate()
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

function setTypeFilter(type: 'all' | 'income' | 'expense') {
  activeFilter.value = type
  filters.value.type = type === 'all' ? undefined : type
  txStore.fetchAll(filters.value)
}

function clearFilters() {
  activeFilter.value = 'all'
  filters.value = { type: undefined, categoryId: undefined, startDate: undefined, endDate: undefined }
  txStore.fetchAll()
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Transactions</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ txStore.pagination.total }} transactions this month</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
        @click="openCreate"
      >
        <Plus :size="16" :stroke-width="2.5" />
        Add Transaction
      </button>
    </div>

    <!-- Chip Filters -->
    <div class="flex flex-wrap gap-2 items-center">
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all cursor-pointer"
        :class="activeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-foreground/20'"
        @click="setTypeFilter('all')"
      >All</button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all cursor-pointer"
        :class="activeFilter === 'income' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-foreground/20'"
        @click="setTypeFilter('income')"
      >
        <TrendingUp :size="14" />
        Income
      </button>
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-all cursor-pointer"
        :class="activeFilter === 'expense' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-foreground/20'"
        @click="setTypeFilter('expense')"
      >
        <TrendingDown :size="14" />
        Expenses
      </button>
      <div class="w-px h-6 bg-border"></div>
      <select
        v-model="filters.categoryId"
        class="px-3 py-1.5 rounded-full border border-border bg-card text-[13px] font-medium text-muted-foreground outline-none"
        @change="txStore.fetchAll(filters)"
      >
        <option :value="undefined">All categories</option>
        <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <button
        v-if="activeFilter !== 'all' || filters.categoryId"
        class="px-3 py-1.5 rounded-full border border-border bg-card text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <!-- Loading -->
    <div v-if="txStore.loading" class="text-center py-12 text-muted-foreground">Loading...</div>

    <!-- Transaction List -->
    <div v-else class="space-y-0">
      <div class="bg-card rounded-2xl border border-border overflow-hidden">
        <template v-for="[date, txs] in groupedTransactions" :key="date">
          <!-- Date Group Header -->
          <div class="px-5 py-3 bg-muted/50 border-b border-border">
            <p class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{{ formatDate(date) }}</p>
          </div>

          <!-- Transaction Rows -->
          <div
            v-for="tx in txs"
            :key="tx.id"
            class="grid grid-cols-[44px_1fr_auto_auto] gap-4 px-5 py-4 items-center border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer group"
            @click="openEdit(tx)"
          >
            <!-- Icon -->
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center text-lg"
              :class="tx.type === 'income' ? 'bg-income-bg' : 'bg-muted'"
            >
              {{ tx.type === 'income' ? '💰' : '💸' }}
            </div>

            <!-- Title + Meta -->
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground truncate">{{ tx.description || tx.categoryName || 'Transaction' }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-muted-foreground">{{ tx.categoryName }}</span>
              </div>
            </div>

            <!-- Amount -->
            <p
              class="font-display text-[15px] font-bold text-right"
              :class="tx.type === 'income' ? 'text-income' : 'text-foreground'"
            >
              {{ tx.type === 'income' ? '+' : '-' }}{{ formatVND(tx.amount) }}
            </p>

            <!-- Delete -->
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:text-destructive/80 transition-opacity px-2 py-1 rounded"
              @click.stop="handleDelete(tx.id)"
            >
              Delete
            </button>
          </div>
        </template>

        <p v-if="groupedTransactions.length === 0" class="text-sm text-muted-foreground text-center py-12">
          No transactions found
        </p>
      </div>
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
