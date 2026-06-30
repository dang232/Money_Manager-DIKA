<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  LayoutDashboard,
  Receipt,
  Target,
  Tag,
  BarChart3,
  Settings,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

const navMain = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budgets', icon: Target },
  { path: '/categories', label: 'Categories', icon: Tag },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

const navAccount = [
  { path: '/settings', label: 'Settings', icon: Settings },
]

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="h-screen border-r border-border bg-card flex flex-col transition-all duration-200 sticky top-0"
    :class="ui.sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'"
  >
    <!-- Brand -->
    <div class="p-6 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-[0_6px_16px_rgba(16,185,129,0.35)]">
        <DollarSign :size="22" :stroke-width="2.5" />
      </div>
      <div v-if="!ui.sidebarCollapsed">
        <div class="font-display font-extrabold text-lg tracking-tight text-foreground leading-tight">Money Manager</div>
        <div class="text-[11px] text-muted-foreground font-medium">Personal finance</div>
      </div>
    </div>

    <!-- Nav Main -->
    <nav class="flex-1 px-3 space-y-1">
      <p v-if="!ui.sidebarCollapsed" class="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2">Main</p>
      <router-link
        v-for="item in navMain"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        :class="
          route.path === item.path
            ? 'bg-accent text-accent-foreground font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        "
      >
        <component :is="item.icon" :size="18" :class="route.path === item.path ? 'text-primary' : 'text-muted-foreground'" />
        <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
      </router-link>

      <p v-if="!ui.sidebarCollapsed" class="text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60 px-3 mb-2 mt-5">Account</p>
      <router-link
        v-for="item in navAccount"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        :class="
          route.path === item.path
            ? 'bg-accent text-accent-foreground font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        "
      >
        <component :is="item.icon" :size="18" :class="route.path === item.path ? 'text-primary' : 'text-muted-foreground'" />
        <span v-if="!ui.sidebarCollapsed">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div class="px-3 pb-4 space-y-2">
      <!-- Premium card -->
      <div v-if="!ui.sidebarCollapsed" class="p-4 rounded-2xl bg-gradient-to-br from-accent to-emerald-50 dark:to-emerald-950/30 border border-primary/10">
        <h4 class="font-display font-bold text-sm text-accent-foreground">Go Premium</h4>
        <p class="text-xs text-accent-foreground/70 mt-0.5 mb-3">Unlimited budgets & advanced reports</p>
        <button class="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          Upgrade →
        </button>
      </div>

      <!-- Controls -->
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        @click="ui.toggleTheme()"
      >
        <Sun v-if="ui.theme === 'dark'" :size="18" />
        <Moon v-else :size="18" />
        <span v-if="!ui.sidebarCollapsed">{{ ui.theme === 'dark' ? 'Light' : 'Dark' }}</span>
      </button>
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        @click="ui.toggleSidebar()"
      >
        <ChevronLeft v-if="!ui.sidebarCollapsed" :size="18" />
        <ChevronRight v-else :size="18" />
        <span v-if="!ui.sidebarCollapsed">Collapse</span>
      </button>
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        @click="logout"
      >
        <LogOut :size="18" />
        <span v-if="!ui.sidebarCollapsed">Logout</span>
      </button>
    </div>
  </aside>
</template>
