<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppLayout from './components/layout/AppLayout.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const authStore = useAuthStore()

// ponytail: guest routes (login, register, onboarding) render without app chrome
const isGuestRoute = computed(() => !!route.meta?.guest)

// ponytail: hydrate auth state on page load — if mm-csrf cookie exists, fetch the user profile
onMounted(async () => {
  if (document.cookie.includes('mm-csrf=') && !authStore.user) {
    await authStore.fetchMe().catch(() => {})
  }
})
</script>

<template>
  <AppLayout v-if="!isGuestRoute">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
  <router-view v-else v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <ToastContainer />
</template>
