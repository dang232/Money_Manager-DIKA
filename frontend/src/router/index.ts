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
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/insights', name: 'insights', component: () => import('@/views/InsightsView.vue') },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue'), meta: { guest: true } },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('mm-access-token')
  if (!to.meta?.guest && !token) return { name: 'login' }
  if (to.meta?.guest && token && to.name !== 'onboarding') return { name: 'dashboard' }
})

export default router
