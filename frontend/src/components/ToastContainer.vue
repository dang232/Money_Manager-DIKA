<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const bgColors = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm"
          :class="bgColors[toast.type]"
        >
          <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
            {{ icons[toast.type] }}
          </span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
            @click="remove(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
