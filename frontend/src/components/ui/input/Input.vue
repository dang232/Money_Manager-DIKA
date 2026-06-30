<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <input
    :type="type ?? 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="cn(
      'flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
      $attrs.class ?? ''
    )"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
