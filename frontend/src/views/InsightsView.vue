<script setup lang="ts">
import { onMounted } from 'vue'
import { useAiStore } from '@/stores/ai.store'

const ai = useAiStore()

onMounted(async () => {
  await ai.fetchInsights()
})

const typeBadgeClass: Record<string, string> = {
  spending: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  saving: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  income: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  budget: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  default: 'bg-muted text-muted-foreground',
}

function badgeClass(type: string) {
  return typeBadgeClass[type] ?? typeBadgeClass.default
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page heading -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-foreground">AI Insights</h1>
        <p class="mt-1 text-sm text-muted-foreground">AI-powered analysis of your spending patterns and habits</p>
      </div>
      <button
        class="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity flex items-center gap-2 shrink-0"
        :disabled="ai.loading"
        aria-label="Generate new insights"
        @click="ai.generateInsights()"
      >
        <!-- Spinner while loading -->
        <svg
          v-if="ai.loading"
          class="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ ai.loading ? 'Generating...' : 'Generate Insights' }}
      </button>
    </div>

    <!-- Loading skeleton shimmer -->
    <div
      v-if="ai.loading && ai.insights.length === 0"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading insights"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3 animate-pulse"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="h-4 rounded bg-muted w-3/4" />
          <div class="h-5 w-16 rounded-full bg-muted shrink-0" />
        </div>
        <div class="space-y-2">
          <div class="h-3 rounded bg-muted w-full" />
          <div class="h-3 rounded bg-muted w-5/6" />
          <div class="h-3 rounded bg-muted w-4/6" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!ai.loading && ai.insights.length === 0"
      class="rounded-xl border border-border bg-card shadow-sm p-12 flex flex-col items-center gap-4 text-center"
    >
      <!-- Chart icon illustration -->
      <div class="rounded-full bg-muted p-4">
        <svg
          class="h-8 w-8 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-12m12-13.5V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5v-3m13.5-13.5H6.75" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v-6.75m3 6.75V9.75m3 4.5V8.25m3 6V11.25" />
        </svg>
      </div>
      <div>
        <p class="text-sm font-medium text-foreground">No insights yet</p>
        <p class="text-sm text-muted-foreground mt-1">Click Generate Insights to analyze your spending</p>
      </div>
    </div>

    <!-- Insight cards -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(insight, idx) in ai.insights"
        :key="idx"
        class="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-sm font-semibold text-foreground leading-snug">{{ insight.title }}</h2>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            :class="badgeClass(insight.type)"
          >
            {{ insight.type }}
          </span>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">{{ insight.body }}</p>
      </div>
    </div>
  </div>
</template>
