<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { VueDraggable } from 'vue-draggable-plus'
import { useDraggableList } from '@/composables/useDraggableList'
import { formatVND } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Plus, PiggyBank, GripVertical } from '@lucide/vue'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

// DRY: Using composable for draggable list state
const { items: localBudgets, onDragEnd } = useDraggableList<any>(() => budgetStore.budgets, 'budgets')

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

function getBarGradient(pct: number): string {
  if (pct > 100) return 'background: linear-gradient(90deg, #ef4444, #f87171)'
  if (pct > 70) return 'background: linear-gradient(90deg, #f59e0b, #fb923c)'
  return 'background: linear-gradient(90deg, #10b981, #34d399)'
}

function handleReorder() {
  onDragEnd(localBudgets.value.map(b => b.categoryId))
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Monthly Budgets</h1>
        <p class="text-sm text-muted-foreground mt-1">{{ localBudgets.length }} active budgets</p>
      </div>
      <Button @click="openSetBudget()">
        <Plus :size="16" :stroke-width="2.5" />
        New Budget
      </Button>
    </div>

    <div v-if="budgetStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-card rounded-2xl border border-border p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 rounded-xl skeleton" />
          <div class="flex-1 space-y-2">
            <div class="h-4 w-24 skeleton" />
            <div class="h-3 w-16 skeleton" />
          </div>
        </div>
        <div class="h-2 w-full skeleton mb-2" />
        <div class="h-3 w-32 skeleton" />
      </div>
    </div>

    <template v-else>
      <!-- DRY: Single draggable grid with reusable pattern -->
      <VueDraggable
        v-model="localBudgets"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        ghost-class="opacity-30"
        @end="handleReorder"
      >
        <div
          v-for="b in localBudgets"
          :key="b.categoryId"
          :data-testid="`budget-card`"
          :data-budget-id="b.categoryId"
          class="bg-card rounded-2xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing"
        >
          <!-- Card Header -->
          <div class="flex items-center gap-3 mb-4">
            <div class="text-muted-foreground hover:text-foreground">
              <GripVertical :size="18" />
            </div>
            <div class="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <PiggyBank :size="20" class="text-muted-foreground" />
            </div>
            <div class="flex-1">
              <h3 class="font-display font-bold text-[15px] text-foreground">{{ categoryStore.byId[b.categoryId]?.name || 'Uncategorized' }}</h3>
              <p class="text-xs text-muted-foreground">Resets next month</p>
            </div>
            <Button variant="ghost" size="sm" @click="openSetBudget(b.categoryId)">
              Edit
            </Button>
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
          <Badge
            :variant="b.usagePercentage > 100 ? 'destructive' : b.usagePercentage > 70 ? 'warning' : 'success'"
          >
            {{ b.usagePercentage > 100 ? `Over by ${formatVND(b.runningTotal - b.monthlyLimit)}` :
               b.usagePercentage > 70 ? `${b.usagePercentage}% used` : 'On track' }}
          </Badge>
        </div>

        <!-- Create New Card (not draggable) -->
        <button
          type="button"
          class="border-2 border-dashed border-border rounded-2xl bg-transparent flex items-center justify-center min-h-[200px] cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-all w-full text-left"
          @click="openSetBudget()"
        >
          <div class="text-center text-muted-foreground">
            <div class="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Plus :size="24" class="text-muted-foreground" />
            </div>
            <p class="font-semibold text-foreground text-sm">Create new budget</p>
            <p class="text-xs mt-1">Set a spending limit by category</p>
          </div>
        </button>
      </VueDraggable>

      <p v-if="localBudgets.length === 0" class="text-sm text-muted-foreground text-center py-8">
        No budgets configured. Set a budget to start tracking spending.
      </p>
    </template>

    <!-- Set Budget Dialog -->
    <Dialog :open="showSetBudget" @update:open="showSetBudget = $event">
      <div class="space-y-5">
        <DialogTitle class="font-display text-xl font-bold text-foreground">Set Budget</DialogTitle>
        <form class="space-y-4" @submit.prevent="handleSetBudget">
          <div class="space-y-1.5">
            <Label for="budget-category">Category</Label>
            <select
              id="budget-category"
              v-model="budgetForm.categoryId"
              class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
            >
              <option value="" disabled>Select category</option>
              <option v-for="cat in categoryStore.expenseCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <Label for="budget-amount">Amount (VND)</Label>
            <Input
              id="budget-amount"
              v-model="budgetForm.amount"
              type="number"
            />
          </div>
          <div class="flex gap-3 pt-3">
            <Button type="button" variant="outline" class="flex-1" @click="showSetBudget = false">Cancel</Button>
            <Button type="submit" class="flex-1">Save</Button>
          </div>
        </form>
      </div>
    </Dialog>
  </div>
</template>
