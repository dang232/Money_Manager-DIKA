<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useBudgetStore } from '@/stores/budget.store'
import MonthlySummary from '@/components/MonthlySummary.vue'
import BudgetHealthList from '@/components/BudgetHealthList.vue'
import ProjectionAlert from '@/components/ProjectionAlert.vue'
import { formatVND, formatDate } from '@/lib/utils'

const dashboard = useDashboardStore()
const budget = useBudgetStore()

onMounted(async () => {
  await Promise.all([dashboard.fetchDashboard(), budget.fetchProjections()])
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-foreground">Dashboard</h1>

    <!-- Loading -->
    <div v-if="dashboard.loading" class="text-center py-8 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Monthly Summary -->
      <MonthlySummary
        :income="dashboard.summary?.totalIncome ?? 0"
        :expense="dashboard.summary?.totalExpense ?? 0"
        :net="dashboard.summary?.netAmount ?? 0"
      />

      <!-- Projection Alert -->
      <ProjectionAlert :projections="budget.projections" />

      <!-- Budget Health -->
      <div>
        <h2 class="text-lg font-semibold text-foreground mb-3">Budget Health</h2>
        <BudgetHealthList :budgets="dashboard.budgetHealth" />
      </div>

      <!-- Recent Transactions -->
      <div>
        <h2 class="text-lg font-semibold text-foreground mb-3">Recent Transactions</h2>
        <div class="rounded-xl border border-border bg-card divide-y divide-border">
          <div
            v-for="tx in dashboard.recentTransactions"
            :key="tx.id"
            class="flex items-center justify-between p-4"
          >
            <div>
              <p class="text-sm font-medium text-foreground">{{ tx.description || tx.categoryName }}</p>
              <p class="text-xs text-muted-foreground">{{ formatDate(tx.date) }}</p>
            </div>
            <span
              class="text-sm font-semibold"
              :class="tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ tx.type === 'income' ? '+' : '-' }}{{ formatVND(tx.amount) }}
            </span>
          </div>
          <p
            v-if="dashboard.recentTransactions.length === 0"
            class="text-sm text-muted-foreground text-center py-6"
          >
            No transactions yet
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
