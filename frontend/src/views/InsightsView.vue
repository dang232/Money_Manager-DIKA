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
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-foreground">AI Insights</h1>
      <button
        class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        :disabled="ai.loading"
        @click="ai.generateInsights()"
      >
        {{ ai.loading ? 'Generating...' : 'Generate new insights' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="ai.loading && ai.insights.length === 0" class="text-center py-8 text-muted-foreground">
      Loading insights...
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!ai.loading && ai.insights.length === 0"
      class="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground"
    >
      No insights yet. Click "Generate new insights" to analyse your finances.
    </div>

    <!-- Insight cards -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(insight, idx) in ai.insights"
        :key="idx"
        class="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm"
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
