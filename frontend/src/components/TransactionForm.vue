<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateTransactionDto } from '@/api/transaction.api'
import { X } from '@lucide/vue'

const emit = defineEmits<{ submit: [dto: CreateTransactionDto]; close: [] }>()
const props = defineProps<{ initial?: Partial<CreateTransactionDto> }>()

const categoryStore = useCategoryStore()
onMounted(() => { categoryStore.fetchAll() })

const form = ref<CreateTransactionDto>({
  amount: props.initial?.amount ?? 0,
  type: props.initial?.type ?? 'expense',
  categoryId: props.initial?.categoryId ?? '',
  description: props.initial?.description ?? '',
  date: props.initial?.date ?? new Date().toISOString().split('T')[0],
})

const loading = ref(false)
const errors = ref<string[]>([])

const categories = computed(() =>
  form.value.type === 'income' ? categoryStore.incomeCategories : categoryStore.expenseCategories
)

function validate(): boolean {
  errors.value = []
  if (form.value.amount <= 0) errors.value.push('Amount must be greater than 0')
  if (!form.value.categoryId) errors.value.push('Category is required')
  if (new Date(form.value.date) > new Date()) errors.value.push('Date cannot be in the future')
  return errors.value.length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  emit('submit', { ...form.value })
  loading.value = false
}
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-card rounded-3xl border border-border p-6 w-full max-w-[520px] shadow-xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-display text-xl font-bold text-foreground">
          {{ props.initial ? 'Edit Transaction' : 'New Transaction' }}
        </h2>
        <button
          class="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Type Toggle -->
      <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl mb-5">
        <button
          type="button"
          class="py-2.5 rounded-lg text-[13px] font-semibold transition-all"
          :class="form.type === 'expense' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
          @click="form.type = 'expense'"
        >💸 Expense</button>
        <button
          type="button"
          class="py-2.5 rounded-lg text-[13px] font-semibold transition-all"
          :class="form.type === 'income' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
          @click="form.type = 'income'"
        >💰 Income</button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length" class="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <p v-for="err in errors" :key="err">{{ err }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Amount (Hero Input) -->
        <div>
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            class="w-full rounded-xl border border-border bg-background px-4 py-4 text-center font-display text-[32px] font-bold tracking-tight outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
          <select
            v-model="form.categoryId"
            class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          >
            <option value="" disabled>Select category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
          <input
            v-model="form.description"
            type="text"
            placeholder="What was this for?"
            class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        <!-- Date -->
        <div>
          <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
          <input
            v-model="form.date"
            type="date"
            class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-3">
          <button
            type="button"
            class="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-[0_4px_12px_rgba(16,185,129,0.25)] disabled:opacity-50 transition-all"
          >
            {{ loading ? 'Saving...' : 'Save Transaction' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
