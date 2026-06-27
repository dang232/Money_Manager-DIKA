<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useTheme } from '@/composables/useTheme'
import AppSidebar from './AppSidebar.vue'
import AiChat from '@/components/AiChat.vue'
import {
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  Receipt,
  Target,
  Tag,
  BarChart3,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
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

const mobileNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: Target },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]
</script>

<template>
  <div class="flex h-screen bg-background">
    <!-- Desktop Sidebar -->
    <AppSidebar v-if="!ui.isMobile" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="shrink-0 px-6 md:px-10 py-5 flex items-center justify-between gap-4">
        <div class="relative flex-1 max-w-[480px]">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" :size="18" />
          <input
            type="text"
            placeholder="Search transactions, categories, budgets..."
            class="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <div class="flex items-center gap-3">
          <button class="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors">
            <Bell :size="18" />
            <span class="absolute top-2 right-2.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
          </button>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm">
            DA
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto pb-20 md:pb-0">
        <div class="px-6 md:px-10 max-w-[1400px] w-full">
          <slot />
        </div>
      </main>
    </div>

    <!-- FAB -->
    <button
      class="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_12px_24px_rgba(16,185,129,0.4)] hover:scale-105 hover:bg-primary/90 transition-all z-40"
      title="Add Transaction"
      @click="router.push({ path: '/transactions', query: { add: '1' } })"
    >
      <Plus :size="24" />
    </button>

    <!-- Mobile Bottom Nav -->
    <nav
      v-if="ui.isMobile"
      class="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2.5 z-50"
    >
      <router-link
        v-for="item in mobileNav"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors"
        :class="route.path === item.path ? 'text-primary' : 'text-muted-foreground'"
      >
        <component :is="item.icon" :size="20" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- AI Chat (available on every page) -->
    <AiChat />
  </div>
</template>
