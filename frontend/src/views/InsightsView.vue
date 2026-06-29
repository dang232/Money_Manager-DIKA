<script setup lang="ts">
import { onMounted } from 'vue'
import { useAiStore } from '@/stores/ai.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, BarChart3 } from '@lucide/vue'

const ai = useAiStore()

onMounted(async () => {
  await ai.fetchInsights()
})

const typeBadgeVariant: Record<string, 'destructive' | 'success' | 'default' | 'warning' | 'secondary'> = {
  spending: 'destructive',
  saving: 'success',
  income: 'default',
  budget: 'warning',
}

function getVariant(type: string) {
  return typeBadgeVariant[type] ?? 'secondary'
}
</script>

<template>
  <div class="space-y-6 pb-8">
    <!-- Page heading -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">AI Insights</h1>
        <p class="text-sm text-muted-foreground mt-1">AI-powered analysis of your spending patterns and habits</p>
      </div>
      <Button :disabled="ai.loading" @click="ai.generateInsights()">
        <Loader2 v-if="ai.loading" :size="16" class="animate-spin" />
        {{ ai.loading ? 'Generating...' : 'Generate Insights' }}
      </Button>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="ai.loading && ai.insights.length === 0"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
    >
      <div v-for="n in 6" :key="n" class="rounded-xl border border-border bg-card p-5 space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div class="h-4 w-3/4 skeleton" />
          <div class="h-5 w-16 rounded-full skeleton" />
        </div>
        <div class="space-y-2">
          <div class="h-3 w-full skeleton" />
          <div class="h-3 w-5/6 skeleton" />
          <div class="h-3 w-4/6 skeleton" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!ai.loading && ai.insights.length === 0"
      class="rounded-xl border border-border bg-card p-12 flex flex-col items-center gap-4 text-center"
    >
      <div class="rounded-full bg-muted p-4">
        <BarChart3 :size="32" class="text-muted-foreground" />
      </div>
      <div>
        <p class="text-sm font-medium text-foreground">No insights yet</p>
        <p class="text-sm text-muted-foreground mt-1">Click Generate Insights to analyze your spending</p>
      </div>
    </div>

    <!-- Insight cards -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
      <div
        v-for="(insight, idx) in ai.insights"
        :key="idx"
        class="rounded-xl border border-border bg-card p-5 space-y-3 card-interactive"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-sm font-semibold text-foreground leading-snug">{{ insight.title }}</h2>
          <Badge :variant="getVariant(insight.type)" class="shrink-0 capitalize">
            {{ insight.type }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground leading-relaxed">{{ insight.body }}</p>
      </div>
    </div>
  </div>
</template>
