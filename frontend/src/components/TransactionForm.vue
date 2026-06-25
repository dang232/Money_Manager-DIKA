<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateTransactionDto } from '@/api/transaction.api'

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

const categories = props.initial?.type === 'income' || form.value.type === 'income'
  ? categoryStore.incomeCategories
  : categoryStore.expenseCategories
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
    <div class="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-lg">
      <h2 class="text-lg font-semibold text-foreground mb-4">
        {{ props.initial ? 'Edit Transaction' : 'New Transaction' }}
      </h2>

      <!-- Errors -->
      <div v-if="errors.length" class="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
        <p v-for="err in errors" :key="err">{{ err }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Type -->
        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'"
            @click="form.type = 'expense'"
          >
            Expense
          </button>
          <button
            type="button"
            class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="form.type === 'income' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'"
            @click="form.type = 'income'"
          >
            Income
          </button>
        </div>

        <!-- Amount -->
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Amount (VND)</label>
          <input
            v-model.number="form.amount"
            type="number"
            min="0"
            step="1000"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Category</label>
          <select
            v-model="form.categoryId"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="" disabled>Select category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Description</label>
          <input
            v-model="form.description"
            type="text"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- Date -->
        <div>
          <label class="text-sm text-muted-foreground mb-1 block">Date</label>
          <input
            v-model="form.date"
            type="date"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button
            type="button"
            class="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
