<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction.store'
import { useCategoryStore } from '@/stores/category.store'
import TransactionForm from '@/components/TransactionForm.vue'
import { Button } from '@/components/ui/button'
import { formatVND, formatDate } from '@/lib/utils'
import type { CreateTransactionDto, TransactionFilters, Transaction } from '@/api/transaction.api'
import { Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Trash2 } from '@lucide/vue'

const route = useRoute()
const txStore = useTransactionStore()
const categoryStore = useCategoryStore()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const editingInitial = ref<Partial<CreateTransactionDto> | undefined>()
const activeFilter = ref<'all' | 'INCOME' | 'EXPENSE'>('all')

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

function setTypeFilter(type: 'all' | 'INCOME' | 'EXPENSE') {
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
      <Button @click="openCreate">
        <Plus :size="16" :stroke-width="2.5" />
        Add Transaction
      </Button>
    </div>

    <!-- Chip Filters -->
    <div class="flex flex-wrap gap-2 items-center">
      <Button
        variant="outline"
        size="sm"
        :class="activeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''"
        @click="setTypeFilter('all')"
      >All</Button>
      <Button
        variant="outline"
        size="sm"
        :class="activeFilter === 'INCOME' ? 'bg-primary text-primary-foreground border-primary' : ''"
        @click="setTypeFilter('INCOME')"
      >
        <TrendingUp :size="14" />
        Income
      </Button>
      <Button
        variant="outline"
        size="sm"
        :class="activeFilter === 'EXPENSE' ? 'bg-primary text-primary-foreground border-primary' : ''"
        @click="setTypeFilter('EXPENSE')"
      >
        <TrendingDown :size="14" />
        Expenses
      </Button>
      <div class="w-px h-6 bg-border"></div>
      <select
        v-model="filters.categoryId"
        class="h-9 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @change="txStore.fetchAll(filters)"
      >
        <option :value="undefined">All categories</option>
        <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <Button
        v-if="activeFilter !== 'all' || filters.categoryId"
        variant="ghost"
        size="sm"
        @click="clearFilters"
      >
        Clear
      </Button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="txStore.loading" class="bg-card rounded-2xl border border-border overflow-hidden">
      <div v-for="i in 6" :key="i" class="grid grid-cols-[44px_1fr_auto] gap-4 px-5 py-4 items-center border-b border-border/50 last:border-b-0">
        <div class="w-11 h-11 rounded-xl skeleton" />
        <div class="space-y-2">
          <div class="h-4 w-32 skeleton" />
          <div class="h-3 w-20 skeleton" />
        </div>
        <div class="h-5 w-24 skeleton" />
      </div>
    </div>

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
              class="w-11 h-11 rounded-xl flex items-center justify-center"
              :class="tx.type === 'INCOME' ? 'bg-income/10' : 'bg-muted'"
            >
              <ArrowUpRight v-if="tx.type === 'INCOME'" :size="20" class="text-income" />
              <ArrowDownRight v-else :size="20" class="text-expense" />
            </div>

            <!-- Title + Meta -->
            <div class="min-w-0">
              <p class="text-sm font-semibold text-foreground truncate">{{ tx.description || tx.categoryName || 'Transaction' }}</p>
              <span class="text-xs text-muted-foreground">{{ tx.categoryName }}</span>
            </div>

            <!-- Amount -->
            <p
              class="font-display text-[15px] font-bold text-right"
              :class="tx.type === 'INCOME' ? 'text-income' : 'text-foreground'"
            >
              {{ tx.type === 'INCOME' ? '+' : '-' }}{{ formatVND(tx.amount) }}
            </p>

            <!-- Delete -->
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-destructive hover:text-destructive"
              @click.stop="handleDelete(tx.id)"
            >
              <Trash2 :size="14" />
              <span class="sr-only">Delete</span>
            </Button>
          </div>
        </template>

        <p v-if="groupedTransactions.length === 0" class="text-sm text-muted-foreground text-center py-12">
          No transactions found
        </p>
      </div>
    </div>

    <!-- Form Dialog -->
    <TransactionForm
      :open="showForm"
      :initial="editingInitial"
      @submit="handleSubmit"
      @close="showForm = false"
    />
  </div>
</template>
