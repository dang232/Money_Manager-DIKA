<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { useUserStore } from '@/stores/user.store'
import { formatVND } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CashFlowChart from '@/components/CashFlowChart.vue'
import CategoryDonutChart from '@/components/CategoryDonutChart.vue'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Trophy,
  ChevronRight,
  Plus,
} from '@lucide/vue'

const router = useRouter()
const dashboard = useDashboardStore()
const budget = useBudgetStore()
const categoryStore = useCategoryStore()
const userStore = useUserStore()

onMounted(async () => {
  await Promise.all([dashboard.fetchDashboard(), budget.fetchStatus(), categoryStore.fetchAll(), userStore.fetchProfile()])
})

const income = computed(() => dashboard.summary?.totalIncome ?? 0)
const expense = computed(() => dashboard.summary?.totalExpense ?? 0)
const net = computed(() => dashboard.summary?.netAmount ?? 0)
const savingsRate = computed(() => income.value > 0 ? ((income.value - expense.value) / income.value * 100).toFixed(1) : '0')
// ponytail: user-service profile.displayName may be null — fall back to auth user
const authStore = useAuthStore()
const displayName = computed(() => userStore.profile?.displayName || authStore.user?.displayName || 'there')

function budgetCategoryName(categoryId: string): string {
  return categoryStore.byId[categoryId]?.name ?? categoryId
}

const COLOR_PALETTE = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#94a3b8', '#06b6d4', '#84cc16', '#f97316']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const chartLabels = computed(() => dashboard.monthlyTrend.map((t) => MONTH_NAMES[t.month - 1]))
const chartIncome = computed(() => dashboard.monthlyTrend.map((t) => t.totalIncome))
const chartExpenses = computed(() => dashboard.monthlyTrend.map((t) => t.totalExpense))

const categoryLabels = computed(() => dashboard.categoryBreakdown.map((c) => categoryStore.byId[c.categoryId]?.name ?? 'Unknown'))
const categoryData = computed(() => dashboard.categoryBreakdown.map((c) => c.total))
const categoryColors = computed(() => dashboard.categoryBreakdown.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]))
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Hi, {{ displayName }}</h1>
        <p class="text-sm text-muted-foreground mt-1">Here's your financial overview</p>
      </div>
      <Button @click="router.push({ path: '/transactions', query: { add: '1' } })">
        <Plus :size="16" :stroke-width="2.5" />
        Add Transaction
      </Button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="dashboard.loading" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-card rounded-2xl border border-border p-5">
          <div class="w-11 h-11 rounded-xl skeleton mb-3" />
          <div class="h-3 w-20 skeleton mb-2" />
          <div class="h-8 w-32 skeleton" />
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div class="bg-card rounded-2xl border border-border p-5 h-64 skeleton" />
        <div class="bg-card rounded-2xl border border-border p-5 h-64 skeleton" />
      </div>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger">
        <div class="bg-card rounded-2xl border border-border p-5 card-interactive shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center mb-3">
            <Wallet :size="22" class="text-info" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Total Balance</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground">{{ formatVND(net) }}</p>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5 card-interactive shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-income/10 flex items-center justify-center mb-3">
            <TrendingUp :size="22" class="text-income" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Income</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground">{{ formatVND(income) }}</p>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5 card-interactive shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-expense/10 flex items-center justify-center mb-3">
            <TrendingDown :size="22" class="text-expense" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Expenses</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground">{{ formatVND(expense) }}</p>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5 card-interactive shadow-sm">
          <div class="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
            <Trophy :size="22" class="text-warning" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Savings Rate</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground">{{ savingsRate }}%</p>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="mb-5">
            <h3 class="font-display text-base font-bold text-foreground">Cash Flow</h3>
            <p class="text-xs text-muted-foreground mt-0.5">Income vs expenses over time</p>
          </div>
          <CashFlowChart :labels="chartLabels" :income="chartIncome" :expenses="chartExpenses" />
        </div>

        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="mb-5">
            <h3 class="font-display text-base font-bold text-foreground">Spending by Category</h3>
            <p class="text-xs text-muted-foreground mt-0.5">Top categories this month</p>
          </div>
          <CategoryDonutChart
            :labels="categoryLabels"
            :data="categoryData"
            :colors="categoryColors"
            :center-value="`₫${(expense / 1000000).toFixed(1)}M`"
            center-label="Total spent"
          />
        </div>
      </div>

      <!-- Active Budgets -->
      <div v-if="budget.budgets.length > 0" class="bg-card rounded-2xl border border-border p-5">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="font-display text-base font-bold text-foreground">Active Budgets</h3>
            <p class="text-xs text-muted-foreground mt-0.5">Budget progress this month</p>
          </div>
          <Button variant="ghost" size="sm" @click="router.push('/budget')">
            View all
            <ChevronRight :size="16" />
          </Button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="b in budget.budgets.slice(0, 3)" :key="b.categoryId">
            <div class="flex justify-between mb-2">
              <strong class="text-sm text-foreground">{{ budgetCategoryName(b.categoryId) }}</strong>
              <span class="text-[13px] text-muted-foreground">{{ formatVND(b.runningTotal) }} / {{ formatVND(b.monthlyLimit) }}</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="b.usagePercentage > 100 ? 'bg-destructive' : b.usagePercentage > 70 ? 'bg-warning' : 'bg-primary'"
                :style="{ width: `${Math.min(b.usagePercentage, 100)}%` }"
              />
            </div>
            <Badge
              :variant="b.usagePercentage > 100 ? 'destructive' : b.usagePercentage > 70 ? 'warning' : 'success'"
            >
              {{ b.usagePercentage > 100 ? 'Over budget' : b.usagePercentage > 70 ? `${b.usagePercentage}% used` : 'On track' }}
            </Badge>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
