<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import type { CreateTransactionDto } from '@/api/transaction.api'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emit = defineEmits<{ submit: [dto: CreateTransactionDto]; close: [] }>()
const props = defineProps<{ initial?: Partial<CreateTransactionDto>; open?: boolean }>()

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
  <Dialog :open="props.open" @update:open="(val: boolean) => { if (!val) emit('close') }">
    <div class="space-y-5">
      <DialogTitle class="font-display text-xl font-bold text-foreground">
        {{ props.initial ? 'Edit Transaction' : 'New Transaction' }}
      </DialogTitle>

      <!-- Type Toggle -->
      <div class="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
        <Button
          variant="ghost"
          size="sm"
          :class="form.type === 'expense' ? 'bg-card text-expense shadow-sm' : 'text-muted-foreground'"
          @click="form.type = 'expense'"
        >
          Expense
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="form.type === 'income' ? 'bg-card text-income shadow-sm' : 'text-muted-foreground'"
          @click="form.type = 'income'"
        >
          Income
        </Button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length" role="alert" class="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <p v-for="err in errors" :key="err">{{ err }}</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Amount -->
        <div class="space-y-1.5">
          <Label for="tx-amount">Amount</Label>
          <Input
            id="tx-amount"
            :model-value="form.amount"
            type="number"
            placeholder="0"
            class="text-center font-display text-[28px] font-bold h-14"
            @update:model-value="form.amount = Number($event)"
          />
        </div>

        <!-- Category -->
        <div class="space-y-1.5">
          <Label for="tx-category">Category</Label>
          <select
            id="tx-category"
            v-model="form.categoryId"
            class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
          >
            <option value="" disabled>Select category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <!-- Description -->
        <div class="space-y-1.5">
          <Label for="tx-desc">Description</Label>
          <Input id="tx-desc" v-model="form.description" placeholder="What was this for?" />
        </div>

        <!-- Date -->
        <div class="space-y-1.5">
          <Label for="tx-date">Date</Label>
          <Input id="tx-date" v-model="form.date" type="date" />
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-3">
          <Button type="button" variant="outline" class="flex-1" @click="emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="loading" class="flex-1">
            {{ loading ? 'Saving...' : 'Save Transaction' }}
          </Button>
        </div>
      </form>
    </div>
  </Dialog>
</template>
