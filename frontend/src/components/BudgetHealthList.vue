<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import type { BudgetStatus } from '@/api/budget.api'
import { cn } from '@/lib/utils'

defineProps<{ budgets: BudgetStatus[] }>()

const list = ref<HTMLElement | null>(null)

function getBarColor(percentage: number) {
  if (percentage > 100) return 'bg-red-500'
  if (percentage > 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion || !list.value) return

  const bars = list.value.querySelectorAll('[data-bar]')
  gsap.from(bars, {
    width: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
  })
})
</script>

<template>
  <div ref="list" class="space-y-3">
    <div
      v-for="budget in budgets"
      :key="budget.categoryId"
      class="rounded-lg border border-border bg-card p-4"
    >
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-foreground">{{ budget.categoryName }}</span>
        <span
          :class="cn('text-sm font-medium', budget.percentage > 100 ? 'text-red-500' : budget.percentage > 70 ? 'text-yellow-500' : 'text-green-500')"
        >
          {{ Math.round(budget.percentage) }}%
        </span>
      </div>
      <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          data-bar
          :class="cn('h-full rounded-full transition-all', getBarColor(budget.percentage))"
          :style="{ width: `${Math.min(budget.percentage, 100)}%` }"
        />
      </div>
    </div>
    <p v-if="budgets.length === 0" class="text-sm text-muted-foreground text-center py-4">
      No budgets set yet
    </p>
  </div>
</template>
