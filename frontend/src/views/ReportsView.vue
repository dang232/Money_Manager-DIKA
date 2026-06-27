<script setup lang="ts">
import { ref } from 'vue'
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const activePeriod = ref('Month')
const periods = ['Week', 'Month', 'Quarter', 'Year']

// ponytail: sample data — wire to real report API when available
const trendData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Income',
      data: [22000000, 24000000, 23500000, 25000000, 24500000, 25000000],
      backgroundColor: '#10b981',
      borderRadius: 6,
      barPercentage: 0.6,
    },
    {
      label: 'Expenses',
      data: [8000000, 7500000, 8200000, 7100000, 7800000, 6550000],
      backgroundColor: '#ef4444',
      borderRadius: 6,
      barPercentage: 0.6,
    },
    {
      label: 'Savings',
      data: [14000000, 16500000, 15300000, 17900000, 16700000, 18450000],
      backgroundColor: '#3b82f6',
      borderRadius: 6,
      barPercentage: 0.6,
    },
  ],
}

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
        label: (ctx: any) => ctx.dataset.label + ': ₫' + (ctx.parsed.y / 1000000).toFixed(1) + 'M',
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
          :class="activePeriod === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          @click="activePeriod = p"
        >{{ p }}</button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-card rounded-2xl border border-border p-5">
        <p class="font-display text-base font-bold text-foreground mb-2">Avg. Daily Spend</p>
        <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">₫218,333</p>
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
          — 0% vs last month
        </span>
      </div>
      <div class="bg-card rounded-2xl border border-border p-5">
        <p class="font-display text-base font-bold text-foreground mb-2">Largest Expense</p>
        <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">₫890,000</p>
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
          Uniqlo · Shopping
        </span>
      </div>
      <div class="bg-card rounded-2xl border border-border p-5">
        <p class="font-display text-base font-bold text-foreground mb-2">Most Active Day</p>
        <p class="font-display text-[32px] font-extrabold text-foreground tracking-tight mb-2">Saturday</p>
        <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
          <Calendar :size="12" />
          12 transactions
        </span>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="bg-card rounded-2xl border border-border p-5">
      <div class="mb-5">
        <h3 class="font-display text-base font-bold text-foreground">Monthly Trend</h3>
        <p class="text-xs text-muted-foreground mt-0.5">Income, expenses and savings over the last 6 months</p>
      </div>
      <div class="h-[320px]">
        <Bar :data="trendData" :options="trendOptions" />
      </div>
    </div>
  </div>
</template>
