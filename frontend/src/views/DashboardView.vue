<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useBudgetStore } from '@/stores/budget.store'
import { formatVND } from '@/lib/utils'
import CashFlowChart from '@/components/CashFlowChart.vue'
import CategoryDonutChart from '@/components/CategoryDonutChart.vue'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Plus,
} from '@lucide/vue'

const router = useRouter()
const dashboard = useDashboardStore()
const budget = useBudgetStore()

onMounted(async () => {
  await Promise.all([dashboard.fetchDashboard(), budget.fetchStatus()])
})

const income = computed(() => dashboard.summary?.totalIncome ?? 0)
const expense = computed(() => dashboard.summary?.totalExpense ?? 0)
const net = computed(() => dashboard.summary?.netAmount ?? 0)
const savingsRate = computed(() => income.value > 0 ? ((income.value - expense.value) / income.value * 100).toFixed(1) : '0')

// ponytail: sample chart data — replace with real API when endpoint exists
const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const chartIncome = [22000000, 24000000, 23500000, 25000000, 24500000, 25000000]
const chartExpenses = [8000000, 7500000, 8200000, 7100000, 7800000, 6550000]

const categoryLabels = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Others']
const categoryData = [32, 22, 18, 15, 13]
const categoryColors = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#94a3b8']

const categoryBreakdown = [
  { name: 'Food & Dining', pct: '32%', amount: '₫2,096,000', color: '#fef3c7', icon: '🍔' },
  { name: 'Transport', pct: '22%', amount: '₫1,441,000', color: '#dbeafe', icon: '🚗' },
  { name: 'Shopping', pct: '18%', amount: '₫1,179,000', color: '#fce7f3', icon: '🛍️' },
  { name: 'Entertainment', pct: '15%', amount: '₫982,500', color: '#ede9fe', icon: '🎬' },
]
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Good morning, Dika 👋</h1>
        <p class="text-sm text-muted-foreground mt-1">Here's your financial overview for June 2026</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex bg-card border border-border rounded-xl p-1 gap-0.5">
          <button class="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-muted transition-colors">Day</button>
          <button class="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground">Month</button>
          <button class="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-muted transition-colors">Year</button>
        </div>
        <button
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all"
          @click="router.push('/transactions')"
        >
          <Plus :size="16" :stroke-width="2.5" />
          Add Transaction
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="dashboard.loading" class="text-center py-12 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="w-11 h-11 rounded-xl bg-info-bg flex items-center justify-center mb-3">
            <Wallet :size="22" class="text-info" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Total Balance</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground mb-3">{{ formatVND(net) }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-income-bg text-income">
            <ArrowUpRight :size="12" />
            +12.5% vs last month
          </span>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="w-11 h-11 rounded-xl bg-income-bg flex items-center justify-center mb-3">
            <TrendingUp :size="22" class="text-income" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Income</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground mb-3">{{ formatVND(income) }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-income-bg text-income">
            <ArrowUpRight :size="12" />
            +5.2% vs last month
          </span>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="w-11 h-11 rounded-xl bg-expense-bg flex items-center justify-center mb-3">
            <TrendingDown :size="22" class="text-expense" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Expenses</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground mb-3">{{ formatVND(expense) }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-expense-bg text-expense">
            <ArrowDownRight :size="12" />
            -8.1% vs last month
          </span>
        </div>

        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="w-11 h-11 rounded-xl bg-warning-bg flex items-center justify-center mb-3">
            <Trophy :size="22" class="text-warning" />
          </div>
          <p class="text-[13px] text-muted-foreground font-medium mb-1">Savings Rate</p>
          <p class="font-display text-[26px] font-extrabold tracking-tight text-foreground mb-3">{{ savingsRate }}%</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-income-bg text-income">
            <ArrowUpRight :size="12" />
            +4.3% vs last month
          </span>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div class="bg-card rounded-2xl border border-border p-5">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="font-display text-base font-bold text-foreground">Cash Flow</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Income vs expenses over time</p>
            </div>
            <div class="flex bg-card border border-border rounded-xl p-1 gap-0.5">
              <button class="px-3 py-1 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground">6M</button>
              <button class="px-3 py-1 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-muted transition-colors">1Y</button>
            </div>
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
            center-value="₫6.55M"
            center-label="Total spent"
          />
          <div class="mt-4 space-y-3">
            <div v-for="cat in categoryBreakdown" :key="cat.name" class="grid grid-cols-[36px_1fr_auto] items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" :style="{ background: cat.color }">
                {{ cat.icon }}
              </div>
              <div>
                <p class="text-[13px] font-semibold text-foreground">{{ cat.name }}</p>
                <p class="text-[11px] text-muted-foreground">{{ cat.pct }} of total</p>
              </div>
              <p class="font-display font-bold text-foreground text-sm">{{ cat.amount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Budgets -->
      <div class="bg-card rounded-2xl border border-border p-5">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="font-display text-base font-bold text-foreground">Active Budgets</h3>
            <p class="text-xs text-muted-foreground mt-0.5">Budget progress this month</p>
          </div>
          <button
            class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            @click="router.push('/budget')"
          >
            View all
            <ChevronRight :size="16" />
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="b in budget.budgets.slice(0, 3)" :key="b.categoryId">
            <div class="flex justify-between mb-2">
              <strong class="text-sm text-foreground">{{ b.categoryId }}</strong>
              <span class="text-[13px] text-muted-foreground">{{ formatVND(b.runningTotal) }} / {{ formatVND(b.monthlyLimit) }}</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden mb-1.5">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="b.usagePercentage > 100 ? 'bg-destructive' : b.usagePercentage > 70 ? 'bg-warning' : 'bg-primary'"
                :style="{ width: `${Math.min(b.usagePercentage, 100)}%` }"
              />
            </div>
            <p
              class="text-xs font-semibold"
              :class="b.usagePercentage > 100 ? 'text-destructive' : b.usagePercentage > 70 ? 'text-warning' : 'text-primary'"
            >
              {{ b.usagePercentage > 100 ? '⚠ Over budget' : b.usagePercentage > 70 ? `⚠ ${b.usagePercentage}% used` : '✓ On track' }}
            </p>
          </div>
          <p v-if="budget.budgets.length === 0" class="text-sm text-muted-foreground col-span-3 text-center py-4">No budgets set yet</p>
        </div>
      </div>
    </template>
  </div>
</template>
