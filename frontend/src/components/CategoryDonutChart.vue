<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  labels: string[]
  data: number[]
  colors: string[]
  centerValue?: string
  centerLabel?: string
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [{
    data: props.data,
    backgroundColor: props.colors,
    borderWidth: 0,
    spacing: 2,
    hoverOffset: 6,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0f172a',
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => ' ' + ctx.label + ': ' + ctx.parsed + '%',
      },
    },
  },
}
</script>

<template>
  <div class="relative h-[180px]">
    <Doughnut :data="chartData" :options="chartOptions" />
    <div v-if="centerValue" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
      <div class="font-display text-xl font-extrabold text-foreground">{{ centerValue }}</div>
      <div class="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{{ centerLabel }}</div>
    </div>
  </div>
</template>
