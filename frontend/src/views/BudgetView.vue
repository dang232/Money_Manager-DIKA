<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { formatVND } from '@/lib/utils'
import { Plus, X } from '@lucide/vue'

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
    monthlyLimit: budgetForm.value.amount,
    currency: 'USD',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })
  showSetBudget.value = false
}

function getBarGradient(pct: number) {
  if (pct > 100) return 'background: linear-gradient(90deg, #ef4444, #f87171)'
  if (pct > 70) return 'background: linear-gradient(90deg, #f59e0b, #fb923c)'
  return 'background: linear-gradient(90deg, #10b981, #34d399)'
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Monthly Budgets</h1>
        <p class="text-sm text-muted-foreground mt-1">June 2026 · {{ budgetStore.budgets.length }} active budgets</p>
      </div>
      <button
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
        @click="openSetBudget()"
      >
        <Plus :size="16" :stroke-width="2.5" />
        New Budget
      </button>
    </div>

    <div v-if="budgetStore.loading" class="text-center py-12 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Budget Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="b in budgetStore.budgets"
          :key="b.categoryId"
          class="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl">
              💰
            </div>
            <div class="flex-1">
              <h3 class="font-display font-bold text-[15px] text-foreground">{{ b.categoryId }}</h3>
              <p class="text-xs text-muted-foreground">Resets next month</p>
            </div>
            <button
              class="text-xs text-primary hover:text-primary/80 font-medium"
              @click="openSetBudget(b.categoryId)"
            >
              Edit
            </button>
          </div>

          <!-- Progress Bar -->
          <div class="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div
              class="h-full rounded-full transition-all duration-500"
              :style="`width: ${Math.min(b.usagePercentage, 100)}%; ${getBarGradient(b.usagePercentage)}`"
            />
          </div>

          <!-- Meta -->
          <div class="flex justify-between text-[13px] text-muted-foreground mb-3">
            <span>Spent <strong class="text-foreground">{{ formatVND(b.runningTotal) }}</strong></span>
            <span>of <strong class="text-foreground">{{ formatVND(b.monthlyLimit) }}</strong></span>
          </div>

          <!-- Status Badge -->
          <span
            class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            :class="
              b.usagePercentage > 100 ? 'bg-expense-bg text-expense' :
              b.usagePercentage > 70 ? 'bg-warning-bg text-warning' :
              'bg-income-bg text-primary'
            "
          >
            {{ b.usagePercentage > 100 ? `⚠ Over by ${formatVND(b.runningTotal - b.monthlyLimit)}` :
               b.usagePercentage > 70 ? `⚠ ${b.usagePercentage}% used` :
               '✓ On track' }}
          </span>
        </div>

        <!-- Create New Card -->
        <div
          class="border-2 border-dashed border-border rounded-2xl bg-transparent flex items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all"
          @click="openSetBudget()"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Plus :size="24" class="text-muted-foreground" />
            </div>
            <p class="font-semibold text-foreground text-sm">Create new budget</p>
            <p class="text-xs mt-1">Set a spending limit by category</p>
          </div>
        </div>
      </div>

      <p v-if="budgetStore.budgets.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No budgets configured. Set a budget to start tracking spending.
      </p>
    </template>

    <!-- Set Budget Dialog -->
    <div v-if="showSetBudget" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="showSetBudget = false">
      <div class="bg-card rounded-3xl border border-border p-6 w-full max-w-md shadow-xl animate-in fade-in slide-in-from-bottom-4">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-display text-xl font-bold text-foreground">Set Budget</h2>
          <button class="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" @click="showSetBudget = false">
            <X :size="20" />
          </button>
        </div>
        <form class="space-y-4" @submit.prevent="handleSetBudget">
          <div>
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
            <select
              v-model="budgetForm.categoryId"
              class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            >
              <option value="" disabled>Select category</option>
              <option v-for="cat in categoryStore.expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount (VND)</label>
            <input
              v-model.number="budgetForm.amount"
              type="number"
              min="0"
              step="10000"
              class="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <div class="flex gap-3 pt-3">
            <button type="button" class="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors" @click="showSetBudget = false">Cancel</button>
            <button type="submit" class="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
