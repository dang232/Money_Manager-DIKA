<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGsapNumber } from '@/composables/useGsapNumber'
import { formatVND } from '@/lib/utils'

const props = defineProps<{ value: number }>()
const source = ref(props.value)

watch(() => props.value, (v) => { source.value = v })

const { displayValue } = useGsapNumber(source)
</script>

<template>
  <span>{{ formatVND(Math.round(displayValue)) }}</span>
</template>
