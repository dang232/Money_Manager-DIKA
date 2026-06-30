import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
    { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/transactions', name: 'transactions', component: () => import('@/views/TransactionsView.vue') },
    { path: '/budget', name: 'budget', component: () => import('@/views/BudgetView.vue') },
    { path: '/categories', name: 'categories', component: () => import('@/views/CategoriesView.vue') },
    { path: '/reports', name: 'reports', component: () => import('@/views/ReportsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/insights', name: 'insights', component: () => import('@/views/InsightsView.vue') },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue'), meta: { guest: true } },
  ],
})

router.beforeEach((to) => {
  // ponytail: tokens are in HttpOnly cookies — use mm-csrf presence as a proxy for being logged in.
  // The authoritative check is authStore.isAuthenticated (user object set after login/fetchMe).
  // We use the mm-csrf cookie here because it is JS-readable (non-HttpOnly) and is only set
  // when the user has authenticated. Falls back to authStore if available.
  const hasSession = document.cookie.includes('mm-csrf=')
  if (!to.meta?.guest && !hasSession) return { name: 'login' }
  if (to.meta?.guest && hasSession && to.name !== 'onboarding') return { name: 'dashboard' }
})

export default router
