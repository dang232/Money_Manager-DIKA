<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import AnimatedNumber from './AnimatedNumber.vue'

defineProps<{
  income: number
  expense: number
  net: number
}>()

const cards = ref<HTMLElement | null>(null)

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion || !cards.value) return

  gsap.from(cards.value.children, {
    y: 20,
    opacity: 0,
    duration: 0.4,
    stagger: 0.1,
    ease: 'power2.out',
  })
})
</script>

<template>
  <div ref="cards" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Income -->
    <div class="rounded-xl border border-border bg-card p-5">
      <p class="text-sm text-muted-foreground mb-1">Income</p>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400">
        <AnimatedNumber :value="income" />
      </p>
    </div>

    <!-- Expense -->
    <div class="rounded-xl border border-border bg-card p-5">
      <p class="text-sm text-muted-foreground mb-1">Expense</p>
      <p class="text-2xl font-bold text-red-600 dark:text-red-400">
        <AnimatedNumber :value="expense" />
      </p>
    </div>

    <!-- Net -->
    <div class="rounded-xl border border-border bg-card p-5">
      <p class="text-sm text-muted-foreground mb-1">Net</p>
      <p class="text-2xl font-bold text-primary">
        <AnimatedNumber :value="net" />
      </p>
    </div>
  </div>
</template>
