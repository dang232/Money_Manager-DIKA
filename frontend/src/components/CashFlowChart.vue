<script setup lang="ts">
import { ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  labels: string[]
  income: number[]
  expenses: number[]
}>()

const chartData = ref({
  labels: props.labels,
  datasets: [
    {
      label: 'Income',
      data: props.income,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#10b981',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    {
      label: 'Expenses',
      data: props.expenses,
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.06)',
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#ef4444',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { family: 'Inter', size: 12, weight: 500 },
        color: '#475569',
      },
    },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', weight: 'bold' as const },
      bodyFont: { family: 'Inter' },
      callbacks: {
        label: (ctx: any) => ctx.dataset.label + ': ₫' + (ctx.parsed.y / 1000000).toFixed(1) + 'M',
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 12 }, color: '#64748b' },
    },
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

watch(() => [props.labels, props.income, props.expenses], () => {
  chartData.value = {
    labels: props.labels,
    datasets: [
      { ...chartData.value.datasets[0], data: props.income },
      { ...chartData.value.datasets[1], data: props.expenses },
    ],
  }
})
</script>

<template>
  <div class="h-[280px]">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
