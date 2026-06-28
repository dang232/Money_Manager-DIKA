<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Calendar } from '@lucide/vue'
import { useReportStore } from '@/stores/report.store'
import { useCategoryStore } from '@/stores/category.store'
import { formatVND } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const reportStore = useReportStore()
const categoryStore = useCategoryStore()

const periods = ['Week', 'Month', 'Quarter', 'Year']

function getDateRange(period: string): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const dateTo = now.toISOString().slice(0, 10)
  let from = new Date(now)
  switch (period) {
    case 'Week':
      from.setDate(from.getDate() - 7)
      break
    case 'Month':
      from.setMonth(from.getMonth() - 1)
      break
    case 'Quarter':
      from.setMonth(from.getMonth() - 3)
      break
    case 'Year':
      from.setFullYear(from.getFullYear() - 1)
      break
  }
  return { dateFrom: from.toISOString().slice(0, 10), dateTo }
}

function getTrendMonths(period: string): number {
  switch (period) {
    case 'Week': return 3
    case 'Month': return 6
    case 'Quarter': return 9
    case 'Year': return 12
    default: return 6
  }
}

let abortController: AbortController | null = null

watch(() => reportStore.activePeriod, (period) => {
  abortController?.abort()
  abortController = new AbortController()
  const { dateFrom, dateTo } = getDateRange(period)
  reportStore.fetchStats(dateFrom, dateTo, abortController.signal)
  reportStore.fetchTrend(getTrendMonths(period), abortController.signal)
})

onMounted(async () => {
  await categoryStore.fetchAll()
  const { dateFrom, dateTo } = getDateRange(reportStore.activePeriod)
  await Promise.all([
    reportStore.fetchTrend(getTrendMonths(reportStore.activePeriod)),
    reportStore.fetchStats(dateFrom, dateTo),
  ])
})

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const trendLabels = computed(() => reportStore.trend.map((t) => MONTH_NAMES[t.month - 1]))
const trendIncome = computed(() => reportStore.trend.map((t) => t.totalIncome))
const trendExpenses = computed(() => reportStore.trend.map((t) => t.totalExpense))
const trendSavings = computed(() => reportStore.trend.map((t) => t.totalIncome - t.totalExpense))

const trendData = computed(() => ({
  labels: trendLabels.value,
  datasets: [
    {
      label: 'Income',
      data: trendIncome.value,
      backgroundColor: '#10b981',
      borderRadius: 6,
      barPercentage: 0.6,
    },
    {
      label: 'Expenses',
      data: trendExpenses.value,
      backgroundColor: '#ef4444',
      borderRadius: 6,
      barPercentage: 0.6,
    },
    {
      label: 'Savings',
      data: trendSavings.value,
      backgroundColor: '#3b82f6',
      borderRadius: 6,
      barPercentage: 0.6,
    },
  ],
}))

const trendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { family: 'Inter', size: 12 }, color: '#475569' },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => ctx.dataset.label + ': ' + formatVND(ctx.parsed.y),
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#64748b' } },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: {
        font: { family: 'Inter', size: 11 },
        color: '#94a3b8',
        callback: (v: any) => '₫' + (v / 1000000).toFixed(0) + 'M',
      },
    },
  },
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const avgDailySpend = computed(() => reportStore.stats?.avgDailySpend ?? 0)
const largestExpense = computed(() => reportStore.stats?.largestExpense ?? { amount: 0, description: '—', categoryId: '' })
const mostActiveDay = computed(() => {
  const raw = reportStore.stats?.mostActiveDay
  if (!raw) return { dayOfWeek: '—', count: 0 }
  return { dayOfWeek: DAY_NAMES[raw.dayOfWeek] ?? '—', count: raw.count }
})

const largestExpenseCategoryName = computed(() => {
  if (!largestExpense.value.categoryId) return '—'
  return categoryStore.byId[largestExpense.value.categoryId]?.name ?? 'Unknown'
})
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Reports & Insights</h1>
        <p class="text-sm text-muted-foreground mt-1">Understand your spending patterns</p>
      </div>
      <div class="flex bg-card border border-border rounded-xl p-1 gap-0.5">
        <button
          v-for="p in periods"
          :key="p"
          class="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
          :class="reportStore.activePeriod === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          @click="reportStore.activePeriod = p"
        >{{ p }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="reportStore.loading" class="text-center py-12 text-muted-foreground">Loading...</div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-card rounded-2xl border border-border p-5">
          <p class="font-display text-base font-bold text-foreground mb-2">Avg. Daily Spend</p>
          <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">{{ formatVND(avgDailySpend) }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
            — 0% vs last period
          </span>
        </div>
        <div class="bg-card rounded-2xl border border-border p-5">
          <p class="font-display text-base font-bold text-foreground mb-2">Largest Expense</p>
          <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">{{ formatVND(largestExpense.amount) }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {{ largestExpense.description }} &middot; {{ largestExpenseCategoryName }}
          </span>
        </div>
        <div class="bg-card rounded-2xl border border-border p-5">
          <p class="font-display text-base font-bold text-foreground mb-2">Most Active Day</p>
          <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">{{ mostActiveDay.dayOfWeek }}</p>
          <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
            <Calendar :size="12" />
            {{ mostActiveDay.count }} transactions
          </span>
        </div>
      </div>

      <!-- Trend Chart -->
      <div class="bg-card rounded-2xl border border-border p-5">
        <div class="mb-5">
          <h3 class="font-display text-base font-bold text-foreground">Monthly Trend</h3>
          <p class="text-xs text-muted-foreground mt-0.5">Income, expenses and savings over the last {{ getTrendMonths(reportStore.activePeriod) }} months</p>
        </div>
        <div class="h-[320px]">
          <Bar :data="trendData" :options="trendOptions" />
        </div>
      </div>
    </template>
  </div>
</template>
