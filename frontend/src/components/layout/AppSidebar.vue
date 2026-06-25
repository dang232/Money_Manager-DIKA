<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'

interface NavItem {
  path: string
  label: string
  icon: string
}

defineProps<{ navItems: NavItem[] }>()

const route = useRoute()
const ui = useUiStore()
</script>

<template>
  <aside
    class="h-screen border-r border-border bg-card flex flex-col transition-all duration-200"
    :class="ui.sidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo -->
    <div class="p-4 border-b border-border flex items-center gap-2">
      <span class="text-xl font-bold text-primary">MM</span>
      <span v-if="!ui.sidebarCollapsed" class="text-sm font-semibold text-foreground">Money Manager</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
        :class="
          route.path === item.path
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        "
      >
        <span>{{ item.icon }}</span>
        <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div class="p-2 border-t border-border space-y-1">
      <!-- Theme toggle -->
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        @click="ui.toggleTheme()"
      >
        <span>{{ ui.theme === 'dark' ? '☀️' : '🌙' }}</span>
        <span v-if="!ui.sidebarCollapsed">{{ ui.theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
      </button>

      <!-- Collapse toggle -->
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        @click="ui.toggleSidebar()"
      >
        <span>{{ ui.sidebarCollapsed ? '→' : '←' }}</span>
        <span v-if="!ui.sidebarCollapsed">Collapse</span>
      </button>
    </div>
  </aside>
</template>
