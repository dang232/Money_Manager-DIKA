<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { formatVND, cn } from '@/lib/utils'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

const showSetBudget = ref(false)
const budgetForm = ref({ categoryId: '', amount: 0 })

onMounted(async () => {
  await Promise.all([budgetStore.fetchStatus(), budgetStore.fetchProjections(), categoryStore.fetchAll()])
})

function openSetBudget(categoryId?: string) {
  budgetForm.value = { categoryId: categoryId || '', amount: 0 }
  showSetBudget.value = true
}

async function handleSetBudget() {
  if (!budgetForm.value.categoryId || budgetForm.value.amount <= 0) return
  const now = new Date()
  await budgetStore.setBudget({
    categoryId: budgetForm.value.categoryId,
    amount: budgetForm.value.amount,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })
  showSetBudget.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">Budget</h1>
      <button
        class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        @click="openSetBudget()"
      >
        + Set Budget
      </button>
    </div>

    <div v-if="budgetStore.loading" class="text-center py-8 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Overview cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="b in budgetStore.budgets"
          :key="b.categoryId"
          class="rounded-xl border border-border bg-card p-5"
        >
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-sm font-medium text-foreground">{{ b.categoryName }}</h3>
            <button
              class="text-xs text-primary hover:text-primary/80"
              @click="openSetBudget(b.categoryId)"
            >
              Edit
            </button>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Spent</span>
              <span class="text-foreground font-medium">{{ formatVND(b.spentAmount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Budget</span>
              <span class="text-foreground font-medium">{{ formatVND(b.budgetAmount) }}</span>
            </div>
            <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                :class="cn('h-full rounded-full', b.percentage > 100 ? 'bg-red-500' : b.percentage > 70 ? 'bg-yellow-500' : 'bg-green-500')"
                :style="{ width: `${Math.min(b.percentage, 100)}%` }"
              />
            </div>
            <p
              v-if="b.projectedOverageDate"
              class="text-xs text-yellow-600 dark:text-yellow-400"
            >
              Projected to exceed by {{ b.projectedOverageDate }}
            </p>
          </div>
        </div>
      </div>

      <p v-if="budgetStore.budgets.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No budgets configured. Set a budget to start tracking spending.
      </p>
    </template>

    <!-- Set Budget Dialog -->
    <div v-if="showSetBudget" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showSetBudget = false">
      <div class="bg-card rounded-xl border border-border p-6 w-full max-w-sm shadow-lg">
        <h2 class="text-lg font-semibold text-foreground mb-4">Set Budget</h2>
        <form class="space-y-4" @submit.prevent="handleSetBudget">
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Category</label>
            <select
              v-model="budgetForm.categoryId"
              class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>Select category</option>
              <option v-for="cat in categoryStore.expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-muted-foreground mb-1 block">Amount (VND)</label>
            <input
              v-model.number="budgetForm.amount"
              type="number"
              min="0"
              step="10000"
              class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" class="flex-1 py-2 rounded-lg border border-border text-sm" @click="showSetBudget = false">Cancel</button>
            <button type="submit" class="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
