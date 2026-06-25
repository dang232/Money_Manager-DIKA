<script setup lang="ts">
import type { BudgetProjection } from '@/api/budget.api'

defineProps<{ projections: BudgetProjection[] }>()
</script>

<template>
  <div
    v-if="projections.some(p => p.overageDate)"
    class="rounded-xl border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10 p-4"
  >
    <div class="flex items-start gap-3">
      <span class="text-yellow-600 text-lg">⚠️</span>
      <div>
        <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Budget Alert</p>
        <ul class="mt-1 space-y-1">
          <li
            v-for="proj in projections.filter(p => p.overageDate)"
            :key="proj.categoryId"
            class="text-sm text-yellow-700 dark:text-yellow-300"
          >
            {{ proj.categoryName }} projected to exceed by {{ proj.overageDate }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
