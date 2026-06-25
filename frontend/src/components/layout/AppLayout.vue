<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useTheme } from '@/composables/useTheme'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const ui = useUiStore()
useTheme()

function handleResize() {
  ui.setMobile(window.innerWidth < 768)
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/transactions', label: 'Transactions', icon: '💰' },
  { path: '/budget', label: 'Budget', icon: '📋' },
  { path: '/categories', label: 'Categories', icon: '🏷️' },
]
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Desktop Sidebar -->
    <AppSidebar v-if="!ui.isMobile" :nav-items="navItems" />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto pb-16 md:pb-0">
      <div class="p-4 md:p-6 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <nav
      v-if="ui.isMobile"
      class="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50"
    >
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
        :class="route.path === item.path ? 'text-primary' : 'text-muted-foreground'"
      >
        <span class="text-lg">{{ item.icon }}</span>
        <span class="text-xs">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>
