<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'

const route = useRoute()
const isOnboarding = computed(() => route.path === '/onboarding')
</script>

<template>
  <AppLayout v-if="!isOnboarding">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>
