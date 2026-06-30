<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonVariants } from '.'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  as?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  as: 'button',
})
</script>

<template>
  <Primitive
    :as="as"
    :class="cn(buttonVariants({ variant, size }), $attrs.class ?? '')"
    :disabled="disabled"
  >
    <slot />
  </Primitive>
</template>
